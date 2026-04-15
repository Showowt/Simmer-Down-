/**
 * POST /api/payments/initiate
 *
 * Kicks off a Powertranz 3DS 2.0 Sale for an existing order.
 *
 * Against the production schema, payment state lives in the `payments` table
 * (not on `orders`). Each attempt creates a new `payments` row with
 * payment_method='powertranz', status='processing'. Idempotency guard: if an
 * existing row for the order is already in 'processing' status, return 409.
 *
 * Flow:
 *   1. Validate body (Zod: orderId + card + billing).
 *   2. Fetch order total_amount from `orders`.
 *   3. Idempotency: reject if a processing payment already exists.
 *   4. INSERT payments row with placeholder fields + our transactionIdentifier.
 *   5. Call Powertranz /spi/sale with ThreeDSecure=true.
 *   6. UPDATE the payments row with spi_token + initial processor_response.
 *   7. Return { spiToken, redirectData, orderId, paymentId } to client.
 *
 * Card data NEVER persisted — only card_last_four + card_brand.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import logger from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { initiatePaymentSchema } from "@/lib/powertranz/schemas";
import { ptSale, PowertranzError } from "@/lib/powertranz/client";
import {
  stripCardFields,
  last4,
  inferBrand,
} from "@/lib/powertranz/sanitize";
import { formatZodErrors, validationErrorResponse } from "@/lib/validation";
import type { SaleRequest } from "@/lib/powertranz/types";

interface InitiateSuccess {
  success: true;
  spiToken: string;
  redirectData: string;
  orderId: string;
  paymentId: string;
}

interface InitiateFailure {
  success: false;
  error: string;
  message: string;
}

type InitiateResponse = InitiateSuccess | InitiateFailure;

export async function POST(
  request: NextRequest,
): Promise<NextResponse<InitiateResponse>> {
  const endpoint = "/api/payments/initiate";
  const startTime = Date.now();
  const clientIp = getClientIp(request);

  const rl = checkRateLimit(`pay_init:${clientIp}`, {
    maxRequests: 5,
    windowMs: 60_000,
  });
  if (!rl.success) {
    return rateLimitResponse(rl) as NextResponse<InitiateResponse>;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON", message: "Cuerpo inválido." },
      { status: 400 },
    );
  }

  const parsed = initiatePaymentSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(
      formatZodErrors(parsed.error),
    ) as NextResponse<InitiateResponse>;
  }
  const { orderId, card, billing } = parsed.data;
  const cardLast4 = last4(card.pan);
  const cardBrand = inferBrand(card.pan);

  const supabase = createServiceClient();

  // Fetch order.
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, total_amount, order_number, customer_email")
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr || !order) {
    return NextResponse.json(
      { success: false, error: "Order not found", message: "Pedido no encontrado." },
      { status: 404 },
    );
  }

  const amount = Number(order.total_amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { success: false, error: "Invalid amount", message: "Total inválido." },
      { status: 400 },
    );
  }

  // Idempotency: reject if a processing payment already exists for this order.
  const { data: existing } = await supabase
    .from("payments")
    .select("id, status")
    .eq("order_id", orderId)
    .in("status", ["processing", "completed"])
    .limit(1);

  if (existing && existing.length > 0) {
    const row = existing[0];
    return NextResponse.json(
      {
        success: false,
        error: "Payment in flight",
        message:
          row.status === "completed"
            ? "Este pedido ya fue pagado."
            : "Ya hay un intento de pago en curso.",
      },
      { status: 409 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  if (!appUrl) {
    logger.error("NEXT_PUBLIC_APP_URL is not set");
    return NextResponse.json(
      { success: false, error: "Server misconfigured", message: "Error de servidor." },
      { status: 500 },
    );
  }

  const transactionIdentifier = randomUUID();

  // Create payments row up-front (status='processing'). Any failure from
  // here on updates this row rather than leaving orphaned state.
  const { data: paymentRow, error: insertErr } = await supabase
    .from("payments")
    .insert({
      order_id: orderId,
      amount,
      currency: "USD",
      payment_method: "powertranz",
      status: "processing",
      card_last_four: cardLast4,
      card_brand: cardBrand,
      powertranz_transaction_id: transactionIdentifier,
      powertranz_order_identifier: orderId,
      initiated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertErr || !paymentRow) {
    logger.api.error(endpoint, insertErr, { orderId });
    return NextResponse.json(
      {
        success: false,
        error: "Payment init failed",
        message: "No se pudo iniciar el registro del pago.",
      },
      { status: 500 },
    );
  }

  const paymentId = paymentRow.id;

  const saleRequest: SaleRequest = {
    TransactionIdentifier: transactionIdentifier,
    TotalAmount: Math.round(amount * 100) / 100,
    CurrencyCode: process.env.FAC_CURRENCY_CODE || "840",
    ThreeDSecure: true,
    Source: {
      CardPan: card.pan,
      CardCvv: card.cvv,
      CardExpiration: card.exp,
      CardholderName: card.holder,
    },
    OrderIdentifier: orderId,
    AddressMatch: false,
    BillingAddress: {
      Line1: billing.line1,
      Line2: billing.line2 || undefined,
      City: billing.city,
      State: billing.state || undefined,
      PostalCode: billing.postalCode,
      CountryCode: billing.countryCode,
      EmailAddress: billing.email || order.customer_email || undefined,
      PhoneNumber: billing.phone || undefined,
    },
    ExtendedData: {
      ThreeDSecure: { ChallengeWindowSize: 4, ChallengeIndicator: "01" },
      MerchantResponseUrl: `${appUrl}/api/payments/callback`,
    },
  };

  let saleResp;
  try {
    saleResp = await ptSale(saleRequest);
  } catch (err) {
    const isPt = err instanceof PowertranzError;
    logger.api.error(endpoint, err, { orderId, paymentId });

    await supabase
      .from("payments")
      .update({
        status: "failed",
        failure_reason: isPt ? err.message : "Gateway network error",
        error_code: "gateway_unreachable",
        failed_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    await supabase.from("payment_attempts").insert({
      order_id: orderId,
      payment_id: paymentId,
      stage: "sale",
      request_payload: stripCardFields(saleRequest) as never,
      response_payload: null,
      http_status: isPt ? err.httpStatus : 0,
      error_detail: err instanceof Error ? err.message : String(err),
      transaction_identifier: transactionIdentifier,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Gateway error",
        message: "No se pudo contactar la pasarela de pago. Intenta de nuevo.",
      },
      { status: 502 },
    );
  }

  await supabase.from("payment_attempts").insert({
    order_id: orderId,
    payment_id: paymentId,
    stage: "sale",
    request_payload: stripCardFields(saleRequest) as never,
    response_payload: stripCardFields(saleResp) as never,
    iso_response_code: saleResp.IsoResponseCode,
    response_message: saleResp.ResponseMessage,
    spi_token: saleResp.SpiToken,
    transaction_identifier: transactionIdentifier,
    http_status: 200,
  });

  if (
    saleResp.IsoResponseCode !== "SP4" ||
    !saleResp.SpiToken ||
    !saleResp.RedirectData
  ) {
    await supabase
      .from("payments")
      .update({
        status: "failed",
        error_code: saleResp.IsoResponseCode,
        failure_reason: saleResp.ResponseMessage,
        processor_response: stripCardFields(saleResp) as never,
        failed_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    return NextResponse.json(
      {
        success: false,
        error: "Sale preprocessing failed",
        message:
          saleResp.ResponseMessage ||
          "La pasarela no aceptó el pago. Verifica los datos e intenta de nuevo.",
      },
      { status: 400 },
    );
  }

  // Happy path: SP4. Persist SPI token + mark metadata for later lookup.
  await supabase
    .from("payments")
    .update({
      spi_token: saleResp.SpiToken,
      metadata: { redirectDataStored: false } as never,
    })
    .eq("id", paymentId);

  logger.api.response(endpoint, 200, Date.now() - startTime, {
    orderId,
    paymentId,
    spiPrefix: saleResp.SpiToken.slice(0, 8),
  });

  return NextResponse.json({
    success: true,
    spiToken: saleResp.SpiToken,
    redirectData: saleResp.RedirectData,
    orderId,
    paymentId,
  });
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/payments/initiate",
    method: "POST",
  });
}
