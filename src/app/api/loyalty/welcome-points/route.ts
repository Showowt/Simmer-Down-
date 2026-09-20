/**
 * GET /api/loyalty/welcome-points
 *
 * Public, read-only. Returns the SimmerLovers welcome bonus the signup page
 * advertises, so the copy always quotes the number new members actually get.
 *
 * The value lives in settings.loyalty_welcome_points (owner-editable from
 * /admin/premios) and is read by the handle_new_auth_user trigger. The 50
 * fallback here mirrors that trigger's own coalesce — if the key is missing,
 * 50 is genuinely what a new member is awarded, so the copy stays true.
 *
 * `settings` is not readable with the anon key (RLS), hence the service client
 * for a single non-secret number, behind a rate limit.
 */

import { NextRequest, NextResponse } from "next/server";

import logger from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const WELCOME_KEY = "loyalty_welcome_points";
const TRIGGER_FALLBACK = 50;

function toNumber(raw: unknown, fallback: number): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const parsed = Number(raw.replace(/"/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const rl = checkRateLimit(`loyalty_welcome_points:${getClientIp(request)}`, {
      maxRequests: 60,
      windowMs: 60_000,
    });
    if (!rl.success) {
      return NextResponse.json(
        { data: null, error: "rate_limited", message: "Demasiadas solicitudes" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          },
        },
      );
    }

    const service = createServiceClient();
    const { data, error } = await service
      .from("settings")
      .select("value")
      .eq("key", WELCOME_KEY)
      .maybeSingle();

    if (error) {
      logger.error("[LoyaltyWelcomePoints] read failed", error);
      return NextResponse.json(
        { data: null, error: "db_error", message: "Error al cargar" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: { welcomePoints: toNumber(data?.value, TRIGGER_FALLBACK) },
      error: null,
    });
  } catch (err) {
    logger.error("[LoyaltyWelcomePoints] GET error", err);
    return NextResponse.json(
      { data: null, error: "internal", message: "Error interno" },
      { status: 500 },
    );
  }
}
