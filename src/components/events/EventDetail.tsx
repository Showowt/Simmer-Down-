"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Share2,
  Star,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import type { PublicEvent } from "@/lib/events";
import {
  ticketState,
  eventReservationUrl,
  formatEventDate,
  formatEventTime,
  deriveCoverPrice,
  firstCategoryTag,
} from "@/lib/event-display";
import EventCountdown from "./EventCountdown";

// Full event page body — the landing page for Google event results, WhatsApp
// shares and (later) ad campaigns. Server page provides the data + JSON-LD.
export default function EventDetail({
  event,
  venueName,
}: {
  event: PublicEvent;
  venueName: string;
}) {
  const { locale } = useI18n();
  const title =
    locale === "es" ? event.title_es || event.title : event.title;
  const description =
    locale === "es"
      ? event.description_es || event.description
      : event.description || event.description_es;
  const whenLabel = formatEventDate(event.starts_at, event.recurrence, locale);
  const shareUrl = `https://simmerdownsv.com/events/${event.slug ?? ""}`;
  const shareMsg =
    locale === "en"
      ? `${event.title} — ${venueName} (${whenLabel}). Details + tickets: ${shareUrl}`
      : `${event.title_es || event.title} — ${venueName} (${whenLabel}). Detalles y entradas: ${shareUrl}`;
  const waShare = `https://wa.me/?text=${encodeURIComponent(shareMsg)}`;

  const ts = ticketState(event);
  const tiers = (event.ticket_tiers ?? []).filter((t) => t?.name);
  const external = event.external_tickets_url?.trim();

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 lg:pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm uppercase tracking-[0.15em] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === "es" ? "Todos los eventos" : "All events"}
        </Link>

        <motion.article
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-8 items-center bg-[#111] border border-white/10 overflow-hidden"
        >
          <div className="relative aspect-[3/4] lg:aspect-auto lg:h-[680px] overflow-hidden">
            {event.image_url ? (
              <Image
                src={event.image_url}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-[#1A1A1A]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/20 via-transparent to-transparent" />
          </div>

          <div className="p-8 md:p-12">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-2 bg-[#C2410C] text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5">
                <Star className="w-3.5 h-3.5" />
                {firstCategoryTag(event.tags, locale)}
              </span>
              {deriveCoverPrice(event.tags, locale) && (
                <span className="bg-[#0A0A0A] border border-[#FBBF24]/40 text-[#FBBF24] text-xs font-bold px-3 py-1.5">
                  {deriveCoverPrice(event.tags, locale)}
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl md:text-5xl text-white mb-4 leading-tight">
              {title}
            </h1>
            {description && (
              <p className="text-lg text-white/60 mb-6">{description}</p>
            )}

            <div className="flex flex-wrap gap-x-6 gap-y-3 mb-8 text-white/60">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#FBBF24]" />
                <span className="capitalize">{whenLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#FBBF24]" />
                {formatEventTime(event.starts_at, locale)}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#FBBF24]" />
                {venueName}
              </div>
            </div>

            <EventCountdown
              startsAt={event.starts_at}
              endsAt={event.ends_at}
              recurrence={event.recurrence}
              locale={locale}
              variant="hero"
              className="mb-8"
            />

            {/* CTA — identical decision tree to the listing cards */}
            {(() => {
              if (ts.onSale && ts.soldOut) {
                return (
                  <span className="inline-flex items-center gap-2 bg-white/10 text-white/60 px-8 py-4 font-bold min-h-[56px]">
                    {locale === "es" ? "Agotado" : "Sold Out"}
                  </span>
                );
              }
              if (ts.onSale) {
                return (
                  <Link
                    href={`/boletos/comprar/${event.slug}`}
                    className="inline-flex items-center gap-2 bg-[#C2410C] hover:bg-[#9A3412] text-white px-8 py-4 font-bold transition-all min-h-[56px]"
                  >
                    {locale === "es"
                      ? `Comprar Boletos · $${ts.price.toFixed(2)}`
                      : `Buy Tickets · $${ts.price.toFixed(2)}`}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                );
              }
              if (external || tiers.length > 0) {
                return (
                  <div className="space-y-5">
                    {tiers.length > 0 && (
                      <div className="max-w-md">
                        <p className="text-white/40 text-xs uppercase tracking-[0.15em] mb-2">
                          {locale === "es" ? "Precios de entradas" : "Ticket prices"}
                        </p>
                        <ul className="space-y-1.5">
                          {tiers.map((t, ti) => (
                            <li key={ti} className="flex items-baseline gap-3">
                              <span className="text-white/80">{t.name}</span>
                              <span className="flex-1 border-b border-dotted border-white/15" />
                              <span className="text-[#FBBF24] font-semibold">
                                ${Number(t.price).toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {external ? (
                      <a
                        href={external}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#C2410C] hover:bg-[#9A3412] text-white px-8 py-4 font-bold transition-all min-h-[56px]"
                      >
                        {locale === "es" ? "Comprar Boletos" : "Buy Tickets"}
                        <ArrowRight className="w-5 h-5" />
                      </a>
                    ) : (
                      <a
                        href={eventReservationUrl(event, whenLabel, locale)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#C2410C] hover:bg-[#9A3412] text-white px-8 py-4 font-bold transition-all min-h-[56px]"
                      >
                        {locale === "es" ? "Más Información" : "More Info"}
                        <ArrowRight className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                );
              }
              return (
                <a
                  href={eventReservationUrl(event, whenLabel, locale)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#C2410C] hover:bg-[#9A3412] text-white px-8 py-4 font-bold transition-all min-h-[56px]"
                >
                  {locale === "es" ? "Reservar Tu Lugar" : "Reserve Your Spot"}
                  <ArrowRight className="w-5 h-5" />
                </a>
              );
            })()}

            {/* WhatsApp share — SV's real distribution channel */}
            <a
              href={waShare}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-[#25D366] hover:text-[#1ebe5d] text-sm font-semibold transition-colors"
            >
              <Share2 className="w-4 h-4" />
              {locale === "es" ? "Compartir por WhatsApp" : "Share on WhatsApp"}
            </a>
          </div>
        </motion.article>

        {/* Venue cross-sell — every event page funnels into a reservation */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/reservations"
            className="group bg-[#1A1A1A] border border-white/10 hover:border-[#E85D04]/50 p-8 transition-all"
          >
            <h2 className="font-display text-2xl text-white mb-2">
              {locale === "es" ? "Reserva tu mesa" : "Reserve your table"}
            </h2>
            <p className="text-white/60 mb-4">
              {locale === "es"
                ? "Asegura tu lugar antes del show — cena, cócteles y la mejor pizza artesanal de El Salvador."
                : "Lock in your spot before the show — dinner, cocktails and El Salvador's best artisanal pizza."}
            </p>
            <span className="inline-flex items-center gap-2 text-[#FBBF24] font-semibold">
              {locale === "es" ? "Reservar" : "Reserve"}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
          <Link
            href="/events"
            className="group bg-[#1A1A1A] border border-white/10 hover:border-[#E85D04]/50 p-8 transition-all"
          >
            <h2 className="font-display text-2xl text-white mb-2">
              {locale === "es" ? "Más eventos Simmer Manía" : "More Simmer Manía events"}
            </h2>
            <p className="text-white/60 mb-4">
              {locale === "es"
                ? "Música en vivo, tributos, salsa y más — la única programación de este nivel en el país."
                : "Live music, tributes, salsa and more — the only programming of this level in the country."}
            </p>
            <span className="inline-flex items-center gap-2 text-[#FBBF24] font-semibold">
              {locale === "es" ? "Ver calendario" : "See calendar"}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
