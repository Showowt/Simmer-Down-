import type { MetadataRoute } from 'next'
import { fetchUpcomingEvents } from '@/lib/events-server'

// Re-generate hourly so newly published events appear without a deploy.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://simmerdownsv.com'
  const now = new Date()

  // Live event pages — fetched from the DB so every published show gets a
  // crawlable URL the moment it exists. fetchUpcomingEvents fails SOFT
  // (empty list), so an events outage can never break the sitemap.
  const events = await fetchUpcomingEvents()
  const eventEntries: MetadataRoute.Sitemap = events
    .filter((e) => !!e.slug)
    .map((e) => ({
      url: `${baseUrl}/events/${e.slug}`,
      lastModified: e.created_at ? new Date(e.created_at) : now,
      changeFrequency: 'daily',
      priority: 0.85,
    }))

  return [
    // ─── Core Pages (Highest Priority) ─────────────────────────────────
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/carta`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/restaurantes`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/reservations`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },

    // ─── Location Detail Pages (Local SEO) ─────────────────────────────
    {
      url: `${baseUrl}/locations/santa-ana`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/locations/lago-coatepeque`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/locations/san-benito`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/locations/simmer-garden`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/locations/surf-city`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // ─── Brand Segments & Stays ────────────────────────────────────────
    {
      url: `${baseUrl}/estadia`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/hospitality`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/cortes-premium`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/merch`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },

    // ─── Events (the only live events marketing in the country) ────────
    {
      url: `${baseUrl}/events`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...eventEntries,

    // ─── Engagement Pages ──────────────────────────────────────────────
    {
      url: `${baseUrl}/simmerlovers`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/nosotros`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // ─── Legal (Low Priority) ──────────────────────────────────────────
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]
}
