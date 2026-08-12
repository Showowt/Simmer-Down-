/**
 * GET /api/reviews — live Google reviews for the flagship location.
 *
 * Gated on GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID. When either is absent the
 * route returns { enabled:false } and the UI hides itself (same pattern as
 * ANIMA) — no fake data, ever. Cached 6h: reviews change slowly and the Places
 * API is billable per call.
 *
 * Uses Places API (New) — https://places.googleapis.com/v1/places/{id} — which
 * works with keys from both legacy and post-Mar-2025 Cloud projects (the legacy
 * maps/api/place/details endpoint can't be enabled on new projects). Auth via
 * X-Goog-Api-Key header; response is trimmed by X-Goog-FieldMask.
 */

import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import logger from "@/lib/logger";
import type { NextRequest } from "next/server";

export const revalidate = 21600; // 6h ISR

/** Places API (New) review shape (subset we request via field mask). */
interface NewPlaceReview {
  rating?: number;
  text?: { text?: string; languageCode?: string };
  originalText?: { text?: string; languageCode?: string };
  relativePublishTimeDescription?: string;
  publishTime?: string;
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
}

/** Shape we return to the client (unchanged contract — GoogleReviews.tsx). */
interface OutReview {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url: string | null;
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
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}` +
      `?languageCode=es`;

    const res = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews",
      },
      next: { revalidate: 21600 },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      logger.warn("[reviews] Places API (New) non-OK", {
        http: res.status,
        status: body?.error?.status,
        message: body?.error?.message,
      });
      return NextResponse.json({ enabled: false });
    }

    const data = await res.json();

    const reviews: OutReview[] = ((data.reviews as NewPlaceReview[] | undefined) ?? [])
      .map((rv): OutReview => ({
        author_name: rv.authorAttribution?.displayName ?? "",
        rating: rv.rating ?? 0,
        text: rv.text?.text ?? rv.originalText?.text ?? "",
        relative_time_description: rv.relativePublishTimeDescription ?? "",
        profile_photo_url: rv.authorAttribution?.photoUri ?? null,
        time: rv.publishTime ? Math.floor(new Date(rv.publishTime).getTime() / 1000) : 0,
      }))
      .filter((rv) => rv.text && rv.rating >= 4)
      .slice(0, 6);

    return NextResponse.json(
      {
        enabled: true,
        rating: data.rating ?? null,
        total: data.userRatingCount ?? null,
        url: data.googleMapsUri ?? null,
        reviews,
      },
      { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    logger.error("[reviews] fetch failed", error);
    return NextResponse.json({ enabled: false });
  }
}
