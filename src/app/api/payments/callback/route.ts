/**
 * POST /api/payments/callback
 *
 * MerchantResponseUrl invoked from within the 3DS iframe.
 *
 * Against the production schema, payment state lives in the `payments` table.
 * We look up the active payment row by spi_token, finalize via /spi/payment,
 * then update the row (status='completed' or 'failed') and return HTML that
 * breaks out of the iframe via HMAC-signed postMessage.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";

import logger from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/service";
import { ptPayment, PowertranzError } from "@/lib/powertranz/client";
import { stripCardFields } from "@/lib/powertranz/sanitize";
import type { SaleResponse } from "@/lib/powertranz/types";

function hmacSign(payload: string): string {
  const secret = process.env.PAYMENT_CALLBACK_SECRET;
  if (!secret) throw new Error("PAYMENT_CALLBACK_SECRET is not set");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function buildBreakoutHtml(params: {
  orderId: string;
  status: "paid" | "failed";
  message?: string;
  authorizationCode?: string | null;
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const origin = appUrl ? new URL(appUrl).origin : "*";
  const sig = hmacSign(`${params.orderId}|${params.status}`);
  const safeMessage = (params.message || "").replace(/[<>&"']/g, "");

  const payloadJson = JSON.stringify({
    type: "pt_result",
    orderId: params.orderId,
    status: params.status,
    message: safeMessage,
    authorizationCode: params.authorizationCode || null,
    sig,
  });

  const fallbackUrl =
    params.status === "paid"
      ? `${appUrl}/orders?id=${params.orderId}&paid=1`
      : `${appUrl}/checkout?order=${params.orderId}&error=${encodeURIComponent(params.status)}`;

  return `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8">
<title>Procesando pago...</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;padding:0;background:#0a0a0a;color:#f0f0f3;font-family:system-ui,sans-serif;height:100vh;display:flex;align-items:center;justify-content:center;text-align:center}.spin{width:40px;height:40px;border:2px solid #c9a96e33;border-top-color:#c9a96e;border-radius:50%;animation:sp 0.8s linear infinite;margin:0 auto 20px}@keyframes sp{to{transform:rotate(360deg)}}</style>
</head><body>
<div><div class="spin"></div><div>Finalizando pago…</div></div>
<script>(function(){var payload=${payloadJson};var targetOrigin=${JSON.stringify(origin)};try{if(window.parent&&window.parent!==window){window.parent.postMessage(payload,targetOrigin);}}catch(e){}setTimeout(function(){try{window.top.location.href=${JSON.stringify(fallbackUrl)};}catch(e){window.location.href=${JSON.stringify(fallbackUrl)};}},6000);})();</script>
</body></html>`;
}

function extractCallback(form: FormData): {
  spiToken: string | null;
  response: SaleResponse | null;
} {
  const spiTokenRaw = form.get("SpiToken");
  const responseField = form.get("Response");
  let response: SaleResponse | null = null;
  if (typeof responseField === "string" && responseField.length > 0) {
    try {
      response = JSON.parse(responseField) as SaleResponse;
    } catch {
      try {
        response = JSON.parse(decodeURIComponent(responseField)) as SaleResponse;
      } catch {
        response = null;
      }
    }
  }
  return {
    spiToken: typeof spiTokenRaw === "string" ? spiTokenRaw : null,
    response,
  };
}

export async function POST(request: NextRequest) {
  const endpoint = "/api/payments/callback";

  let form: FormData;
  try {
    form = await request.formData();
  } catch (err) {
    logger.api.error(endpoint, err, { hint: "expected form body" });
    return new NextResponse("Invalid callback body", { status: 400 });
  }

  const { spiToken: rawToken, response: parsedResp } = extractCallback(form);
  const spiToken = rawToken ?? parsedResp?.SpiToken ?? null;
  if (!spiToken) {
    return new NextResponse("Missing SpiToken", { status: 400 });
  }

  const supabase = createServiceClient();

  // Look up the payment row, not the order.
  const { data: payment, error: pErr } = await supabase
    .from("payments")
    .select("id, order_id, status, card_brand, card_last_four")
    .eq("spi_token", spiToken)
    .maybeSingle();

  if (pErr || !payment) {
    logger.warn("Callback for unknown spi_token");
    return new NextResponse("Unknown SPI token", { status: 404 });
  }

  await supabase.from("payment_attempts").insert({
    order_id: payment.order_id,
    payment_id: payment.id,
    stage: "3ds_callback",
    request_payload: null,
    response_payload: parsedResp ? (stripCardFields(parsedResp) as never) : null,
    iso_response_code: parsedResp?.IsoResponseCode ?? null,
    response_message: parsedResp?.ResponseMessage ?? null,
    spi_token: spiToken,
    transaction_identifier: parsedResp?.TransactionIdentifier ?? null,
    http_status: 200,
  });

  // Already completed — return breakout without re-finalizing.
  if (payment.status === "completed") {
    return new NextResponse(
      buildBreakoutHtml({ orderId: payment.order_id, status: "paid" }),
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const threeDsOk =
    parsedResp?.IsoResponseCode === "3D0" ||
    parsedResp?.IsoResponseCode === "SP1";

  if (!threeDsOk) {
    const msg =
      parsedResp?.ResponseMessage ||
      "Autenticación 3D-Secure no completada. Intenta de nuevo.";
    await supabase
      .from("payments")
      .update({
        status: "failed",
        error_code: parsedResp?.IsoResponseCode ?? "3ds_unknown",
        failure_reason: msg,
        processor_response: parsedResp
          ? (stripCardFields(parsedResp) as never)
          : null,
        failed_at: new Date().toISOString(),
        spi_token: null,
      })
      .eq("id", payment.id);

    return new NextResponse(
      buildBreakoutHtml({
        orderId: payment.order_id,
        status: "failed",
        message: msg,
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  // Finalize capture via /spi/payment with the same SPI token.
  let payResp: SaleResponse;
  try {
    payResp = await ptPayment(spiToken);
  } catch (err) {
    const isPt = err instanceof PowertranzError;
    logger.api.error(endpoint, err, { orderId: payment.order_id });

    await supabase.from("payment_attempts").insert({
      order_id: payment.order_id,
      payment_id: payment.id,
      stage: "payment",
      request_payload: null,
      response_payload: null,
      http_status: isPt ? err.httpStatus : 0,
      error_detail: err instanceof Error ? err.message : String(err),
      spi_token: spiToken,
    });

    await supabase
      .from("payments")
      .update({
        status: "failed",
        error_code: "capture_failed",
        failure_reason: "No se pudo finalizar el pago tras autenticación.",
        failed_at: new Date().toISOString(),
        spi_token: null,
      })
      .eq("id", payment.id);

    return new NextResponse(
      buildBreakoutHtml({
        orderId: payment.order_id,
        status: "failed",
        message: "No se pudo finalizar el pago.",
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  await supabase.from("payment_attempts").insert({
    order_id: payment.order_id,
    payment_id: payment.id,
    stage: "payment",
    request_payload: null,
    response_payload: stripCardFields(payResp) as never,
    iso_response_code: payResp.IsoResponseCode,
    response_message: payResp.ResponseMessage,
    spi_token: spiToken,
    transaction_identifier: payResp.TransactionIdentifier ?? null,
    http_status: 200,
  });

  const approved = payResp.Approved && payResp.IsoResponseCode === "00";

  await supabase
    .from("payments")
    .update({
      status: approved ? "completed" : "failed",
      authorization_code: payResp.AuthorizationCode ?? null,
      card_brand: payResp.CardBrand ?? payment.card_brand,
      processor_response: stripCardFields(payResp) as never,
      paid_at: approved ? new Date().toISOString() : null,
      failed_at: approved ? null : new Date().toISOString(),
      error_code: approved ? null : payResp.IsoResponseCode,
      failure_reason: approved ? null : payResp.ResponseMessage,
      spi_token: null,
    })
    .eq("id", payment.id);

  // Promote order status to 'confirmed' on successful payment.
  if (approved) {
    await supabase
      .from("orders")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("id", payment.order_id);
  }

  return new NextResponse(
    buildBreakoutHtml({
      orderId: payment.order_id,
      status: approved ? "paid" : "failed",
      message: approved ? "" : payResp.ResponseMessage,
      authorizationCode: payResp.AuthorizationCode,
    }),
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET() {
  return new NextResponse("Powertranz callback endpoint — POST only", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
