/**
 * POST /api/delivery/webhook/[provider]
 *
 * Inbound webhook for third-party delivery platforms (Uber Eats, DoorDash,
 * PedidosYa, Hugo). Verifies the signature, normalizes the payload, and
 * creates an order against the PRODUCTION orders schema.
 *
 * Against the production schema:
 *   - orders: status ∈ order_status enum; items live in `order_items` table;
 *     no items_json / total / notes — uses `customer_notes`, `total_amount`.
 *   - payments: each third-party-settled order gets a companion payments row
 *     with payment_method=<provider>, status='completed', paid_at=now.
 */

import { NextRequest, NextResponse } from "next/server";

import logger from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/service";
import type { DeliveryAdapter } from "@/lib/delivery/types";
import { uberEatsAdapter } from "@/lib/delivery/adapters/uber-eats";
import { doorDashAdapter } from "@/lib/delivery/adapters/doordash";
import { pedidosYaAdapter } from "@/lib/delivery/adapters/pedidos-ya";
import { hugoAdapter } from "@/lib/delivery/adapters/hugo";

const ADAPTERS: Record<string, DeliveryAdapter> = {
  uber_eats: uberEatsAdapter,
  doordash: doorDashAdapter,
  pedidos_ya: pedidosYaAdapter,
  hugo: hugoAdapter,
};

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ provider: string }> },
) {
  const { provider } = await ctx.params;
  const adapter = ADAPTERS[provider];
  if (!adapter) {
    return NextResponse.json(
      { error: "Unknown provider" },
      { status: 404 },
    );
  }

  const rawBody = await request.text();

  const verified = await adapter.verify(request.headers, rawBody);
  if (!verified) {
    logger.warn("Delivery webhook signature mismatch", { provider });
    return NextResponse.json(
      { error: "Signature verification failed" },
      { status: 401 },
    );
  }

  let normalized;
  try {
    normalized = adapter.normalize(rawBody);
  } catch (err) {
    logger.api.error("/api/delivery/webhook", err, { provider });
    return NextResponse.json(
      { error: "Payload parse failed" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  // Resolve location by slug.
  let locationId: string | null = null;
  if (normalized.locationSlug) {
    const { data: loc } = await supabase
      .from("locations")
      .select("id")
      .eq("slug", normalized.locationSlug)
      .maybeSingle();
    locationId = loc?.id ?? null;
  }
  if (!locationId) {
    const { data: first } = await supabase
      .from("locations")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    locationId = first?.id ?? null;
  }
  if (!locationId) {
    return NextResponse.json(
      { error: "No matching location" },
      { status: 422 },
    );
  }

  // Idempotent lookup.
  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("order_source", normalized.provider)
    .eq("external_order_id", normalized.externalOrderId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      success: true,
      orderId: existing.id,
      duplicate: true,
    });
  }

  // Insert order against real schema.
  const orderInsert = {
    location_id: locationId,
    order_type: normalized.orderType,
    status: "confirmed", // Third-party orders are already accepted.
    placed_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    delivery_address_line1: normalized.deliveryAddress?.line1 ?? null,
    delivery_city: normalized.deliveryAddress?.city ?? null,
    delivery_instructions: normalized.deliveryAddress?.notes ?? null,
    customer_name: normalized.customer.name,
    customer_phone: normalized.customer.phone ?? "",
    customer_email: normalized.customer.email ?? null,
    customer_notes: normalized.notes ?? null,
    subtotal: normalized.subtotal,
    delivery_fee: normalized.deliveryFee,
    total_amount: normalized.total,
    order_source: normalized.provider,
    external_order_id: normalized.externalOrderId,
    external_payload: normalized.raw as never,
  };

  const { data: order, error: insertErr } = await supabase
    .from("orders")
    .insert(orderInsert)
    .select("id, order_number")
    .single();

  if (insertErr || !order) {
    logger.api.error("/api/delivery/webhook", insertErr, { provider });
    return NextResponse.json(
      { error: "Order insert failed", detail: insertErr?.message },
      { status: 500 },
    );
  }

  // Insert order_items (normalized table).
  if (normalized.items.length > 0) {
    await supabase.from("order_items").insert(
      normalized.items.map((it) => ({
        order_id: order.id,
        item_name: it.name,
        item_description: it.description ?? null,
        unit_price: it.unitPrice,
        quantity: it.quantity,
        line_total: it.unitPrice * it.quantity,
      })),
    );
  }

  // Companion payment row — third-party already settled.
  await supabase.from("payments").insert({
    order_id: order.id,
    amount: normalized.total,
    currency: "USD",
    payment_method: normalized.provider,
    status: "completed",
    paid_at: new Date().toISOString(),
    metadata: { source: "third_party_webhook", provider } as never,
  });

  logger.api.response("/api/delivery/webhook", 200, 0, {
    provider,
    orderId: order.id,
  });

  return NextResponse.json({
    success: true,
    orderId: order.id,
    orderNumber: order.order_number,
  });
}

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ provider: string }> },
) {
  const { provider } = await ctx.params;
  return NextResponse.json({
    status: ADAPTERS[provider] ? "ok" : "unknown_provider",
    provider,
    method: "POST",
  });
}
