/**
 * Public Specials API
 * GET /api/specials — Returns active promotions visible on the site.
 *
 * RLS only exposes rows with active = true to the anon client; this route
 * additionally gates by date window + day-of-week in America/El_Salvador
 * and flags each special as live-now vs upcoming (starts within 7 days).
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { isSpecialLive, isSpecialVisible } from "@/lib/specials";
import type { Special } from "@/lib/types";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

export interface PublicSpecial extends Special {
  is_live: boolean;
}

interface SpecialsSuccessResponse {
  success: true;
  specials: PublicSpecial[];
}

interface SpecialsErrorResponse {
  success: false;
  error: string;
}

type SpecialsResponse = SpecialsSuccessResponse | SpecialsErrorResponse;

export async function GET(
  request: NextRequest,
): Promise<NextResponse<SpecialsResponse>> {
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`specials:${clientIp}`, {
    maxRequests: 30,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit) as NextResponse<SpecialsResponse>;
  }

  try {
    const supabase = createApiClient();
    const { data, error } = await supabase
      .from("specials")
      .select(
        "id, title, description, discount_type, discount_value, original_price, special_price, menu_items, start_date, end_date, days_of_week, active, featured, image_url, created_at, updated_at",
      )
      .eq("active", true)
      .order("featured", { ascending: false })
      .order("start_date", { ascending: true });

    if (error) {
      logger.error("[Specials] Failed to fetch specials", error);
      return NextResponse.json(
        { success: false, error: "No se pudieron cargar las promociones" },
        { status: 500 },
      );
    }

    const specials: PublicSpecial[] = ((data as Special[]) || [])
      .filter((s) => isSpecialVisible(s))
      .map((s) => ({
        ...s,
        discount_value: Number(s.discount_value),
        original_price:
          s.original_price != null ? Number(s.original_price) : null,
        special_price:
          s.special_price != null ? Number(s.special_price) : null,
        is_live: isSpecialLive(s),
      }));

    return NextResponse.json({ success: true, specials });
  } catch (err) {
    logger.error("[Specials] Unexpected error", err);
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 },
    );
  }
}
