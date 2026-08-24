'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ChevronRight, Star } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Special } from '@/lib/types'
import { formatSpecialDate, formatSpecialDays } from '@/lib/specials'

// ─── Types ──────────────────────────────────────────────────────────────────

interface PublicSpecial extends Special {
  is_live: boolean
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function discountBadge(s: PublicSpecial): string {
  switch (s.discount_type) {
    case 'percentage':
      return `-${Math.round(s.discount_value)}%`
    case 'fixed':
      return s.special_price != null ? `$${s.special_price.toFixed(2)}` : 'OFERTA'
    case 'bundle':
      return 'COMBO'
    default:
      return 'OFERTA'
  }
}

// Big, image-free hero for specials without a photo — adapts to the promo
// type so the card still lands hard without artwork.
function heroContent(s: PublicSpecial): { big: string; small?: string } {
  switch (s.discount_type) {
    case 'percentage':
      return { big: `${Math.round(s.discount_value)}%`, small: 'OFF' }
    case 'fixed':
      return s.special_price != null
        ? { big: `$${s.special_price.toFixed(2)}`, small: 'Precio web' }
        : { big: 'OFERTA' }
    case 'bundle':
      return { big: 'COMBO', small: 'Especial' }
    default:
      return { big: 'OFERTA' }
  }
}

function validityLabel(s: PublicSpecial): string {
  if (!s.is_live) {
    return `Desde el ${formatSpecialDate(s.start_date)}`
  }
  if (s.days_of_week && s.days_of_week.length > 0) {
    return formatSpecialDays(s.days_of_week)
  }
  if (s.end_date && s.end_date !== s.start_date) {
    return `Hasta el ${formatSpecialDate(s.end_date)}`
  }
  if (s.end_date === s.start_date) {
    return `Solo el ${formatSpecialDate(s.start_date)}`
  }
  return 'Disponible ahora'
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function SpecialsSection() {
  const [specials, setSpecials] = useState<PublicSpecial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchSpecials() {
      try {
        const res = await fetch('/api/specials')
        if (!res.ok) throw new Error('fetch failed')
        const json = await res.json() as { success: boolean; specials?: PublicSpecial[] }
        if (!cancelled && json.success && json.specials) {
          setSpecials(json.specials)
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSpecials()
    return () => { cancelled = true }
  }, [])

  // Don't render section at all if no specials and not loading
  if (!loading && specials.length === 0) return null

  // Loading skeleton
  if (loading) {
    return (
      <section aria-label="Especiales" className="py-16 md:py-24 px-6 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <div className="h-3 w-32 bg-[#1A1A1A] rounded mb-3 animate-pulse" />
            <div className="h-8 w-64 bg-[#1A1A1A] rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-[#1A1A1A] rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Error state — silent, don't break the page
  if (error) return null

  return (
    <section aria-label="Especiales y Promociones" className="py-16 md:py-24 px-6 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="text-[#E85D04] text-xs font-semibold uppercase tracking-[0.2em] mb-2">
            Ofertas por tiempo limitado
          </p>
          <h2
            className="font-display text-white leading-tight"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            ESPECIALES
          </h2>
        </motion.div>

        {/* Specials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {specials.slice(0, 6).map((special, i) => {
            const hero = heroContent(special)
            return (
            <motion.div
              key={special.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="group bg-[#1A1A1A] rounded-xl border border-white/8 overflow-hidden hover:border-[#E85D04]/40 transition-all duration-300 flex flex-col"
            >
              {/* Image or placeholder */}
              {special.image_url ? (
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={special.image_url}
                    alt={special.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute top-3 right-3 bg-[#E85D04] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {discountBadge(special)}
                  </span>
                  {special.featured && (
                    <span className="absolute top-3 left-3 bg-[#FBBF24] text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide inline-flex items-center gap-1">
                      <Star className="w-3 h-3 fill-black" /> Destacado
                    </span>
                  )}
                </div>
              ) : (
                <div
                  className="relative h-44 overflow-hidden flex flex-col items-center justify-center text-center px-4"
                  style={{ background: 'radial-gradient(130% 130% at 50% -10%, #FB923C 0%, #E85D04 46%, #7C2D12 100%)' }}
                >
                  {/* Texture + depth so it reads as designed, not empty */}
                  <div
                    className="absolute inset-0 opacity-[0.10] mix-blend-overlay"
                    style={{ backgroundImage: 'repeating-linear-gradient(135deg, #000 0 2px, transparent 2px 11px)' }}
                    aria-hidden="true"
                  />
                  <div className="absolute -top-12 -right-10 w-44 h-44 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
                  <div className="absolute -bottom-14 -left-10 w-44 h-44 rounded-full bg-black/25 blur-3xl" aria-hidden="true" />
                  <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 rounded-none" aria-hidden="true" />

                  {/* Hero discount — the star of the card when there's no photo */}
                  <div className="relative">
                    <div
                      className="font-display font-bold text-white leading-none"
                      style={{ fontSize: 'clamp(2.75rem, 8vw, 3.75rem)', textShadow: '0 6px 28px rgba(0,0,0,0.4)' }}
                    >
                      {hero.big}
                    </div>
                    {hero.small && (
                      <div className="mt-1 pl-[0.4em] text-white font-extrabold tracking-[0.4em] text-sm uppercase">
                        {hero.small}
                      </div>
                    )}
                  </div>

                  {special.featured && (
                    <span className="absolute top-3 left-3 bg-white/95 text-[#9A3412] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide inline-flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-[#E85D04] text-[#E85D04]" /> Destacado
                    </span>
                  )}
                </div>
              )}

              {/* Card body */}
              <div className="p-4 flex flex-col gap-2.5 flex-1">
                <h3 className="text-white font-semibold text-base leading-tight line-clamp-2">
                  {special.title}
                </h3>

                {special.description && (
                  <p className="text-white/45 text-xs leading-relaxed line-clamp-2">
                    {special.description}
                  </p>
                )}

                {/* Price row (fixed-price promos) */}
                {special.special_price != null && (
                  <div className="flex items-baseline gap-2">
                    {special.original_price != null && (
                      <span className="text-white/35 text-sm line-through">
                        ${special.original_price.toFixed(2)}
                      </span>
                    )}
                    <span className="text-[#E85D04] font-bold text-lg">
                      ${special.special_price.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Validity */}
                <div className="flex items-center gap-1.5 text-xs text-white/40 mt-auto pt-1">
                  <Calendar className="w-3 h-3 text-[#FBBF24] flex-shrink-0" />
                  <span>{validityLabel(special)}</span>
                  {!special.is_live && (
                    <span className="ml-auto text-[10px] font-semibold text-[#FBBF24] bg-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-full px-2 py-0.5 uppercase tracking-wide">
                      Próximamente
                    </span>
                  )}
                </div>

                {/* CTA */}
                {special.is_live && (
                  <Link
                    href={special.link_item_slug ? `/carta?item=${special.link_item_slug}` : '/carta'}
                    className="mt-2 inline-flex items-center justify-center gap-1.5 bg-[#E85D04] hover:bg-[#E85D04]/85 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
                  >
                    Ordenar ahora
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
