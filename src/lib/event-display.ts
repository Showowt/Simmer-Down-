// ============================================================
// Shared event DISPLAY helpers — formatting, ticket state and the
// event-specific WhatsApp reservation link. Used by the /ticketmania
// listing (EventsClient), the /ticketmania/[slug] detail page and the
// homepage events section, so every surface renders an event the
// same way.
// ============================================================

import { LOCATIONS } from "@/lib/data";
import type { PublicEvent } from "@/lib/events";
import {
  money,
  onSiteTickets,
  parseTicketTiers,
  type TicketTier,
  type TierAvailability,
} from "@/lib/ticket-tiers";

// El Salvador (UTC-6). ALWAYS format event dates/times in this zone — without
// an explicit timeZone the server (UTC) and client (viewer-local) render
// different strings → React #418 hydration mismatch, and times show wrong for
// anyone outside SV.
export const EVENT_TZ = "America/El_Salvador";

export interface TicketState {
  /** Can be bought on simmerdownsv.com (date not checked — past events are hidden anyway). */
  onSale: boolean;
  /** On sale, but every ticket type is sold out. */
  soldOut: boolean;
  /** Cheapest ticket's own price, before the service fee. */
  price: number;
  /** Cheapest ticket including the fee — what the buyer pays. */
  total: number;
  /** Several different prices → "desde $X". */
  multiPrice: boolean;
  feePercent: number;
  /** The types a buyer can pick (sold-out ones flagged). One entry for single-price events. */
  tiers: TierAvailability[];
  /** true when the event has ticket types (not just one price). */
  hasTypes: boolean;
}

/** Whether an event can be bought online right now, and at what price(s). */
export function ticketState(e: PublicEvent, locale?: string): TicketState {
  const offer = onSiteTickets(e, locale === "en" ? "General admission" : "General");
  return {
    onSale: offer.mode !== "none" && !!e.slug,
    soldOut: offer.soldOut,
    price: offer.fromPrice,
    total: offer.fromTotal,
    multiPrice: offer.multiPrice,
    feePercent: offer.feePercent,
    tiers: offer.tiers,
    hasTypes: offer.mode === "tiers",
  };
}

/**
 * Buy-button label. The price is the ticket's own price (what the poster
 * says); a service fee is flagged as "+ cargo" and itemised on the event
 * page and at checkout.
 */
export function buyLabel(ts: TicketState, locale?: string, short = false): string {
  const en = locale === "en";
  const verb = short ? (en ? "Buy" : "Comprar") : en ? "Buy Tickets" : "Comprar Boletos";
  const from = ts.multiPrice ? (en ? "from " : "desde ") : "";
  const fee = ts.feePercent > 0 ? (en ? " + fee" : " + cargo") : "";
  return `${verb} · ${from}${money(ts.price)}${fee}`;
}

/** "Valor $5.00 + cargo $0.65 = $5.65" for one ticket (empty when there's no fee). */
export function feeBreakdown(
  t: Pick<TierAvailability, "price" | "fee" | "total">,
  locale?: string,
): string {
  if (!(t.fee > 0)) return "";
  return locale === "en"
    ? `Price ${money(t.price)} + service fee ${money(t.fee)} = ${money(t.total)}`
    : `Valor ${money(t.price)} + cargo por servicio ${money(t.fee)} = ${money(t.total)}`;
}

/**
 * Price list shown for shows sold on ANOTHER platform (or not sold online):
 * display-only, never purchasable here.
 */
export function displayTiers(e: PublicEvent): TicketTier[] {
  return parseTicketTiers(e.ticket_tiers).filter((t) => t.active);
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
