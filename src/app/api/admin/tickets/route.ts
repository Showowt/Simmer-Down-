/**
 * GET /api/admin/tickets — data for the door scanner (/admin/boletos). Staff only.
 *   ?token=<qr token>   → that ticket + its event (what a scan shows)
 *   ?event_id=<uuid>    → the event's guest list + how many are already inside
 *   (no params)         → events with ticket sales, for the event picker, plus
 *                         the one to preselect (live now or next up)
 *
 * event_tickets is service-role/staff-only, so reads use the service client
 * after the staff check. Responses: { data, error, message }.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { getActiveStaff } from "@/lib/staff-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { isLiveOrUpcoming } from "@/lib/events";
import {
  isTicketToken,
  type DoorEvent,
  type DoorRoster,
  type DoorTicket,
  type DoorTicketStatus,
} from "@/lib/ticket-door";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

// The picker shows shows from the last few days (late check-ins, reviewing
// who came) through everything announced.
const PICKER_LOOKBACK_DAYS = 3;

interface EventRow {
  id: string;
  title: string;
  title_es: string | null;
  starts_at: string;
  ends_at: string | null;
  recurrence: string | null;
  tickets_enabled: boolean | null;
}

interface TicketRow {
  qr_token: string;
  event_id: string;
  quantity: number;
  admitted_count: number;
  status: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  oversold: boolean | null;
  checked_in_at: string | null;
  orders: { order_number: string | null } | { order_number: string | null }[] | null;
}

const TICKET_SELECT =
  "qr_token, event_id, quantity, admitted_count, status, buyer_name, buyer_phone, oversold, checked_in_at, orders(order_number)";

function fail(status: number, error: string, message: string) {
  return NextResponse.json({ data: null, error, message }, { status });
}

function eventTitle(e: Pick<EventRow, "title" | "title_es">): string {
  return e.title_es || e.title || "Evento";
}

function toStatus(s: string): DoorTicketStatus {
  return s === "used" || s === "void" ? s : "valid";
}

function toDoorTicket(row: TicketRow, event: DoorTicket["event"]): DoorTicket {
  const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
  return {
    token: row.qr_token,
    quantity: row.quantity,
    admitted: row.admitted_count,
    status: toStatus(row.status),
    buyerName: row.buyer_name,
    buyerPhone: row.buyer_phone,
    orderNumber: order?.order_number ?? null,
    oversold: !!row.oversold,
    checkedInAt: row.checked_in_at,
    event,
  };
}

function toDoorEvent(e: EventRow, tickets: Pick<TicketRow, "quantity" | "admitted_count" | "status">[]): DoorEvent {
  const live = tickets.filter((t) => t.status !== "void");
  return {
    id: e.id,
    title: eventTitle(e),
    startsAt: e.starts_at,
    liveOrUpcoming: isLiveOrUpcoming({ starts_at: e.starts_at, ends_at: e.ends_at, recurrence: e.recurrence }),
    ticketsEnabled: !!e.tickets_enabled,
    orders: live.length,
    seats: live.reduce((sum, t) => sum + t.quantity, 0),
    admitted: live.reduce((sum, t) => sum + t.admitted_count, 0),
  };
}

export async function GET(request: NextRequest) {
  const staff = await getActiveStaff();
  if (!staff) return fail(401, "unauthorized", "Sesión expirada. Vuelve a iniciar sesión.");

  // A busy door scans a lot; this only stops a runaway loop.
  const rl = checkRateLimit(`door_read:${staff.id}`, { maxRequests: 300, windowMs: 60_000 });
  if (!rl.success) return fail(429, "rate_limited", "Demasiadas consultas. Espera unos segundos.");

  const params = new URL(request.url).searchParams;
  const token = params.get("token");
  const eventId = params.get("event_id");

  try {
    const service = createServiceClient();

    // ── One ticket (a scan) ─────────────────────────────────
    if (token !== null) {
      if (!isTicketToken(token)) return fail(400, "bad_token", "Código no válido.");
      const { data: row, error } = await service
        .from("event_tickets")
        .select(TICKET_SELECT)
        .eq("qr_token", token)
        .maybeSingle();
      if (error) throw error;
      if (!row) return fail(404, "not_found", "Este QR no corresponde a ningún boleto.");
      const ticketRow = row as TicketRow;

      const { data: ev, error: evErr } = await service
        .from("events")
        .select("id, title, title_es, starts_at")
        .eq("id", ticketRow.event_id)
        .maybeSingle();
      if (evErr) throw evErr;
      const event = ev
        ? { id: String(ev.id), title: eventTitle(ev as EventRow), startsAt: (ev.starts_at as string) ?? null }
        : null;
      return NextResponse.json({ data: toDoorTicket(ticketRow, event), error: null, message: "ok" });
    }

    // ── Guest list for one event ────────────────────────────
    if (eventId !== null) {
      if (!z.string().uuid().safeParse(eventId).success) return fail(400, "bad_event", "Evento no válido.");
      const [{ data: ev, error: evErr }, { data: rows, error: tErr }] = await Promise.all([
        service
          .from("events")
          .select("id, title, title_es, starts_at, ends_at, recurrence, tickets_enabled")
          .eq("id", eventId)
          .maybeSingle(),
        service.from("event_tickets").select(TICKET_SELECT).eq("event_id", eventId),
      ]);
      if (evErr) throw evErr;
      if (tErr) throw tErr;
      if (!ev) return fail(404, "not_found", "Evento no encontrado.");

      const eventRow = ev as EventRow;
      const ticketRows = (rows ?? []) as TicketRow[];
      const ref = { id: eventRow.id, title: eventTitle(eventRow), startsAt: eventRow.starts_at };
      const tickets = ticketRows
        .map((r) => toDoorTicket(r, ref))
        .sort((a, b) => (a.buyerName ?? "").localeCompare(b.buyerName ?? "", "es"));
      const roster: DoorRoster = { event: toDoorEvent(eventRow, ticketRows), tickets };
      return NextResponse.json({ data: roster, error: null, message: "ok" });
    }

    // ── Event picker ────────────────────────────────────────
    const since = new Date(Date.now() - PICKER_LOOKBACK_DAYS * 86_400_000).toISOString();
    const { data: evs, error: evsErr } = await service
      .from("events")
      .select("id, title, title_es, starts_at, ends_at, recurrence, tickets_enabled")
      .is("deleted_at", null)
      .gte("starts_at", since)
      .order("starts_at", { ascending: true })
      .limit(60);
    if (evsErr) throw evsErr;
    const eventRows = (evs ?? []) as EventRow[];

    const ids = eventRows.map((e) => e.id);
    const { data: tix, error: tixErr } = ids.length
      ? await service.from("event_tickets").select("event_id, quantity, admitted_count, status").in("event_id", ids)
      : { data: [], error: null };
    if (tixErr) throw tixErr;
    const byEvent = new Map<string, Pick<TicketRow, "quantity" | "admitted_count" | "status">[]>();
    for (const t of (tix ?? []) as Pick<TicketRow, "event_id" | "quantity" | "admitted_count" | "status">[]) {
      const list = byEvent.get(t.event_id) ?? [];
      list.push(t);
      byEvent.set(t.event_id, list);
    }

    const events = eventRows
      .map((e) => toDoorEvent(e, byEvent.get(e.id) ?? []))
      .filter((e) => e.ticketsEnabled || e.orders > 0);
    const defaultEventId = events.find((e) => e.liveOrUpcoming)?.id ?? events[events.length - 1]?.id ?? null;

    return NextResponse.json({ data: { events, defaultEventId }, error: null, message: "ok" });
  } catch (error) {
    logger.error("[admin/tickets] GET failed", error, { token: token ? "set" : "none", eventId });
    return fail(500, "db_error", "No se pudo cargar la información. Revisa la conexión e intenta de nuevo.");
  }
}
