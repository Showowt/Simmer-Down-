/**
 * POST /api/payments/void
 *
 * Admin-only. Voids a prior Powertranz authorization and flips the `payments`
 * row status to 'cancelled'. Before settlement (same business day).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import logger from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/service";
import { ptVoid, PowertranzError } from "@/lib/powertranz/client";
import { stripCardFields } from "@/lib/powertranz/sanitize";

const bodySchema = z.object({
  paymentId: z.string().uuid(),
});

async function requireStaff(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    // Check `staff` table (production schema).
    const { data: staff } = await supabase
      .from("staff")
      .select("id, role, is_active")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    return !!staff && staff.is_active === true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireStaff())) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid body" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const { data: payment, error } = await supabase
    .from("payments")
    .select("id, order_id, powertranz_transaction_id, status")
    .eq("id", parsed.data.paymentId)
    .single();

  if (error || !payment) {
    return NextResponse.json(
      { success: false, error: "Payment not found" },
      { status: 404 },
    );
  }
  if (!payment.powertranz_transaction_id) {
    return NextResponse.json(
      { success: false, error: "Not a Powertranz payment" },
      { status: 400 },
    );
  }

  let voidResp;
  try {
    voidResp = await ptVoid({
      TransactionIdentifier: payment.powertranz_transaction_id,
    });
  } catch (err) {
    logger.api.error("/api/payments/void", err, { paymentId: payment.id });
    return NextResponse.json(
      {
        success: false,
        error: "Void failed",
        message: err instanceof PowertranzError ? err.message : "Gateway error",
      },
      { status: 502 },
    );
  }

  await supabase.from("payment_attempts").insert({
    order_id: payment.order_id,
    payment_id: payment.id,
    stage: "void",
    request_payload: {
      TransactionIdentifier: payment.powertranz_transaction_id,
    } as never,
    response_payload: stripCardFields(voidResp) as never,
    iso_response_code: voidResp.IsoResponseCode,
    response_message: voidResp.ResponseMessage,
    transaction_identifier: voidResp.TransactionIdentifier ?? null,
    http_status: 200,
  });

  const ok = voidResp.Approved && voidResp.IsoResponseCode === "00";
  if (ok) {
    await supabase
      .from("payments")
      .update({
        status: "cancelled",
        processor_response: stripCardFields(voidResp) as never,
      })
      .eq("id", payment.id);
  }

  return NextResponse.json({
    success: ok,
    isoResponseCode: voidResp.IsoResponseCode,
    message: voidResp.ResponseMessage,
  });
}
