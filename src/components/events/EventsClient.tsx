"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

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
function formatEventDate(iso: string, recurrence?: string | null): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  if (recurrence === "monthly") {
    return "Cada mes · Simmer Down San Benito";
  }
  if (recurrence === "weekly") {
    return date.toLocaleDateString("es-SV", {
      weekday: "long",
    });
  }
  return date.toLocaleDateString("es-SV", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatEventTime(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  return date
    .toLocaleTimeString("es-SV", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(" ", "");
}

function deriveCoverPrice(tags?: string[] | null): string | null {
  if (!tags) return null;
  for (const t of tags) {
    if (t.startsWith("cover-")) return `$${t.slice("cover-".length)}`;
    if (t.startsWith("preventa-")) return `Preventa $${t.slice("preventa-".length)}`;
  }
  return null;
}

function firstCategoryTag(tags?: string[] | null): string {
  if (!tags || tags.length === 0) return "Evento";
  const priority = ["music", "salsa", "rock", "poetry", "comedy", "openmic", "tribute", "signature"];
  const display: Record<string, string> = {
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
  for (const p of priority) {
    if (tags.includes(p)) return display[p] || p;
  }
  return display[tags[0]] || tags[0];
}

// ─────────────────────────────────────────────
// EventsList — main component
// ─────────────────────────────────────────────
export function EventsList() {
  const [events, setEvents] = useState<DbEvent[]>(fallbackEvents);
  const [loading, setLoading] = useState(true);

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
            <div className="h-[500px] bg-[#252320]" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-80 bg-[#252320]" />
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
              className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-8 items-center bg-[#1F1D1A] border border-[#3D3936] overflow-hidden"
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
                  <div className="absolute inset-0 bg-[#252320]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/20 via-transparent to-transparent" />
              </div>

              <div className="p-8 md:p-12">
                <span className="inline-flex items-center gap-2 bg-[#FF6B35] text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 mb-6">
                  <Star className="w-3.5 h-3.5" />
                  Evento Destacado
                </span>
                <h2 className="font-display text-3xl md:text-5xl text-[#FFF8F0] mb-4 leading-tight">
                  {event.title}
                </h2>
                <p className="text-lg text-[#B8B0A8] mb-6">
                  {event.description_es || event.description}
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-3 mb-8 text-[#B8B0A8]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#FF6B35]" />
                    <span className="capitalize">{formatEventDate(event.starts_at, event.recurrence)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#FF6B35]" />
                    {formatEventTime(event.starts_at)}
                  </div>
                  {event.custom_venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#FF6B35]" />
                      {event.custom_venue}
                    </div>
                  )}
                  {deriveCoverPrice(event.tags) && (
                    <div className="flex items-center gap-2 text-[#C9A84C] font-semibold">
                      {deriveCoverPrice(event.tags)}
                    </div>
                  )}
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-8 py-4 font-bold transition-all min-h-[56px]"
                >
                  Reservar Tu Lugar
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
            <h2 className="font-display text-3xl text-[#FFF8F0] mb-12">
              Próximos Eventos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcoming.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className="group bg-[#252320] border border-[#3D3936] overflow-hidden hover:border-[#FF6B35]/50 transition-all"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {event.image_url ? (
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[#1F1D1A]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/70 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="bg-[#2D2A26]/80 backdrop-blur-sm text-[#FFF8F0] text-xs font-semibold px-3 py-1">
                        {firstCategoryTag(event.tags)}
                      </span>
                    </div>
                    {deriveCoverPrice(event.tags) && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-[#FF6B35] text-white text-sm font-bold px-3 py-1">
                          {deriveCoverPrice(event.tags)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="font-display text-xl text-[#FFF8F0] mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-[#B8B0A8] text-sm mb-4 line-clamp-2">
                      {event.description_es || event.description}
                    </p>

                    <div className="space-y-2 mb-6 text-sm">
                      <div className="flex items-center gap-2 text-[#6B6560]">
                        <Calendar className="w-4 h-4 text-[#FF6B35]" />
                        <span className="capitalize">
                          {formatEventDate(event.starts_at, event.recurrence)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[#6B6560]">
                        <Clock className="w-4 h-4 text-[#FF6B35]" />
                        {formatEventTime(event.starts_at)}
                      </div>
                      {event.custom_venue && (
                        <div className="flex items-center gap-2 text-[#6B6560]">
                          <MapPin className="w-4 h-4 text-[#FF6B35]" />
                          {event.custom_venue}
                        </div>
                      )}
                    </div>

                    <Link
                      href="/contact"
                      className="block text-center bg-[#3D3936] hover:bg-[#FF6B35] text-[#FFF8F0] py-3 font-semibold transition-colors min-h-[48px]"
                    >
                      Reservar
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
  return (
    <section className="py-24 bg-[#252320] border-t border-[#3D3936]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              Eventos Privados
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0] mb-6">
              Tu Evento Con Nosotros
            </h2>
            <p className="text-lg text-[#B8B0A8] mb-8">
              ¿Buscas el lugar perfecto para tu próxima celebración? Ofrecemos
              espacios para eventos privados, menús personalizados y servicio de
              catering para hacer tu evento inolvidable.
            </p>

            <div className="space-y-6 mb-8">
              {eventTypes.map((type) => (
                <div key={type.title} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                    {type.icon}
                  </div>
                  <div>
                    <h3 className="text-[#FFF8F0] font-semibold mb-1">
                      {type.title}
                    </h3>
                    <p className="text-[#6B6560] text-sm">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-8 py-4 font-bold transition-all min-h-[56px]"
            >
              Solicitar Información
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
