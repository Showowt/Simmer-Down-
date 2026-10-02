'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { BedDouble, ArrowRight, Waves, Wifi } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { isRenderableRoomImage, type RoomAvailability } from '@/lib/rooms'

// Homepage "protagonismo" block for the Lago de Coatepeque stays. Self-hides
// when the venue has no active rooms — we never advertise lodging that isn't
// published (same honesty rule as the events/specials sections).
//
// Split layout (content | room photo) rather than a full-bleed background: the
// room uploads are small (~400px), so a contained half-width panel keeps them
// crisp and bright instead of stretched and dark under a heavy overlay.
export default function EstadiaSection() {
  const { locale } = useI18n()
  const es = locale === 'es'
  const tr = (a: string, b: string) => (es ? a : b)

  const [rooms, setRooms] = useState<RoomAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/rooms?location_id=lago-coatepeque', { cache: 'no-store' })
        const json = await res.json()
        if (cancelled) return
        if (res.ok && json.success && Array.isArray(json.rooms)) {
          setRooms(json.rooms as RoomAvailability[])
        } else {
          setFailed(true)
        }
      } catch {
        if (!cancelled) setFailed(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Self-hide while loading, on error, or when nothing is published.
  if (loading || failed || rooms.length === 0) return null

  const prices = rooms
    .map((r) => r.price_per_night)
    .filter((p): p is number => typeof p === 'number' && p > 0)
  const minPrice = prices.length ? Math.min(...prices) : null
  const heroImage = rooms.find((r) => isRenderableRoomImage(r.image_url))?.image_url || null

  return (
    <section aria-label={tr('Estadía frente al lago', 'Lakefront stay')} className="py-16 md:py-24 px-6 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid md:grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-[#111]"
        >
          {/* Room photo — top on mobile, right on desktop */}
          <div className="relative min-h-[220px] md:min-h-[460px] order-1 md:order-2">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={tr('Habitación frente al Lago de Coatepeque', 'Room by Lake Coatepeque')}
                fill
                sizes="(max-width: 768px) 100vw, 620px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#E85D04]/15 to-[#0A0A0A] flex items-center justify-center">
                <BedDouble className="w-12 h-12 text-[#E85D04]/40" />
              </div>
            )}
            {/* Blend the photo into the content panel on desktop */}
            <div className="hidden md:block absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#111] to-transparent" />
            {/* Soften the bottom on mobile where content sits below */}
            <div className="md:hidden absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#111] to-transparent" />
          </div>

          {/* Content — below on mobile, left on desktop */}
          <div className="p-8 md:p-14 flex flex-col justify-center order-2 md:order-1">
            <span className="inline-flex items-center gap-2 text-[#E85D04] font-semibold uppercase tracking-[0.2em] text-xs mb-4">
              <BedDouble className="w-4 h-4" /> {tr('Lago de Coatepeque', 'Lake Coatepeque')}
            </span>
            <h2
              className="font-display text-white uppercase tracking-tight leading-[1.05] mb-4"
              style={{ fontSize: 'clamp(2rem, 4.5vw, 3.25rem)' }}
            >
              {tr('Estadía frente al lago', 'Lakefront stay')}
            </h2>
            <p className="text-white/70 text-base md:text-lg mb-6 max-w-md">
              {tr(
                'Despierta frente al Lago de Coatepeque. Habitaciones con vista — reserva y paga en línea en segundos.',
                'Wake up to Lake Coatepeque. Rooms with a view — book and pay online in seconds.',
              )}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mb-8">
              {minPrice != null && (
                <span className="text-white">
                  <span className="text-white/50 text-sm">{tr('Desde', 'From')} </span>
                  <span className="text-[#F5D47A] font-display text-2xl">${minPrice}</span>
                  <span className="text-white/50 text-sm">/{tr('noche', 'night')}</span>
                </span>
              )}
              <span className="flex items-center gap-3 text-white/40 text-xs">
                <span className="flex items-center gap-1"><Waves className="w-3.5 h-3.5" /> {tr('Vista al lago', 'Lake view')}</span>
                <span className="flex items-center gap-1"><Wifi className="w-3.5 h-3.5" /> WiFi</span>
              </span>
            </div>
            <Link
              href="/estadia"
              className="inline-flex items-center gap-2 bg-[#E85D04] hover:bg-[#C2410C] text-white px-7 py-3.5 rounded-xl font-semibold transition-colors min-h-[52px] w-fit"
            >
              {tr('Reservar Estadía', 'Book a Stay')} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
