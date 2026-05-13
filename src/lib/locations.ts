/**
 * Canonical location slugs for Simmer Down restaurants.
 *
 * The Supabase `locations` table contains duplicate / test rows.
 * Until those are cleaned up at the DB level, every public-facing
 * query MUST filter by these slugs to return only the 5 real
 * restaurants.
 *
 * Order: flagship first (Santa Ana), then alphabetical.
 */
export const CANONICAL_LOCATION_SLUGS = [
  "santa-ana",
  "coatepeque",
  "juayua",
  "san-benito",
  "surf-city",
] as const;

export type CanonicalSlug = (typeof CANONICAL_LOCATION_SLUGS)[number];
