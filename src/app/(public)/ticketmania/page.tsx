import EventsPageClient from "@/components/events/EventsPageClient";
import { fetchUpcomingEvents, fetchLocationNames, venueFor } from "@/lib/events-server";
import {
  generateEventListSchema,
  generateEventSchema,
  safeJsonLd,
} from "@/lib/seo/structured-data";

// ISR: the listing re-renders at most every 5 minutes, so new events published
// in the admin reach the SERVER HTML (what Google crawls) without a deploy.
// The client component still re-fetches live data after hydration.
export const revalidate = 300;

export default async function EventsPage() {
  const [events, locationNames] = await Promise.all([
    fetchUpcomingEvents(),
    fetchLocationNames(),
  ]);

  return (
    <>
      {/* ItemList of upcoming events (Google event discovery) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(generateEventListSchema(events)),
        }}
      />
      {/* Full Event schema inline for every upcoming show — the listing ranks
          even before the detail pages are crawled. */}
      {events
        .filter((e) => !!e.slug)
        .map((e) => (
          <script
            key={e.id}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: safeJsonLd(
                generateEventSchema(e, venueFor(e, locationNames)),
              ),
            }}
          />
        ))}
      <EventsPageClient initialEvents={events} />
    </>
  );
}
