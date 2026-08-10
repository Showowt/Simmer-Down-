/**
 * GET /api/reviews — live Google reviews for the flagship location.
 *
 * Gated on GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID. When either is absent the
 * route returns { enabled:false } and the UI hides itself (same pattern as
 * ANIMA) — no fake data, ever. Cached 6h: reviews change slowly and the Places
 * API is billable per call.
 */

import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import logger from "@/lib/logger";
import type { NextRequest } from "next/server";

export const revalidate = 21600; // 6h ISR

interface GReview {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url?: string;
  time: number;
}

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(`reviews:${getClientIp(request)}`, {
    maxRequests: 30,
    windowMs: 60_000,
  });
  if (!rl.success) return rateLimitResponse(rl);

  const key = (process.env.GOOGLE_PLACES_API_KEY ?? "").trim();
  const placeId = (process.env.GOOGLE_PLACE_ID ?? "").trim();

  if (!key || !placeId) {
    return NextResponse.json({ enabled: false });
  }

  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${encodeURIComponent(placeId)}` +
      `&fields=rating,user_ratings_total,url,reviews` +
      `&reviews_sort=newest&language=es&key=${encodeURIComponent(key)}`;

    const res = await fetch(url, { next: { revalidate: 21600 } });
    const data = await res.json();

    if (data.status !== "OK" || !data.result) {
      logger.warn("[reviews] Places API non-OK", { status: data.status });
      return NextResponse.json({ enabled: false });
    }

    const r = data.result;
    const reviews: GReview[] = (r.reviews ?? [])
      .filter((rv: GReview) => rv.text && rv.rating >= 4)
      .slice(0, 6)
      .map((rv: GReview) => ({
        author_name: rv.author_name,
        rating: rv.rating,
        text: rv.text,
        relative_time_description: rv.relative_time_description,
        profile_photo_url: rv.profile_photo_url ?? null,
        time: rv.time,
      }));

    return NextResponse.json(
      {
        enabled: true,
        rating: r.rating ?? null,
        total: r.user_ratings_total ?? null,
        url: r.url ?? null,
        reviews,
      },
      { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    logger.error("[reviews] fetch failed", error);
    return NextResponse.json({ enabled: false });
  }
}
