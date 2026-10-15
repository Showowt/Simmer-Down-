/**
 * GET /api/site-content — public payload for the segment CMS.
 * Response: {
 *   segments:      { cortes: [...], maridaje: [...], hospitality: [...], merch: [...] },
 *   locationMedia: { [locationId]: { cover?, hero?, gallery: [] } },
 *   careers:       { form_url, intro_es, intro_en, photos },
 *   historia:      { years, locations, reviews, stars },
 * }
 * Cached at the edge for 60s so admin edits go live within a minute.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  DEFAULT_CAREERS,
  DEFAULT_HISTORIA,
  EMPTY_SITE_CONTENT,
  isRenderableSiteImage,
  type LocationMediaMap,
  type SegmentItem,
  type SegmentKey,
  type SiteContentPayload,
} from "@/lib/site-content";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createServiceClient();
    const [itemsRes, mediaRes, settingsRes] = await Promise.all([
      supabase
        .from("segment_items")
        .select(
          "id, segment, category, name_es, name_en, description_es, description_en, price, image_url, is_active, sort_order",
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("location_media")
        .select("id, location_id, kind, image_url, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase.from("settings").select("key, value").in("key", ["careers", "historia_stats"]),
    ]);

    if (itemsRes.error) logger.error("[SiteContent] segment_items load failed", itemsRes.error);
    if (mediaRes.error) logger.error("[SiteContent] location_media load failed", mediaRes.error);
    if (settingsRes.error) logger.error("[SiteContent] settings load failed", settingsRes.error);

    const segments: SiteContentPayload["segments"] = {
      cortes: [],
      maridaje: [],
      hospitality: [],
      merch: [],
    };
    for (const row of itemsRes.data || []) {
      const seg = row.segment as SegmentKey;
      if (!segments[seg]) continue;
      const item: SegmentItem = {
        ...row,
        segment: seg,
        price: row.price != null ? Number(row.price) : null,
        // Never ship a URL the browser's CSP / next-image config would block.
        image_url: isRenderableSiteImage(row.image_url) ? row.image_url : null,
      };
      segments[seg].push(item);
    }

    const locationMedia: LocationMediaMap = {};
    for (const row of mediaRes.data || []) {
      if (!isRenderableSiteImage(row.image_url)) continue;
      const entry = (locationMedia[row.location_id] ||= { gallery: [] });
      if (row.kind === "cover") entry.cover = row.image_url;
      else if (row.kind === "hero") entry.hero = row.image_url;
      else entry.gallery.push(row.image_url);
    }

    let careers = DEFAULT_CAREERS;
    let historia = DEFAULT_HISTORIA;
    for (const row of settingsRes.data || []) {
      if (row.key === "careers" && row.value && typeof row.value === "object") {
        const v = row.value as Partial<typeof DEFAULT_CAREERS>;
        careers = {
          form_url: typeof v.form_url === "string" && v.form_url ? v.form_url : null,
          intro_es: typeof v.intro_es === "string" ? v.intro_es : "",
          intro_en: typeof v.intro_en === "string" ? v.intro_en : "",
          photos: Array.isArray(v.photos)
            ? v.photos.filter((p): p is string => isRenderableSiteImage(p))
            : [],
        };
      }
      if (row.key === "historia_stats" && row.value && typeof row.value === "object") {
        const v = row.value as Partial<typeof DEFAULT_HISTORIA>;
        historia = {
          years: Number(v.years) || DEFAULT_HISTORIA.years,
          locations: Number(v.locations) || DEFAULT_HISTORIA.locations,
          reviews: Number(v.reviews) || DEFAULT_HISTORIA.reviews,
          stars: Number(v.stars) || DEFAULT_HISTORIA.stars,
        };
      }
    }

    const payload: SiteContentPayload = { segments, locationMedia, careers, historia };
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    logger.error("[SiteContent] Unexpected error", err);
    return NextResponse.json(EMPTY_SITE_CONTENT, { status: 200 });
  }
}
