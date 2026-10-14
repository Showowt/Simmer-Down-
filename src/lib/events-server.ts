// ============================================================
// Server-side event fetching — used by the /events listing page,
// the /events/[slug] detail page and the sitemap so events are
// SERVER-RENDERED (Google sees them) instead of appearing only
// after a client-side fetch.
//
// Uses the anon key: `events` is public-read for published rows
// (the browser client queries it directly), so these fetchers see
// exactly what a visitor sees. Every function fails SOFT (empty
// result) — an events outage must never 500 the page or sitemap.
// ============================================================

import { createApiClient } from "@/lib/supabase/api";
import {
  isLiveOrUpcoming,
  upcomingOrFilter,
  type PublicEvent,
} from "@/lib/events";
import logger from "@/lib/logger";

export const EVENT_SELECT =
  "id, title, title_es, slug, description, description_es, location_id, custom_venue, starts_at, ends_at, recurrence, image_url, thumbnail_url, is_featured, is_published, tags, created_at, tickets_enabled, ticket_price, tickets_sold, has_capacity_limit, max_capacity, external_tickets_url, ticket_tiers";

/** Published events that are live or upcoming, soonest first. */
export async function fetchUpcomingEvents(): Promise<PublicEvent[]> {
  try {
    const supabase = createApiClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("events")
      .select(EVENT_SELECT)
      .eq("is_published", true)
      .or(upcomingOrFilter(now))
      .order("is_featured", { ascending: false })
      .order("starts_at", { ascending: true });
    if (error) {
      logger.error("[events-server] list", error.message);
      return [];
    }
    return ((data ?? []) as PublicEvent[]).filter((e) => isLiveOrUpcoming(e));
  } catch (err) {
    logger.error(
      "[events-server] list unexpected",
      err instanceof Error ? err.message : String(err),
    );
    return [];
  }
}

/**
 * One published event by slug — past events included on purpose: an indexed
 * or shared /events/[slug] URL must keep rendering after the show instead of
 * turning into a 404.
 */
export async function fetchEventBySlug(
  slug: string,
): Promise<PublicEvent | null> {
  try {
    const supabase = createApiClient();
    const { data, error } = await supabase
      .from("events")
      .select(EVENT_SELECT)
      .eq("is_published", true)
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();
    if (error) {
      logger.error("[events-server] bySlug", error.message);
      return null;
    }
    return (data as PublicEvent) ?? null;
  } catch (err) {
    logger.error(
      "[events-server] bySlug unexpected",
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

/** Map of locations.id (uuid) → display name, for resolving an event's venue. */
export async function fetchLocationNames(): Promise<Record<string, string>> {
  try {
    const supabase = createApiClient();
    const { data, error } = await supabase.from("locations").select("id, name");
    if (error) {
      logger.error("[events-server] locations", error.message);
      return {};
    }
    const map: Record<string, string> = {};
    for (const row of (data ?? []) as { id: string; name: string }[]) {
      map[row.id] = row.name;
    }
    return map;
  } catch (err) {
    logger.error(
      "[events-server] locations unexpected",
      err instanceof Error ? err.message : String(err),
    );
    return {};
  }
}

/** The venue name an event displays: custom venue, else its location, else the brand. */
export function venueFor(
  event: Pick<PublicEvent, "custom_venue" | "location_id">,
  locationNames: Record<string, string>,
): string {
  return (
    event.custom_venue?.trim() ||
    (event.location_id ? locationNames[event.location_id] : undefined) ||
    "Simmer Down"
  );
}
