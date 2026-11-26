/**
 * GET /api/admin/gift-cards/<code> — one card for the redeem screen: value,
 * balance, state, who it's for, full ledger, plus the locations list.
 * Any active staff member (the person at the register).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getActiveStaff } from "@/lib/staff-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { normalizeGiftCode } from "@/lib/gift-cards";
import { giftCardByCode } from "@/lib/gift-cards-server";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

function fail(status: number, error: string, message: string) {
  return NextResponse.json({ data: null, error, message }, { status });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const staff = await getActiveStaff();
  if (!staff) return fail(401, "unauthorized", "Sesión expirada. Vuelve a iniciar sesión.");
  // Lookups are how a guessing attack would look — cap them per staff login.
  const rl = checkRateLimit(`giftcard_lookup:${staff.id}`, { maxRequests: 30, windowMs: 60_000 });
  if (!rl.success) return fail(429, "rate_limited", "Demasiadas búsquedas. Espera un minuto.");

  const { code: raw } = await params;
  const code = normalizeGiftCode(decodeURIComponent(raw));
  if (!code) return fail(400, "bad_code", "Código inválido. Revisa los 12 caracteres (SD-XXXX-XXXX-XXXX).");

  try {
    const [card, locs] = await Promise.all([
      giftCardByCode(code),
      createServiceClient().from("locations").select("id, name").order("created_at", { ascending: true }),
    ]);
    if (locs.error) throw locs.error;
    if (!card) return fail(404, "not_found", "No existe una gift card con ese código.");
    const { view_token: _omit, ...safeCard } = card;
    void _omit;
    return NextResponse.json({
      data: { card: safeCard, locations: locs.data ?? [], staffRole: staff.role },
      error: null,
      message: "ok",
    });
  } catch (error) {
    logger.error("[api/admin/gift-cards/code] GET", error);
    return fail(500, "server_error", "No se pudo cargar la gift card.");
  }
}
