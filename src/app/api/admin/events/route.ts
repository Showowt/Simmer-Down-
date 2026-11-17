/**
 * DELETE /api/admin/events?id=<uuid> — take an event off the site and out of
 * the admin panel.
 *
 * Soft delete (migration 20261116_events_soft_delete_partial_checkin): ticket
 * orders and issued tickets reference the event, so the row is kept — stamped
 * deleted_at, unpublished, taken off sale, and its slug freed so a new event
 * can reuse the name. Events with sold tickets are refused: those buyers hold
 * valid QR codes, and unpublishing ("Publicado" → "Borrador") hides the event
 * instead. Abandoned checkouts don't block — if one of them still completes a
 * payment, the ticket is issued normally because the event row still exists.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { getActiveStaff, type StaffRole } from "@/lib/staff-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

// Same roles the events RLS DELETE policy allowed (is_staff admin/manager), plus owner.
const CAN_DELETE: ReadonlySet<StaffRole> = new Set<StaffRole>(["owner", "admin", "manager"]);
// Orders in these states were paid (pending = abandoned checkout, never charged).
const PAID_ORDER_STATUSES = ["confirmed", "preparing", "ready", "out_for_delivery", "completed"];

function fail(status: number, error: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ data: null, error, message, ...extra }, { status });
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export async function DELETE(request: NextRequest) {
  const staff = await getActiveStaff();
  if (!staff) return fail(401, "unauthorized", "Sesión expirada. Vuelve a iniciar sesión.");
  if (!CAN_DELETE.has(staff.role)) return fail(403, "forbidden", "Tu usuario no tiene permiso para eliminar eventos.");

  const rl = checkRateLimit(`events_delete:${staff.id}`, { maxRequests: 30, windowMs: 60_000 });
  if (!rl.success) return fail(429, "rate_limited", "Demasiadas solicitudes. Espera un momento.");

  const idParse = z.string().uuid().safeParse(new URL(request.url).searchParams.get("id"));
  if (!idParse.success) return fail(400, "bad_id", "Evento no válido.");
  const id = idParse.data;

  try {
    const service = createServiceClient();

    const { data: ev, error: evErr } = await service
      .from("events")
      .select("id, title, title_es, slug, deleted_at")
      .eq("id", id)
      .maybeSingle();
    if (evErr) throw evErr;
    if (!ev || ev.deleted_at) return fail(404, "not_found", "Este evento ya fue eliminado.");

    const [tix, paid] = await Promise.all([
      service.from("event_tickets").select("quantity").eq("event_id", id).neq("status", "void"),
      service
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("event_id", id)
        .in("status", PAID_ORDER_STATUSES),
    ]);
    if (tix.error) throw tix.error;
    if (paid.error) throw paid.error;

    const seats = ((tix.data ?? []) as { quantity: number }[]).reduce((sum, t) => sum + t.quantity, 0);
    const paidOrders = paid.count ?? 0;
    if (seats > 0 || paidOrders > 0) {
      const name = (ev.title_es as string | null) || (ev.title as string);
      const sold =
        seats > 0
          ? plural(seats, "boleto vendido", "boletos vendidos")
          : plural(paidOrders, "compra pagada", "compras pagadas");
      return fail(
        409,
        "has_sales",
        `No se puede eliminar «${name}»: ya tiene ${sold} y esos compradores tienen su QR válido. ` +
          `Para quitarlo del sitio, toca «Publicado» para pasarlo a Borrador.`,
        { seats, paidOrders },
      );
    }

    const freedSlug = `${String(ev.slug ?? "evento").slice(0, 80)}-eliminado-${id.slice(0, 8)}`;
    const { data: updated, error: upErr } = await service
      .from("events")
      .update({
        deleted_at: new Date().toISOString(),
        is_published: false,
        is_featured: false,
        tickets_enabled: false,
        slug: freedSlug,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    if (upErr) throw upErr;
    if (!updated) return fail(404, "not_found", "Este evento ya fue eliminado.");

    return NextResponse.json({ data: { id }, error: null, message: "Evento eliminado" });
  } catch (error) {
    logger.error("[admin/events] delete failed", error, { eventId: id });
    return fail(500, "db_error", "No se pudo eliminar el evento. Intenta de nuevo.");
  }
}
