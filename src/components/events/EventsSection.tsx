'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// ─── Types ──────────────────────────────────────────────────────────────────

interface EventData {
  id: string
  title: string
  title_es: string | null
  slug: string
  description: string | null
  description_es: string | null
  location_id: string | null
  custom_venue: string | null
  starts_at: string
  ends_at: string | null
  image_url: string | null
  thumbnail_url: string | null
  is_featured: boolean
  tags: string[]
}

// ─── Date formatting ────────────────────────────────────────────────────────

function formatEventDate(isoStr: string): string {
  const date = new Date(isoStr)
  if (isNaN(date.getTime())) return isoStr
  return date.toLocaleDateString('es-SV', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function formatEventTime(isoStr: string): string {
  const date = new Date(isoStr)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('es-SV', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function EventsSection() {
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchEvents() {
      try {
        const res = await fetch('/api/events')
        if (!res.ok) throw new Error('fetch failed')
        const json = await res.json() as { success: boolean; events?: EventData[] }
        if (!cancelled && json.success && json.events) {
          setEvents(json.events)
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchEvents()
    return () => { cancelled = true }
  }, [])

  // Don't render section at all if no events and not loading
  if (!loading && events.length === 0) return null

  // Loading skeleton
  if (loading) {
    return (
      <section aria-label="Eventos" className="py-16 md:py-24 px-6 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <div className="h-3 w-32 bg-[#1A1A1A] rounded mb-3 animate-pulse" />
            <div className="h-8 w-64 bg-[#1A1A1A] rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-[#1A1A1A] rounded-xl h-72 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Error state — silent, don't break the page
  if (error) return null

  return (
    <section aria-label="Próximos Eventos" className="py-16 md:py-24 px-6 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <p className="text-[#E85D04] text-xs font-semibold uppercase tracking-[0.2em] mb-2">
              Próximamente
            </p>
            <h2
              className="font-display text-white leading-tight"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
            >
              PRÓXIMOS EVENTOS
            </h2>
          </div>
          <Link
            href="/events"
            className="hidden md:inline-flex items-center gap-2 text-white/50 text-sm font-medium uppercase tracking-wider hover:text-[#E85D04] transition-colors"
          >
            Ver todos
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Events grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.slice(0, 6).map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="group bg-[#1A1A1A] rounded-xl border border-white/8 overflow-hidden hover:border-[#E85D04]/40 transition-all duration-300"
            >
              {/* Image or date placeholder */}
              {(event.image_url || event.thumbnail_url) ? (
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={event.thumbnail_url || event.image_url || ''}
                    alt={event.title_es || event.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {event.is_featured && (
                    <span className="absolute top-3 left-3 bg-[#E85D04] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Destacado
                    </span>
                  )}
                </div>
              ) : (
                <div className="relative h-32 bg-gradient-to-br from-[#E85D04]/10 to-[#0A0A0A] flex items-center justify-center">
                  <div className="text-center">
                    <Calendar className="w-8 h-8 text-[#E85D04]/60 mx-auto mb-1" />
                    <p className="text-[#E85D04]/80 text-sm font-semibold capitalize">
                      {formatEventDate(event.starts_at)}
                    </p>
                  </div>
                  {event.is_featured && (
                    <span className="absolute top-3 left-3 bg-[#E85D04] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Destacado
                    </span>
                  )}
                </div>
              )}

              {/* Card body */}
              <div className="p-4 flex flex-col gap-2.5">
                <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">
                  {event.title_es || event.title}
                </h3>

                {(event.description_es || event.description) && (
                  <p className="text-white/45 text-xs leading-relaxed line-clamp-2">
                    {event.description_es || event.description}
                  </p>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#FBBF24] flex-shrink-0" />
                    <span className="capitalize">{formatEventDate(event.starts_at)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#FBBF24] flex-shrink-0" />
                    {formatEventTime(event.starts_at)}
                    {event.ends_at ? ` – ${formatEventTime(event.ends_at)}` : ''}
                  </span>
                  {event.custom_venue && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#FBBF24] flex-shrink-0" />
                      {event.custom_venue}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1 pt-2 border-t border-white/6">
                    {event.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile "ver todos" link */}
        <div className="mt-8 md:hidden text-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-white/60 text-sm font-medium uppercase tracking-wider hover:text-[#E85D04] transition-colors"
          >
            Ver todos los eventos
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
