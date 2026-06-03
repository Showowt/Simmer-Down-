"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useI18n, translations } from "@/lib/i18n";

// ─────────────────────────────────────────────
// Real events schema (matches prod DB)
// ─────────────────────────────────────────────
interface DbEvent {
  id: string;
  title: string;
  title_es?: string | null;
  slug?: string | null;
  description?: string | null;
  description_es?: string | null;
  location_id?: string | null;
  custom_venue?: string | null;
  starts_at: string;
  ends_at?: string | null;
  recurrence?: string | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  is_featured?: boolean;
  is_published?: boolean;
  tags?: string[] | null;
  rsvp_enabled?: boolean;
}

// Fallback events (used only if the DB query returns zero rows).
const fallbackEvents: DbEvent[] = [
  {
    id: "fallback-simmermania",
    title: "Simmer Manía — Programación Mensual",
    description:
      "Nuestra programación estelar mensual en Simmer Down San Benito: bandas en vivo, DJs, open mics, cine, rock, salsa, indie fest y más.",
    custom_venue: "Simmer Down San Benito",
    starts_at: new Date().toISOString(),
    image_url: "/images/events/simmermania-marzo.jpg",
    is_featured: true,
    is_published: true,
    tags: ["music", "live", "monthly"],
  },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatEventDate(iso: string, recurrence?: string | null, locale?: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const dateLocale = locale === 'en' ? "en-US" : "es-SV";
  if (recurrence === "monthly") {
    return locale === 'en'
      ? "Every month \u00b7 Simmer Down San Benito"
      : "Cada mes \u00b7 Simmer Down San Benito";
  }
  if (recurrence === "weekly") {
    return date.toLocaleDateString(dateLocale, {
      weekday: "long",
    });
  }
  return date.toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatEventTime(iso: string, locale?: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const dateLocale = locale === 'en' ? "en-US" : "es-SV";
  return date
    .toLocaleTimeString(dateLocale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(" ", "");
}

function deriveCoverPrice(tags?: string[] | null, locale?: string): string | null {
  if (!tags) return null;
  for (const tag of tags) {
    if (tag.startsWith("cover-")) return `$${tag.slice("cover-".length)}`;
    if (tag.startsWith("preventa-")) {
      const price = tag.slice("preventa-".length);
      return locale === 'en' ? `Pre-sale $${price}` : `Preventa $${price}`;
    }
  }
  return null;
}

function firstCategoryTag(tags?: string[] | null, locale?: string): string {
  if (!tags || tags.length === 0) return locale === 'en' ? "Event" : "Evento";
  const priority = ["music", "salsa", "rock", "poetry", "comedy", "openmic", "tribute", "signature"];
  const displayEs: Record<string, string> = {
    music: "M\u00fasica",
    salsa: "Salsa",
    rock: "Rock",
    poetry: "Poes\u00eda",
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
  const display = locale === 'en' ? displayEn : displayEs;
  for (const p of priority) {
    if (tags.includes(p)) return display[p] || p;
  }
  return display[tags[0]] || tags[0];
}

// ─────────────────────────────────────────────
// EventsList — main component
// ─────────────────────────────────────────────
export function EventsList() {
  const { t, locale } = useI18n();
  const [events, setEvents] = useState<DbEvent[]>(fallbackEvents);
  // Render the fallback on SSR so the page isn't blank on first paint.
  const [loading, setLoading] = useState(false);

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

  const featured = events.filter((e) => e.is_featured);
  const upcoming = events.filter((e) => !e.is_featured);

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
      {/* Featured Events — full-width posters */}
      {featured.map((event) => (
        <section key={event.id} className="pb-16">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-8 items-center bg-[#111111] border border-white/10 overflow-hidden"
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
                <span className="inline-flex items-center gap-2 bg-[#E85D04] text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 mb-6">
                  <Star className="w-3.5 h-3.5" />
                  {locale === 'es' ? 'Evento Destacado' : 'Featured Event'}
                </span>
                <h2 className="font-display text-3xl md:text-5xl text-white mb-4 leading-tight">
                  {locale === 'es' ? (event.title_es || event.title) : event.title}
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
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-[#E85D04] hover:bg-[#C2410C] text-white px-8 py-4 font-bold transition-all min-h-[56px]"
                >
                  {locale === 'es' ? 'Reservar Tu Lugar' : 'Reserve Your Spot'}
                  <ArrowRight className="w-5 h-5" />
                </Link>
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
                      <div className="absolute inset-0 bg-[#111111]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/70 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="bg-[#0A0A0A]/80 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1">
                        {firstCategoryTag(event.tags, locale)}
                      </span>
                    </div>
                    {deriveCoverPrice(event.tags, locale) && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-[#E85D04] text-white text-sm font-bold px-3 py-1">
                          {deriveCoverPrice(event.tags, locale)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="font-display text-xl text-white mb-2 line-clamp-2">
                      {locale === 'es' ? (event.title_es || event.title) : event.title}
                    </h3>
                    <p className="text-white/60 text-sm mb-4 line-clamp-2">
                      {locale === 'es' ? (event.description_es || event.description) : (event.description || event.description_es)}
                    </p>

                    <div className="space-y-2 mb-6 text-sm">
                      <div className="flex items-center gap-2 text-white/40">
                        <Calendar className="w-4 h-4 text-[#FBBF24]" />
                        <span className="capitalize">
                          {formatEventDate(event.starts_at, event.recurrence, locale)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-white/40">
                        <Clock className="w-4 h-4 text-[#FBBF24]" />
                        {formatEventTime(event.starts_at, locale)}
                      </div>
                      {event.custom_venue && (
                        <div className="flex items-center gap-2 text-white/40">
                          <MapPin className="w-4 h-4 text-[#FBBF24]" />
                          {event.custom_venue}
                        </div>
                      )}
                    </div>

                    <Link
                      href="/contact"
                      className="block text-center bg-white/10 hover:bg-[#E85D04] text-white py-3 font-semibold transition-colors min-h-[48px]"
                    >
                      {locale === 'es' ? 'Reservar' : 'Reserve'}
                    </Link>
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

  return (
    <section className="py-24 bg-[#1A1A1A] border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="font-display italic text-2xl text-white/40 mb-4">
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
                    <p className="text-white/40 text-sm">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-[#E85D04] hover:bg-[#C2410C] text-white px-8 py-4 font-bold transition-all min-h-[56px]"
            >
              {locale === 'es' ? 'Solicitar Información' : 'Request Information'}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="relative h-48">
                <Image
                  src="/images/events/musicos-poetas-locos-abril.jpg"
                  alt="Noche de música y poesía en Simmer Down"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative h-48 mt-8">
                <Image
                  src="/images/events/zoe-siddhartha-bandalos.jpg"
                  alt="Tributos a rock alternativo"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative h-48">
                <Image
                  src="/images/events/salzon-mayo.jpg"
                  alt="Salsa en vivo con Salzón"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative h-48 mt-8">
                <Image
                  src="/images/events/open-mic-abril.jpg"
                  alt="Open mic en Simmer Down"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </motion.div>
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
