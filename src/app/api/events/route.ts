/**
 * Public Events API
 * GET /api/events — Returns upcoming published events
 *
 * Query params:
 *   ?location=UUID     — filter by location UUID
 *   ?featured=true     — only featured events
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import logger from "@/lib/logger";

interface EventRow {
  id: string;
  title: string;
  title_es: string | null;
  slug: string;
  description: string | null;
  description_es: string | null;
  location_id: string | null;
  custom_venue: string | null;
  starts_at: string;
  ends_at: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  is_featured: boolean;
  is_published: boolean;
  tags: string[];
  created_at: string;
}

interface EventsSuccessResponse {
  success: true;
  events: EventRow[];
}

interface EventsErrorResponse {
  success: false;
  error: string;
}

type EventsResponse = EventsSuccessResponse | EventsErrorResponse;

export async function GET(
  request: NextRequest,
): Promise<NextResponse<EventsResponse>> {
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`events:${clientIp}`, {
    maxRequests: 30,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit) as NextResponse<EventsResponse>;
  }

  try {
    const supabase = createApiClient();
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const featured = searchParams.get("featured");

    const now = new Date().toISOString();

    let query = supabase
      .from("events")
      .select("id, title, title_es, slug, description, description_es, location_id, custom_venue, starts_at, ends_at, image_url, thumbnail_url, is_featured, is_published, tags, created_at")
      .eq("is_published", true)
      .gte("starts_at", now)
      .order("starts_at", { ascending: true });

    if (location) {
      query = query.eq("location_id", location);
    }

    if (featured === "true") {
      query = query.eq("is_featured", true);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("[API/events]", error.message);
      return NextResponse.json(
        { success: false, error: "Error al obtener eventos" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, events: (data ?? []) as EventRow[] },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[API/events] Unexpected error:", msg);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
