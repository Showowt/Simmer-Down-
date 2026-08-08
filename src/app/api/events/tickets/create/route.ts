/**
 * POST /api/events/tickets/create
 *
 * Creates a PENDING ticket order (an orders row marked with event_id), then
 * the caller runs the existing certified /api/payments/initiate → 3DS →
 * callback flow. When the order is confirmed, on_order_confirmed_issue_tickets
 * issues the QR ticket atomically. This route only reserves the intent + price;
 * it never touches the payment gateway.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  eventSlug: z.string().min(1).max(160),
  quantity: z.number().int().min(1).max(10),
  buyerName: z.string().trim().min(2, "Nombre requerido").max(120),
  // El Salvador phone — same shape the checkout enforces.
  buyerPhone: z
    .string()
    .trim()
    .regex(/^(\+?503)?[\s-]?\d{4}[\s-]?\d{4}$/, "Teléfono inválido (XXXX-XXXX)"),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`tickets_create:${ip}`, {
    maxRequests: 10,
    windowMs: 60_000,
  });
  if (!rl.success) return rateLimitResponse(rl);

  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json(
      { success: false, error: "invalid_json", message: "Solicitud inválida." },
      { status: 400 },
    );
  }
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "validation",
        message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
      },
      { status: 400 },
    );
  }
  const { eventSlug, quantity, buyerName, buyerPhone } = parsed.data;

  try {
    const supabase = createServiceClient();

    const { data: event } = await supabase
      .from("events")
      .select(
        "id, title, title_es, location_id, is_published, tickets_enabled, ticket_price, has_capacity_limit, max_capacity, tickets_sold, starts_at",
      )
      .eq("slug", eventSlug)
      .maybeSingle();

    if (!event || !event.is_published) {
      return NextResponse.json(
        { success: false, error: "not_found", message: "Evento no encontrado." },
        { status: 404 },
      );
    }
    if (!event.tickets_enabled || event.ticket_price == null || Number(event.ticket_price) <= 0) {
      return NextResponse.json(
        { success: false, error: "not_on_sale", message: "Este evento no tiene boletos a la venta." },
        { status: 409 },
      );
    }
    if (event.starts_at && new Date(event.starts_at).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: "ended", message: "Este evento ya pasó." },
        { status: 409 },
      );
    }
    // Capacity gate — never take money for a sold-out show.
    if (
      event.has_capacity_limit &&
      event.max_capacity != null &&
      event.tickets_sold + quantity > event.max_capacity
    ) {
      const left = Math.max(0, event.max_capacity - event.tickets_sold);
      return NextResponse.json(
        {
          success: false,
          error: "sold_out",
          message:
            left === 0
              ? "Boletos agotados."
              : `Solo quedan ${left} boletos disponibles.`,
          remaining: left,
        },
        { status: 409 },
      );
    }

    // Orders require a location; use the event's, else a default home location.
    let locationId = event.location_id;
    if (!locationId) {
      const { data: loc } = await supabase
        .from("locations")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      locationId = loc?.id ?? null;
    }
    if (!locationId) {
      return NextResponse.json(
        { success: false, error: "no_location", message: "Configuración incompleta." },
        { status: 500 },
      );
    }

    const unit = Math.round(Number(event.ticket_price) * 100) / 100;
    const total = Math.round(unit * quantity * 100) / 100;

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert([
        {
          location_id: locationId,
          order_type: "pickup",
          status: "pending",
          customer_name: buyerName,
          customer_phone: buyerPhone,
          subtotal: total,
          total_amount: total,
          order_source: "website",
          event_id: event.id,
          ticket_quantity: quantity,
          customer_notes: `Boletos: ${event.title_es || event.title} (x${quantity})`,
        },
      ])
      .select("id, order_number")
      .single();

    if (orderErr || !order) {
      logger.error("[tickets/create] order insert failed", orderErr);
      return NextResponse.json(
        { success: false, error: "order_failed", message: "No se pudo crear el pedido." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      quantity,
      unitPrice: unit,
      total,
      eventTitle: event.title_es || event.title,
    });
  } catch (error) {
    logger.error("[tickets/create] error", error);
    return NextResponse.json(
      { success: false, error: "internal", message: "Error interno." },
      { status: 500 },
    );
  }
}
