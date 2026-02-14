"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Event } from "@/lib/types";

// Fallback events if database is empty
const fallbackEvents: Event[] = [
  {
    id: "1",
    title: "Jazz & Pizza Night",
    description:
      "Disfruta de jazz en vivo mientras saboreas nuestras pizzas signature. Artistas locales, cocteles artesanales y vibras increibles.",
    date: "Cada Viernes",
    time: "7:00 PM - 11:00 PM",
    location: "San Benito",
    image_url:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
    category: "Musica",
    price: null,
    featured: true,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Taller de Pizza Artesanal",
    description:
      "Aprende el arte de hacer pizza de nuestro chef principal. Experiencia practica con masa, salsa y tecnicas de horno.",
    date: "Feb 15, 2025",
    time: "2:00 PM - 5:00 PM",
    location: "Santa Ana",
    image_url:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
    category: "Taller",
    price: "$45",
    featured: false,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Maridaje Vino & Pizza",
    description:
      "Una noche curada de vinos italianos perfectamente maridados con nuestras pizzas artesanales. Cupos limitados.",
    date: "Feb 22, 2025",
    time: "6:30 PM - 9:30 PM",
    location: "Coatepeque",
    image_url:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800",
    category: "Degustacion",
    price: "$65",
    featured: false,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Pizza Party para Ninos",
    description:
      "Deja que los pequenos creen sus propias mini pizzas. Incluye elaboracion de pizza, juegos y premios. Edades 5-12.",
    date: "Cada Sabado",
    time: "11:00 AM - 1:00 PM",
    location: "Todas las Ubicaciones",
    image_url:
      "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=800",
    category: "Familia",
    price: "$25",
    featured: false,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function EventsList() {
  const [events, setEvents] = useState<Event[]>(fallbackEvents);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("active", true)
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          setEvents(data);
        }
      } catch (err) {
        // Use fallback events
        console.log("Using fallback events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const featuredEvents = events.filter((e) => e.featured);
  const upcomingEvents = events.filter((e) => !e.featured);

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
      {/* Featured Events */}
      {featuredEvents.map((event) => (
        <section key={event.id} className="pb-16">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[#1F1D1A]/80 z-10" />
              <div className="relative w-full h-[500px]">
                <Image
                  src={
                    event.image_url ||
                    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800"
                  }
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 z-20 flex items-center">
                <div className="max-w-2xl p-8 md:p-16">
                  <span className="inline-flex items-center gap-2 bg-[#FF6B35] text-white text-sm font-bold px-4 py-2 mb-6">
                    <Star className="w-4 h-4" />
                    Evento Destacado
                  </span>
                  <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0] mb-4">
                    {event.title}
                  </h2>
                  <p className="text-lg text-[#B8B0A8] mb-6">
                    {event.description}
                  </p>
                  <div className="flex flex-wrap gap-4 mb-8">
                    <div className="flex items-center gap-2 text-[#B8B0A8]">
                      <Calendar className="w-5 h-5 text-[#FF6B35]" />
                      {event.date}
                    </div>
                    <div className="flex items-center gap-2 text-[#B8B0A8]">
                      <Clock className="w-5 h-5 text-[#FF6B35]" />
                      {event.time}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-[#B8B0A8]">
                        <MapPin className="w-5 h-5 text-[#FF6B35]" />
                        {event.location}
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
              </div>
            </motion.div>
          </div>
        </section>
      ))}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="font-display text-3xl text-[#FFF8F0] mb-12">
              Proximos Eventos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="group bg-[#252320] border border-[#3D3936] overflow-hidden hover:border-[#FF6B35]/50 transition-all"
                >
                  <div className="aspect-video overflow-hidden relative">
                    <Image
                      src={
                        event.image_url ||
                        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800"
                      }
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-[#2D2A26]/80 text-[#FFF8F0] text-xs font-semibold px-3 py-1">
                        {event.category}
                      </span>
                    </div>
                    {event.price && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-[#FF6B35] text-white text-sm font-bold px-3 py-1">
                          {event.price}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="font-display text-xl text-[#FFF8F0] mb-2">
                      {event.title}
                    </h3>
                    <p className="text-[#B8B0A8] text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-[#6B6560] text-sm">
                        <Calendar className="w-4 h-4 text-[#FF6B35]" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-2 text-[#6B6560] text-sm">
                        <Clock className="w-4 h-4 text-[#FF6B35]" />
                        {event.time}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-[#6B6560] text-sm">
                          <MapPin className="w-4 h-4 text-[#FF6B35]" />
                          {event.location}
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
              Buscas el lugar perfecto para tu proxima celebracion? Ofrecemos
              espacios para eventos privados, menus personalizados y servicio de
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
              Solicitar Informacion
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
                  src="https://images.unsplash.com/photo-1529543544277-750e7ea18e27?w=400"
                  alt="Evento privado"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative h-48 mt-8">
                <Image
                  src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400"
                  alt="Celebracion"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative h-48">
                <Image
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400"
                  alt="Evento corporativo"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative h-48 mt-8">
                <Image
                  src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400"
                  alt="Fiesta"
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
