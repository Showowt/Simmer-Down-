// ============================================================
// Shared event DISPLAY helpers — formatting, ticket state and the
// event-specific WhatsApp reservation link. Used by the /events
// listing (EventsClient), the /events/[slug] detail page and the
// homepage events section, so every surface renders an event the
// same way.
// ============================================================

import { LOCATIONS } from "@/lib/data";
import type { PublicEvent } from "@/lib/events";

// El Salvador (UTC-6). ALWAYS format event dates/times in this zone — without
// an explicit timeZone the server (UTC) and client (viewer-local) render
// different strings → React #418 hydration mismatch, and times show wrong for
// anyone outside SV.
export const EVENT_TZ = "America/El_Salvador";

/** Whether an event can be bought online right now, and the single price. */
export function ticketState(e: PublicEvent): {
  onSale: boolean;
  soldOut: boolean;
  price: number;
} {
  const price = e.ticket_price != null ? Number(e.ticket_price) : 0;
  const onSale = !!e.tickets_enabled && price > 0 && !!e.slug;
  const soldOut =
    !!e.has_capacity_limit &&
    e.max_capacity != null &&
    (e.tickets_sold ?? 0) >= e.max_capacity;
  return { onSale, soldOut, price };
}

// Event-specific reservation via WhatsApp — pre-fills the show name/date/venue and
// routes to that venue's WhatsApp (falls back to the main line) so the request is
// never a generic "contact us".
export function eventReservationUrl(
  event: PublicEvent,
  whenLabel: string,
  locale?: string,
): string {
  const name =
    (locale === "en" ? event.title : event.title_es || event.title) ||
    "un evento";
  const venue = event.custom_venue || "Simmer Down";
  const v = venue.toLowerCase();
  const loc = LOCATIONS.find(
    (l) =>
      v.includes(l.shortName.toLowerCase()) || v.includes(l.name.toLowerCase()),
  );
  const phone = (loc?.whatsapp || "+50376804434").replace(/\D/g, "");
  const msg =
    locale === "en"
      ? `Hi! I'd like to reserve for the event: ${name} — ${venue}${whenLabel ? ` (${whenLabel})` : ""}. Could you share more info?`
      : `¡Hola! Quisiera reservar para el evento: ${name} — ${venue}${whenLabel ? ` (${whenLabel})` : ""}. ¿Me pueden dar más información?`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

export function formatEventDate(
  iso: string,
  recurrence?: string | null,
  locale?: string,
): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const dateLocale = locale === "en" ? "en-US" : "es-SV";
  if (recurrence === "monthly") {
    return locale === "en"
      ? "Every month · Simmer Down San Benito"
      : "Cada mes · Simmer Down San Benito";
  }
  if (recurrence === "weekly") {
    return date.toLocaleDateString(dateLocale, {
      weekday: "long",
      timeZone: EVENT_TZ,
    });
  }
  return date.toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: EVENT_TZ,
  });
}

export function formatEventTime(iso: string, locale?: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const dateLocale = locale === "en" ? "en-US" : "es-SV";
  return date
    .toLocaleTimeString(dateLocale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: EVENT_TZ,
    })
    .replace(" ", "");
}

export function deriveCoverPrice(
  tags?: string[] | null,
  locale?: string,
): string | null {
  if (!tags) return null;
  for (const tag of tags) {
    if (tag.startsWith("cover-")) return `$${tag.slice("cover-".length)}`;
    if (tag.startsWith("preventa-")) {
      const price = tag.slice("preventa-".length);
      return locale === "en" ? `Pre-sale $${price}` : `Preventa $${price}`;
    }
  }
  return null;
}

export function firstCategoryTag(
  tags?: string[] | null,
  locale?: string,
): string {
  if (!tags || tags.length === 0) return locale === "en" ? "Event" : "Evento";
  const priority = [
    "music",
    "salsa",
    "rock",
    "poetry",
    "comedy",
    "openmic",
    "tribute",
    "signature",
  ];
  const displayEs: Record<string, string> = {
    music: "Música",
    salsa: "Salsa",
    rock: "Rock",
    poetry: "Poesía",
    comedy: "Comedia",
    openmic: "Open Mic",
    tribute: "Tributo",
    signature: "Signature",
    live: "En vivo",
    monthly: "Mensual",
  };
  const displayEn: Record<string, string> = {
    music: "Music",
    salsa: "Salsa",
    rock: "Rock",
    poetry: "Poetry",
    comedy: "Comedy",
    openmic: "Open Mic",
    tribute: "Tribute",
    signature: "Signature",
    live: "Live",
    monthly: "Monthly",
  };
  const display = locale === "en" ? displayEn : displayEs;
  for (const p of priority) {
    if (tags.includes(p)) return display[p] || p;
  }
  return display[tags[0]] || tags[0];
}
