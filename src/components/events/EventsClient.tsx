"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useI18n, translations } from "@/lib/i18n";
import EventCountdown from "./EventCountdown";
import { isLiveOrUpcoming, type PublicEvent } from "@/lib/events";
import { EVENT_SEGMENTS, eventSegment, type EventSegment } from "@/lib/event-segments";
import { useSiteContent } from "@/lib/use-site-content";
import {
  formatEventDate,
  formatEventTime,
  deriveCoverPrice,
  firstCategoryTag,
} from "@/lib/event-display";
import EventTicketCta, { EventCardCta } from "./EventTicketCta";

// Real events schema (matches prod DB) — shared type, see src/lib/events.ts
type DbEvent = PublicEvent;

// Fallback events (used only if the DB query returns zero rows).
const fallbackEvents: DbEvent[] = [
  {
    id: "fallback-simmermania",
    title: "Simmer Manía — Programación Mensual",
    description:
      "Nuestra programación estelar mensual en Simmer Down San Benito: bandas en vivo, DJs, open mics, cine, rock, salsa, indie fest y más.",
    custom_venue: "Simmer Down San Benito",
    // Stable, deterministic value — a live `new Date()` here rendered a
    // different string on the server than on the client, causing a React #418
    // hydration mismatch. `recurrence:"monthly"` makes the date show as
    // "Cada mes" rather than this fixed timestamp.
    starts_at: "2026-01-01T02:00:00.000Z",
    recurrence: "monthly",
    image_url: "/images/events/simmermania-marzo.jpg",
    is_featured: true,
    is_published: true,
    tags: ["music", "live", "monthly"],
  },
];


// ─────────────────────────────────────────────
// EventsList — main component
// ─────────────────────────────────────────────
export function EventsList({
  initialEvents,
}: {
  /** Server-fetched events: SSR'd into the HTML so Google indexes every show. */
  initialEvents?: DbEvent[];
}) {
  const { t, locale } = useI18n();
  const [events, setEvents] = useState<DbEvent[]>(
    initialEvents && initialEvents.length > 0 ? initialEvents : fallbackEvents,
  );
  // Render the fallback on SSR so the page isn't blank on first paint.
  const [loading, setLoading] = useState(false);
  // Segment chips (Simmermanía / Frontline / Otros) — only rendered once the
  // owner uses at least two segments; "all" is the default view.
  const [segment, setSegment] = useState<EventSegment | "all">("all");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("is_published", true)
          .order("is_featured", { ascending: false })
          .order("starts_at", { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          setEvents(data as DbEvent[]);
        }
      } catch {
        /* keep fallback */
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Cap full-width hero posters to the 2 soonest featured events — the client
  // marks most events "featured", and stacking 8 heroes reads as broken.
  // Nothing is hidden: every remaining event falls into the grid below.
  // Auto-archive: hide events that are over (recurring programmes never pass).
  const visible = events.filter((e) =>
    isLiveOrUpcoming({ starts_at: e.starts_at, ends_at: e.ends_at, recurrence: e.recurrence }),
  );
  const segmentsInUse = EVENT_SEGMENTS.filter((s) =>
    visible.some((e) => eventSegment(e.segment) === s.key),
  );
  const showSegmentChips = segmentsInUse.length >= 2;
  const shown =
    showSegmentChips && segment !== "all"
      ? visible.filter((e) => eventSegment(e.segment) === segment)
      : visible;
  const featured = shown.filter((e) => e.is_featured).slice(0, 2);
  const heroIds = new Set(featured.map((e) => e.id));
  const upcoming = shown.filter((e) => !heroIds.has(e.id));

  if (loading) {
    return (
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="animate-pulse space-y-8">
            <div className="h-[500px] bg-[#1A1A1A]" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-80 bg-[#1A1A1A]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Segment chips — Simmermanía · Frontline · Otros */}
      {showSegmentChips && (
        <section className="pb-10" aria-label={locale === "es" ? "Filtrar por segmento" : "Filter by segment"}>
          <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center gap-2">
            {[{ key: "all" as const, label: locale === "es" ? "Todos" : "All", color: "#FFFFFF" }, ...segmentsInUse.map((s) => ({ key: s.key, label: locale === "es" ? s.label : s.label_en, color: s.color }))].map((chip) => {
              const active = segment === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setSegment(chip.key)}
                  aria-pressed={active}
                  data-segment={chip.key}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] border transition-colors ${
                    active ? "text-[#0A0A0A]" : "text-white/70 hover:text-white border-white/15 hover:border-white/40"
                  }`}
                  style={active ? { backgroundColor: chip.color, borderColor: chip.color } : undefined}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured Events — full-width posters */}
      {featured.map((event) => (
        <section key={event.id} className="pb-16">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-8 items-center bg-[#111] border border-white/10 overflow-hidden"
            >
              <div className="relative aspect-[3/4] lg:aspect-auto lg:h-[640px] overflow-hidden">
                {event.image_url ? (
                  <Image
                    src={event.image_url}
                    alt={event.title}
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
                <span className="inline-flex items-center gap-2 bg-[#C2410C] text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 mb-6">
                  <Star className="w-3.5 h-3.5" />
                  {locale === 'es' ? 'Evento Destacado' : 'Featured Event'}
                </span>
                <h2 className="font-display text-3xl md:text-5xl text-white mb-4 leading-tight">
                  {event.slug ? (
                    <Link
                      href={`/ticketmania/${event.slug}`}
                      className="transition-colors hover:text-[#FBBF24]"
                    >
                      {locale === 'es' ? (event.title_es || event.title) : event.title}
                    </Link>
                  ) : (
                    locale === 'es' ? (event.title_es || event.title) : event.title
                  )}
                </h2>
                <p className="text-lg text-white/60 mb-6">
                  {locale === 'es' ? (event.description_es || event.description) : (event.description || event.description_es)}
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-3 mb-8 text-white/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#FBBF24]" />
                    <span className="capitalize">{formatEventDate(event.starts_at, event.recurrence, locale)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#FBBF24]" />
                    {formatEventTime(event.starts_at, locale)}
                  </div>
                  {event.custom_venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#FBBF24]" />
                      {event.custom_venue}
                    </div>
                  )}
                  {deriveCoverPrice(event.tags, locale) && (
                    <div className="flex items-center gap-2 text-[#FBBF24] font-semibold">
                      {deriveCoverPrice(event.tags, locale)}
                    </div>
                  )}
                </div>
                <EventCountdown
                  startsAt={event.starts_at}
                  endsAt={event.ends_at}
                  recurrence={event.recurrence}
                  locale={locale}
                  variant="hero"
                  className="mb-8"
                />
                <EventTicketCta
                  event={event}
                  locale={locale}
                  whenLabel={formatEventDate(event.starts_at, event.recurrence, locale)}
                />
              </div>
            </motion.div>
          </div>
        </section>
      ))}

      {/* Upcoming / non-featured — poster grid */}
      {upcoming.length > 0 && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="font-display text-3xl text-white mb-12">
              {locale === 'es' ? 'Próximos Eventos' : 'Upcoming Events'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcoming.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className="group bg-[#1A1A1A] border border-white/10 overflow-hidden hover:border-[#E85D04]/50 transition-all"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {event.image_url ? (
                      <Image
                        src={event.image_url}
                        alt={locale === 'es' ? (event.title_es || event.title) : event.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[#111]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/70 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="bg-[#0A0A0A]/80 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1">
                        {firstCategoryTag(event.tags, locale)}
                      </span>
                    </div>
                    {deriveCoverPrice(event.tags, locale) && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-[#C2410C] text-white text-sm font-bold px-3 py-1">
                          {deriveCoverPrice(event.tags, locale)}
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3">
                      <EventCountdown
                        startsAt={event.starts_at}
                        endsAt={event.ends_at}
                        recurrence={event.recurrence}
                        locale={locale}
                        variant="card"
                      />
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="font-display text-xl text-white mb-2 line-clamp-2">
                      {event.slug ? (
                        <Link
                          href={`/ticketmania/${event.slug}`}
                          className="transition-colors hover:text-[#FBBF24]"
                        >
                          {locale === 'es' ? (event.title_es || event.title) : event.title}
                        </Link>
                      ) : (
                        locale === 'es' ? (event.title_es || event.title) : event.title
                      )}
                    </h3>
                    <p className="text-white/60 text-sm mb-4 line-clamp-2">
                      {locale === 'es' ? (event.description_es || event.description) : (event.description || event.description_es)}
                    </p>

                    <div className="space-y-2 mb-6 text-sm">
                      <div className="flex items-center gap-2 text-white/60">
                        <Calendar className="w-4 h-4 text-[#FBBF24]" />
                        <span className="capitalize">
                          {formatEventDate(event.starts_at, event.recurrence, locale)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <Clock className="w-4 h-4 text-[#FBBF24]" />
                        {formatEventTime(event.starts_at, locale)}
                      </div>
                      {event.custom_venue && (
                        <div className="flex items-center gap-2 text-white/60">
                          <MapPin className="w-4 h-4 text-[#FBBF24]" />
                          {event.custom_venue}
                        </div>
                      )}
                    </div>

                    <EventCardCta
                      event={event}
                      locale={locale}
                      whenLabel={formatEventDate(event.starts_at, event.recurrence, locale)}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

interface PrivateEventType {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function PrivateEventsSection({
  eventTypes,
}: {
  eventTypes: PrivateEventType[];
}) {
  const { t, locale } = useI18n();
  // Owner-published Hospitality gallery (admin → Contenido Web) replaces the
  // old hardcoded flyers, which repeated the events above and went stale
  // (client PDF Oct 2026: "eliminar las imágenes antiguas").
  const { segments } = useSiteContent();
  const galleryPhotos = segments.hospitality
    .filter((i) => i.category === "galeria" && i.image_url)
    .slice(0, 4);

  return (
    <section className="py-24 bg-[#1A1A1A] border-t border-white/10 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="font-display italic text-2xl text-white/60 mb-4">
              {locale === 'es' ? 'Eventos Privados' : 'Private Events'}
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-white mb-6">
              {locale === 'es' ? 'Tu Evento Con Nosotros' : 'Your Event With Us'}
            </h2>
            <p className="text-lg text-white/60 mb-8">
              {locale === 'es'
                ? '¿Buscas el lugar perfecto para tu próxima celebración? Ofrecemos espacios para eventos privados, menús personalizados y servicio de catering para hacer tu evento inolvidable.'
                : 'Looking for the perfect place for your next celebration? We offer spaces for private events, custom menus and catering service to make your event unforgettable.'}
            </p>

            <div className="space-y-6 mb-8">
              {eventTypes.map((type) => (
                <div key={type.title} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#E85D04]/10 flex items-center justify-center flex-shrink-0">
                    {type.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">
                      {type.title}
                    </h3>
                    <p className="text-white/60 text-sm">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/hospitality"
                className="inline-flex items-center gap-2 bg-[#C2410C] hover:bg-[#9A3412] text-white px-8 py-4 font-bold transition-all min-h-[56px]"
              >
                {locale === 'es' ? 'Ver Hospitality y Catering' : 'See Hospitality & Catering'}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 font-bold transition-all min-h-[56px]"
              >
                {locale === 'es' ? 'Solicitar Información' : 'Request Information'}
              </Link>
            </div>
          </motion.div>

          {galleryPhotos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                {galleryPhotos.map((photo, i) => (
                  <div key={photo.id} className={`relative h-48 ${i % 2 === 1 ? 'mt-8' : ''}`}>
                    <Image
                      src={photo.image_url as string}
                      alt={locale === 'es' ? photo.name_es : photo.name_en || photo.name_es}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

export function AnimatedHero({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center max-w-3xl mx-auto"
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCTA({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  );
}
