/**
 * GET /api/locations
 *
 * Public endpoint. Returns all active locations with key operational
 * info: name, slug, city, order acceptance status, delivery config,
 * operating hours, phone, and estimated prep time.
 *
 * Cached via Next.js revalidation (60 seconds).
 */

import { NextRequest, NextResponse } from "next/server";

import logger from "@/lib/logger";
import { CANONICAL_LOCATION_SLUGS } from "@/lib/locations";
import { createServiceClient } from "@/lib/supabase/service";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface LocationResponse {
  id: string;
  name: string;
  slug: string;
  city: string;
  is_accepting_orders: boolean;
  delivery_enabled: boolean;
  delivery_fee: number | null;
  operating_hours: unknown;
  phone: string | null;
  estimated_prep_time_minutes: number | null;
}

interface LocationsResponse {
  success: boolean;
  locations?: LocationResponse[];
  error?: string;
  message?: string;
}

// ═══════════════════════════════════════════════════════════════
// Next.js caching — revalidate every 60 seconds
// ═══════════════════════════════════════════════════════════════

export const revalidate = 60;

// ═══════════════════════════════════════════════════════════════
// API Handler
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
): Promise<NextResponse<LocationsResponse>> {
  const startTime = Date.now();
  const endpoint = "/api/locations";

  // Rate limiting — 60 requests per minute per IP
  const clientIp = getClientIp(request);
  const rl = checkRateLimit(`locations:${clientIp}`, {
    maxRequests: 60,
    windowMs: 60_000,
  });
  if (!rl.success) {
    logger.warn("Rate limit exceeded for locations", { ip: clientIp });
    return rateLimitResponse(rl) as NextResponse<LocationsResponse>;
  }

  logger.api.request(endpoint, "GET", { ip: clientIp });

  try {
    const supabase = createServiceClient();

    const { data: locations, error: locErr } = await supabase
      .from("locations")
      .select(
        `
        id,
        name,
        slug,
        city,
        is_accepting_orders,
        delivery_enabled,
        delivery_fee,
        operating_hours,
        phone,
        estimated_prep_time_minutes
      `,
      )
      .eq("is_active", true)
      .in("slug", [...CANONICAL_LOCATION_SLUGS])
      .order("name");

    if (locErr) {
      logger.error("Failed to fetch locations", locErr);
      return NextResponse.json(
        {
          success: false,
          error: "Query failed",
          message: "Error al obtener las ubicaciones.",
        },
        { status: 500 },
      );
    }

    const locationResponses: LocationResponse[] = (locations ?? []).map(
      (loc) => ({
        id: loc.id,
        name: loc.name,
        slug: loc.slug,
        city: loc.city,
        is_accepting_orders: loc.is_accepting_orders ?? false,
        delivery_enabled: loc.delivery_enabled ?? false,
        delivery_fee: loc.delivery_fee ? Number(loc.delivery_fee) : null,
        operating_hours: loc.operating_hours,
        phone: loc.phone,
        estimated_prep_time_minutes: loc.estimated_prep_time_minutes,
      }),
    );

    const duration = Date.now() - startTime;
    logger.api.response(endpoint, 200, duration, {
      locationCount: locationResponses.length,
    });

    return NextResponse.json({
      success: true,
      locations: locationResponses,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.api.error(endpoint, error, { duration });

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message:
          "Error interno del servidor. Por favor intenta de nuevo.",
      },
      { status: 500 },
    );
  }
}
