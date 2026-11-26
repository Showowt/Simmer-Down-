/**
 * POST /api/admin/gift-cards/redeem — staff deducts an amount at a restaurant.
 * Body: { code, amount, locationId, note? } → { balance, amount }
 *
 * The deduction is redeem_gift_card(): row-locked, refuses more than the
 * balance, expired or void cards, and writes the ledger row (staff +
 * location) in the same transaction. This route only checks who is asking.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { getActiveStaff } from "@/lib/staff-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { giftMoney, normalizeGiftCode } from "@/lib/gift-cards";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  code: z.string().min(12).max(40),
  amount: z.number().positive().max(10_000),
  locationId: z.string().uuid(),
  note: z.string().trim().max(200).optional(),
});

function fail(status: number, error: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ data: null, error, message, ...extra }, { status });
}

const REFUSAL: Record<string, string> = {
  not_found: "No existe una gift card con ese código.",
  void: "Esta gift card fue anulada.",
  expired: "Esta gift card está vencida.",
  bad_amount: "Monto inválido.",
};

export async function POST(request: NextRequest) {
  const staff = await getActiveStaff();
  if (!staff) return fail(401, "unauthorized", "Sesión expirada. Vuelve a iniciar sesión.");
  const rl = checkRateLimit(`giftcard_redeem:${staff.id}`, { maxRequests: 30, windowMs: 60_000 });
  if (!rl.success) return fail(429, "rate_limited", "Demasiadas solicitudes. Espera un momento.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "invalid_body", "Datos inválidos.");
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return fail(400, "invalid_body", "Revisa el monto y la sucursal.");
  const code = normalizeGiftCode(parsed.data.code);
  if (!code) return fail(400, "bad_code", "Código inválido.");
  const amount = Math.round(parsed.data.amount * 100) / 100;

  try {
    const { data, error } = await createServiceClient().rpc("redeem_gift_card", {
      p_code: code,
      p_amount: amount,
      p_staff: staff.id,
      p_location: parsed.data.locationId,
      p_note: parsed.data.note ?? null,
    });
    if (error) throw error;
    const r = data as { ok: boolean; reason?: string; balance?: number | string; amount?: number | string };
    if (!r.ok) {
      if (r.reason === "insufficient") {
        const bal = Number(r.balance ?? 0);
        return fail(409, "insufficient", `Saldo insuficiente: la tarjeta tiene ${giftMoney(bal)}.`, { balance: bal });
      }
      return fail(409, r.reason ?? "refused", REFUSAL[r.reason ?? ""] ?? "No se pudo descontar.");
    }
    return NextResponse.json({
      data: { amount: Number(r.amount), balance: Number(r.balance) },
      error: null,
      message: `Descontado ${giftMoney(Number(r.amount))}. Saldo: ${giftMoney(Number(r.balance))}.`,
    });
  } catch (error) {
    logger.error("[api/admin/gift-cards/redeem]", error);
    return fail(500, "server_error", "No se pudo descontar. No se cobró nada; intenta de nuevo.");
  }
}
