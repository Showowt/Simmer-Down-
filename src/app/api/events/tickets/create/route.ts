/**
 * POST /api/events/tickets/create
 *
 * Creates a PENDING ticket order (an orders row marked with event_id), then
 * the caller runs the existing certified /api/payments/initiate → 3DS →
 * callback flow. When the order is confirmed, on_order_confirmed_issue_tickets
 * issues one QR per ticket type atomically. This route only reserves the
 * intent + price; it never touches the payment gateway.
 *
 * Prices are ALWAYS computed here from the event row — ticket types, their
 * cupos and the service fee (lib/ticket-tiers). The browser only says which
 * types and how many.
 *
 * Body: { eventSlug, items: [{ tierId, quantity }], buyerName, buyerPhone }
 *       Checkout pages opened before ticket types existed send { quantity }
 *       instead of items; that still works for single-price events.
 *
 * Draft (unpublished) events can be test-bought by logged-in staff only, so
 * the team can check a new event's checkout before publishing it.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getActiveStaff } from "@/lib/staff-auth";
import {
  MAX_TICKETS_PER_TYPE,
  MAX_TICKET_TYPES,
  SINGLE_TIER_ID,
  eventSeatsLeft,
  lineTotals,
  money,
  onSiteTickets,
  type TicketLine,
} from "@/lib/ticket-tiers";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  tierId: z.string().trim().min(1).max(40),
  quantity: z.number().int().min(0).max(MAX_TICKETS_PER_TYPE, `Máximo ${MAX_TICKETS_PER_TYPE} boletos de cada tipo por compra.`),
});

const bodySchema = z.object({
  eventSlug: z.string().min(1).max(160),
  items: z.array(itemSchema).max(MAX_TICKET_TYPES).optional(),
  // Legacy single-price body.
  quantity: z.number().int().min(1).max(MAX_TICKETS_PER_TYPE).optional(),
  buyerName: z.string().trim().min(2, "Nombre requerido").max(120),
  // El Salvador phone — same shape the checkout enforces.
  buyerPhone: z
    .string()
    .trim()
    .regex(/^(\+?503)?[\s-]?\d{4}[\s-]?\d{4}$/, "Teléfono inválido (XXXX-XXXX)"),
});

function fail(status: number, error: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error, message, ...extra }, { status });
}

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
    return fail(400, "invalid_json", "Solicitud inválida.");
  }
  if (!parsed.success) {
    return fail(400, "validation", parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }
  const { eventSlug, items, quantity, buyerName, buyerPhone } = parsed.data;

  try {
    const supabase = createServiceClient();

    const { data: event, error: evErr } = await supabase
      .from("events")
      .select(
        "id, title, title_es, location_id, is_published, deleted_at, tickets_enabled, ticket_price, ticket_tiers, ticket_tier_sold, ticket_fee_percent, has_capacity_limit, max_capacity, tickets_sold, starts_at",
      )
      .eq("slug", eventSlug)
      .maybeSingle();
    if (evErr) throw evErr;

    if (!event || event.deleted_at) {
      return fail(404, "not_found", "Evento no encontrado.");
    }
    // Drafts: only logged-in staff (testing a new event before publishing it).
    let draftTest = false;
    if (!event.is_published) {
      const staff = await getActiveStaff();
      if (!staff) return fail(404, "not_found", "Evento no encontrado.");
      draftTest = true;
    }

    const offer = onSiteTickets(event);
    if (offer.mode === "none") {
      return fail(409, "not_on_sale", "Este evento no tiene boletos a la venta.");
    }
    if (event.starts_at && new Date(event.starts_at).getTime() < Date.now()) {
      return fail(409, "ended", "Este evento ya pasó.");
    }

    // ── What the buyer asked for ──────────────────────────────
    let requested: { tierId: string; quantity: number }[];
    if (items) {
      requested = items;
    } else if (quantity != null) {
      if (offer.mode === "tiers") {
        return fail(
          409,
          "choose_type",
          "Este evento ahora tiene varios tipos de boleto. Recarga la página y elige el tuyo.",
        );
      }
      requested = [{ tierId: SINGLE_TIER_ID, quantity }];
    } else {
      return fail(400, "validation", "Elige al menos un boleto.");
    }

    const wanted = new Map<string, number>();
    for (const r of requested) {
      if (r.quantity > 0) wanted.set(r.tierId, (wanted.get(r.tierId) ?? 0) + r.quantity);
    }
    if (wanted.size === 0) return fail(400, "validation", "Elige al menos un boleto.");

    // ── Price every line from the event row ───────────────────
    const lines: TicketLine[] = [];
    for (const [tierId, qty] of wanted) {
      const tier = offer.tiers.find((t) => t.id === tierId);
      if (!tier) {
        return fail(
          409,
          "type_unavailable",
          "Uno de los tipos de boleto ya no está a la venta. Recarga la página e intenta de nuevo.",
        );
      }
      const label = offer.mode === "tiers" ? ` «${tier.name}»` : "";
      if (qty > MAX_TICKETS_PER_TYPE) {
        return fail(400, "too_many", `Máximo ${MAX_TICKETS_PER_TYPE} boletos${label} por compra.`);
      }
      // Capacity gate — never take money for a sold-out type.
      if (tier.remaining != null && qty > tier.remaining) {
        return fail(
          409,
          "sold_out",
          tier.remaining === 0
            ? offer.mode === "tiers"
              ? `Los boletos${label} están agotados.`
              : "Boletos agotados."
            : `Solo quedan ${tier.remaining} boletos${label} disponibles.`,
          { tierId, remaining: tier.remaining },
        );
      }
      lines.push({
        tier_id: offer.mode === "tiers" ? tier.id : null,
        name: offer.mode === "tiers" ? tier.name : null,
        unit_price: tier.price,
        unit_fee: tier.fee,
        quantity: qty,
      });
    }

    const totals = lineTotals(lines);
    // Event-wide cupo across all types.
    const eventLeft = eventSeatsLeft(event);
    if (eventLeft != null && totals.seats > eventLeft) {
      return fail(
        409,
        "sold_out",
        eventLeft === 0 ? "Boletos agotados." : `Solo quedan ${eventLeft} boletos disponibles para este evento.`,
        { remaining: eventLeft },
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
      return fail(500, "no_location", "Configuración incompleta.");
    }

    const eventTitle = event.title_es || event.title;
    const what =
      offer.mode === "tiers"
        ? `${eventTitle} — ${lines.map((l) => `${l.name} ×${l.quantity}`).join(", ")}`
        : `${eventTitle} (x${totals.seats})`;
    const notes =
      `Boletos: ${what}` +
      (totals.fee > 0 ? ` · valor ${money(totals.base)} + cargo ${money(totals.fee)}` : "") +
      (draftTest ? " · PRUEBA del personal (evento en borrador)" : "");

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert([
        {
          location_id: locationId,
          order_type: "pickup",
          status: "pending",
          customer_name: buyerName,
          customer_phone: buyerPhone,
          // The fee is part of the ticket price (not a tax); the split lives in
          // ticket_lines, so the admin order view's subtotal = total still adds up.
          subtotal: totals.total,
          total_amount: totals.total,
          order_source: "website",
          event_id: event.id,
          ticket_quantity: totals.seats,
          ticket_lines: lines,
          customer_notes: notes.slice(0, 500),
        },
      ])
      .select("id, order_number")
      .single();

    if (orderErr || !order) {
      logger.error("[tickets/create] order insert failed", orderErr);
      return fail(500, "order_failed", "No se pudo crear el pedido.");
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      quantity: totals.seats,
      lines: lines.map((l) => ({
        tierId: l.tier_id,
        name: l.name,
        unitPrice: l.unit_price,
        unitFee: l.unit_fee,
        quantity: l.quantity,
      })),
      base: totals.base,
      fee: totals.fee,
      total: totals.total,
      eventTitle,
      draftTest,
    });
  } catch (error) {
    logger.error("[tickets/create] error", error);
    return fail(500, "internal", "Error interno.");
  }
}
