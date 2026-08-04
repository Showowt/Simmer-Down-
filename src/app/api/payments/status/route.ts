/**
 * GET /api/payments/status?orderId=<uuid>
 *
 * Fallback polling endpoint used by the 3DS modal. Returns the latest
 * payment row for an order (from the `payments` table).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import logger from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const querySchema = z.object({
  orderId: z.string().uuid("orderId must be a UUID"),
});

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rl = checkRateLimit(`pay_status:${clientIp}`, {
    maxRequests: 60,
    windowMs: 60_000,
  });
  if (!rl.success) return rateLimitResponse(rl);

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    orderId: searchParams.get("orderId"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid orderId" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  // Fetch order basics.
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, order_number, status, total_amount")
    .eq("id", parsed.data.orderId)
    .maybeSingle();

  if (orderErr || !order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 },
    );
  }

  // Fetch latest payment row.
  const { data: payment } = await supabase
    .from("payments")
    .select(
      "id, status, payment_method, card_brand, card_last_four, authorization_code, failure_reason, paid_at, failed_at",
    )
    .eq("order_id", order.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const paymentStatus = payment?.status ?? "pending";
  const externalStatus =
    paymentStatus === "completed"
      ? "paid"
      : paymentStatus === "processing"
        ? "processing_3ds"
        : paymentStatus;

  // SimmerLovers points awarded by the on_order_confirmed_award_loyalty
  // trigger — present only when the order's phone matched a member.
  let loyalty: { pointsEarned: number; balance: number } | null = null;
  if (externalStatus === "paid") {
    const { data: earnTx } = await supabase
      .from("loyalty_transactions")
      .select("points, balance_after")
      .eq("order_id", order.id)
      .eq("transaction_type", "earned")
      .maybeSingle();
    if (earnTx && earnTx.points > 0) {
      loyalty = { pointsEarned: earnTx.points, balance: earnTx.balance_after };
    }
  }

  // Strip sensitive fields from unauthenticated response.
  // authorizationCode, cardBrand, cardLast4 are only needed on the
  // authenticated order page — the 3DS modal only needs paymentStatus.
  return NextResponse.json({
    success: true,
    order: {
      id: order.id,
      orderNumber: order.order_number,
      paymentStatus: externalStatus,
      status: order.status,
      errorMessage:
        externalStatus === "failed" ? (payment?.failure_reason ?? null) : null,
      total: Number(order.total_amount ?? 0),
    },
    loyalty,
  });
}
