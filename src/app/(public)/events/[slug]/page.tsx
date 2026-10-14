import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetail from "@/components/events/EventDetail";
import {
  fetchEventBySlug,
  fetchLocationNames,
  venueFor,
} from "@/lib/events-server";
import { generateEventSchema, safeJsonLd } from "@/lib/seo/structured-data";

// ISR per event page: ticket availability / edits reach the HTML within
// 5 minutes; first request on a new slug renders on demand.
export const revalidate = 300;

const BASE_URL = "https://simmerdownsv.com";
const EVENT_TZ = "America/El_Salvador";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await fetchEventBySlug(slug);
  if (!event) {
    return { title: "Evento no encontrado" };
  }
  const locationNames = await fetchLocationNames();
  const venue = venueFor(event, locationNames);
  const name = (event.title_es || event.title).trim();
  const dateEs = new Date(event.starts_at).toLocaleDateString("es-SV", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: EVENT_TZ,
  });
  const description = (
    event.description_es ||
    event.description ||
    `${name} en ${venue} — ${dateEs}. Música en vivo en El Salvador con Simmer Down.`
  ).slice(0, 300);
  const url = `${BASE_URL}/events/${event.slug}`;
  const images = event.image_url
    ? [{ url: event.image_url, alt: name }]
    : [{ url: "/og/events.jpg", width: 1200, height: 630, alt: name }];

  return {
    // absolute: the parent /events layout's plain-string title breaks the
    // root "%s | Simmer Down" template chain here, so brand it explicitly.
    title: { absolute: `${name} — ${dateEs} | Simmer Down` },
    description,
    keywords: [
      name,
      `${name} El Salvador`,
      `${name} entradas`,
      `${name} boletos`,
      "eventos El Salvador",
      "música en vivo El Salvador",
      "conciertos El Salvador",
      venue,
      "Simmer Manía",
    ],
    alternates: { canonical: url },
    openGraph: {
      title: `${name} · ${dateEs} · ${venue}`,
      description,
      url,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — ${venue}`,
      description,
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const [event, locationNames] = await Promise.all([
    fetchEventBySlug(slug),
    fetchLocationNames(),
  ]);
  if (!event) notFound();

  const venue = venueFor(event, locationNames);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(generateEventSchema(event, venue)),
        }}
      />
      <EventDetail event={event} venueName={venue} />
    </>
  );
}
