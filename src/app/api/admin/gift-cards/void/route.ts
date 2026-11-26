/**
 * POST /api/admin/gift-cards/void — cancel a card (refund, fraud, error).
 * Body: { id, reason } — owner / admin / manager only. The remaining balance
 * becomes unusable and the void is written to the ledger with who and why.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { getActiveStaff, type StaffRole } from "@/lib/staff-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { giftMoney } from "@/lib/gift-cards";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

const CAN_VOID: ReadonlySet<StaffRole> = new Set<StaffRole>(["owner", "admin", "manager"]);
const BodySchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().min(3, "Escribe el motivo").max(200),
});

function fail(status: number, error: string, message: string) {
  return NextResponse.json({ data: null, error, message }, { status });
}

export async function POST(request: NextRequest) {
  const staff = await getActiveStaff();
  if (!staff) return fail(401, "unauthorized", "Sesión expirada. Vuelve a iniciar sesión.");
  if (!CAN_VOID.has(staff.role)) return fail(403, "forbidden", "Tu usuario no puede anular gift cards.");
  const rl = checkRateLimit(`giftcard_void:${staff.id}`, { maxRequests: 10, windowMs: 60_000 });
  if (!rl.success) return fail(429, "rate_limited", "Demasiadas solicitudes. Espera un momento.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "invalid_body", "Datos inválidos.");
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return fail(400, "invalid_body", parsed.error.issues[0]?.message ?? "Datos inválidos.");

  try {
    const { data, error } = await createServiceClient().rpc("void_gift_card", {
      p_id: parsed.data.id,
      p_staff: staff.id,
      p_reason: parsed.data.reason,
    });
    if (error) throw error;
    const r = data as { ok: boolean; reason?: string; voided_balance?: number | string };
    if (!r.ok) {
      const msg = r.reason === "already_void" ? "Ya estaba anulada." : r.reason === "not_found" ? "No existe." : "No se pudo anular.";
      return fail(409, r.reason ?? "refused", msg);
    }
    return NextResponse.json({
      data: { voidedBalance: Number(r.voided_balance ?? 0) },
      error: null,
      message: `Anulada. Saldo inutilizado: ${giftMoney(Number(r.voided_balance ?? 0))}.`,
    });
  } catch (error) {
    logger.error("[api/admin/gift-cards/void]", error);
    return fail(500, "server_error", "No se pudo anular.");
  }
}
