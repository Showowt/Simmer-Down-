// ============================================================
// Order channel — what an `orders` row actually is.
//
// `orders.order_type` only knows the FOOD channels (delivery / pickup /
// dine_in / takeout). Ticket purchases and estadía (lodging) bookings are
// also `orders` rows — flagged by `event_id` and `room_booking_id` — and
// are stored with order_type = 'pickup', so any surface that reads
// order_type alone shows a concert ticket as "Recoger". Client request
// (2026-11-22): "que se identificara compra de boleto, delivery,
// recoger, estadía".
//
// Same channel keys and colours as GET /api/admin/segments and
// components/admin/SegmentBreakdown so the panel reads as one system.
// ============================================================

export type OrderChannel =
  | "tickets"
  | "rooms"
  | "delivery"
  | "pickup"
  | "dine_in"
  | "takeout"
  | "otro";

export interface OrderChannelInput {
  order_type?: string | null;
  event_id?: string | null;
  room_booking_id?: string | null;
  /** Legacy UI field (never in the DB) — honoured so old fixtures still classify. */
  is_delivery?: boolean | null;
}

export interface OrderChannelMeta {
  key: OrderChannel;
  /** Spanish label — the admin panel is Spanish-only. */
  label: string;
  /** Receipt / print label (upper-case, ASCII-safe for thermal printers). */
  printLabel: string;
  color: string;
}

export const ORDER_CHANNEL_META: Record<OrderChannel, OrderChannelMeta> = {
  tickets: { key: "tickets", label: "Boletos", printLabel: "BOLETOS", color: "#FBBF24" },
  rooms: { key: "rooms", label: "Estadía", printLabel: "ESTADIA", color: "#A78BFA" },
  delivery: { key: "delivery", label: "Delivery", printLabel: "DELIVERY", color: "#FF6B35" },
  pickup: { key: "pickup", label: "Recoger", printLabel: "PARA RECOGER", color: "#4CAF50" },
  dine_in: { key: "dine_in", label: "En mesa", printLabel: "EN MESA", color: "#B8B0A8" },
  takeout: { key: "takeout", label: "Para llevar", printLabel: "PARA LLEVAR", color: "#B8B0A8" },
  otro: { key: "otro", label: "Otro", printLabel: "OTRO", color: "#6B6560" },
};

/**
 * PostgREST embed that attaches the event to each order on admin reads
 * (`.select(`*, ${ORDER_EVENT_EMBED}`)`). The FK hint is required: PostgREST
 * also sees orders ↔ events through event_tickets (a junction table) and
 * rejects the bare `events(...)` embed as ambiguous. Client request
 * (2026-11-25): "para identificar el evento podríamos hacer algo".
 */
export const ORDER_EVENT_EMBED =
  "event:events!orders_event_id_fkey(id,title,title_es,starts_at)";

export interface OrderEventInput extends OrderChannelInput {
  ticket_quantity?: number | null;
  event?: { title?: string | null; title_es?: string | null } | null;
}

/**
 * "Los Iracundos Live in Concert · 2 boletos" for a ticket order. Null for
 * every other channel, and for a ticket order whose event this reader cannot
 * see (RLS: staff without admin/manager only read published events) — the
 * row then shows plain "Boletos" instead of a blank line.
 */
export function ticketEventLine(o: OrderEventInput): string | null {
  if (orderChannel(o) !== "tickets") return null;
  const title = (o.event?.title ?? o.event?.title_es ?? "").trim();
  if (!title) return null;
  const qty = Number(o.ticket_quantity ?? 0);
  if (!Number.isFinite(qty) || qty <= 0) return title;
  return `${title} · ${qty} boleto${qty === 1 ? "" : "s"}`;
}

/** Classify an order. Tickets and estadía win over order_type (they are stored as 'pickup'). */
export function orderChannel(o: OrderChannelInput): OrderChannel {
  if (o.event_id) return "tickets";
  if (o.room_booking_id) return "rooms";
  const type = (o.order_type ?? "").toLowerCase();
  if (type === "delivery") return "delivery";
  if (type === "pickup") return "pickup";
  if (type === "dine_in") return "dine_in";
  if (type === "takeout") return "takeout";
  if (o.is_delivery) return "delivery";
  if (!type) return "pickup";
  return "otro";
}

export function orderChannelMeta(o: OrderChannelInput): OrderChannelMeta {
  return ORDER_CHANNEL_META[orderChannel(o)];
}

/** Food orders going out the door — the only ones that carry a delivery fee / address. */
export function isDeliveryOrder(o: OrderChannelInput): boolean {
  return orderChannel(o) === "delivery";
}

/** One-line delivery address from the canonical columns (the legacy `delivery_address` never existed in prod). */
export function deliveryAddressLine(o: {
  delivery_address_line1?: string | null;
  delivery_address_line2?: string | null;
  delivery_city?: string | null;
  delivery_address?: string | null;
}): string | null {
  const parts = [o.delivery_address_line1, o.delivery_address_line2, o.delivery_city]
    .map((p) => (p ?? "").trim())
    .filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  const legacy = (o.delivery_address ?? "").trim();
  return legacy || null;
}
