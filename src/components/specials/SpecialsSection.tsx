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

// A gift card isn't on the menu: its special sells it at /giftcard (2026-11-26).
function isGiftCardSpecial(s: PublicSpecial): boolean {
  return /gift\s*card|tarjeta\s+de\s+regalo/i.test(s.title)
}

function ctaHref(s: PublicSpecial): string {
  if (isGiftCardSpecial(s)) {
    return s.special_price != null ? `/giftcard?monto=${Math.round(s.special_price)}` : '/giftcard'
  }
  return s.link_item_slug ? `/carta?item=${s.link_item_slug}` : '/carta'
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

  // Loading skeleton — same compact footprint as the real row
  if (loading) {
    return (
      <section aria-label="Especiales" className="py-12 md:py-16 px-6 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="h-3 w-32 bg-[#1A1A1A] rounded mb-3 animate-pulse" />
            <div className="h-7 w-48 bg-[#1A1A1A] rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-[#141414] rounded-xl h-[124px] animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Error state — silent, don't break the page
  if (error) return null

  const shown = specials.slice(0, 6)
  // A badge on every card is noise: only mark featured ones when it sets them apart.
  const markFeatured = shown.some((s) => s.featured) && !shown.every((s) => s.featured)
  const lgCols = shown.length >= 4 ? 'lg:grid-cols-4' : shown.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'

  // Compact promo row (2026-11-26: the 3:4 poster cards filled a whole screen).
  // Phones: one swipeable row. md+: a grid, all four gift cards on one line.
  return (
    <section aria-label="Especiales y Promociones" className="py-12 md:py-16 px-6 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex items-end justify-between gap-4"
        >
          <div>
            <p className="text-[#E85D04] text-xs font-semibold uppercase tracking-[0.2em] mb-1.5">
              Ofertas por tiempo limitado
            </p>
            <h2
              className="font-display text-white leading-tight"
              style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)' }}
            >
              ESPECIALES
            </h2>
          </div>
          {shown.length > 1 && (
            <p className="md:hidden text-[11px] text-white/35 pb-1">Desliza →</p>
          )}
        </motion.div>

        <div
          className={`flex md:grid gap-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0 pb-1 md:pb-0 md:grid-cols-2 ${lgCols}`}
          data-testid="specials-row"
        >
          {shown.map((special, i) => {
            const hero = heroContent(special)
            const discounted =
              special.special_price != null &&
              special.original_price != null &&
              special.original_price > special.special_price
            return (
              <motion.article
                key={special.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                data-testid="special-card"
                className="group relative w-[85%] shrink-0 snap-start md:w-auto flex gap-3 rounded-xl border border-white/8 bg-[#141414] p-2.5 hover:border-[#E85D04]/40 transition-colors duration-300"
              >
                {/* Thumbnail: the whole image, never cropped, over its own blurred glow */}
                <div className="relative w-24 h-24 sm:w-[104px] sm:h-[104px] shrink-0 overflow-hidden rounded-lg bg-[#0A0A0A]">
                  {special.image_url ? (
                    <>
                      <Image
                        src={special.image_url}
                        alt=""
                        aria-hidden="true"
                        fill
                        className="object-cover scale-125 blur-xl opacity-60"
                        sizes="112px"
                      />
                      <Image
                        src={special.image_url}
                        alt={special.title}
                        fill
                        className="object-contain transition-transform duration-500 group-hover:scale-105"
                        sizes="112px"
                      />
                    </>
                  ) : (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center text-center"
                      style={{ background: 'radial-gradient(130% 130% at 50% -10%, #FB923C 0%, #E85D04 46%, #7C2D12 100%)' }}
                    >
                      <span className="font-display text-white text-2xl leading-none drop-shadow">{hero.big}</span>
                      {hero.small && (
                        <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.25em] text-white/90">
                          {hero.small}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Copy */}
                <div className="flex min-w-0 flex-1 flex-col py-0.5">
                  <h3 className="flex items-center gap-1.5 font-display text-lg tracking-wide text-white leading-tight">
                    {markFeatured && special.featured && (
                      <Star className="w-3.5 h-3.5 shrink-0 fill-[#E85D04] text-[#E85D04]" aria-label="Destacado" />
                    )}
                    <span className="truncate">{special.title}</span>
                  </h3>
                  {special.description && (
                    <p className="mt-0.5 text-white/45 text-xs leading-snug line-clamp-1">
                      {special.description}
                    </p>
                  )}
                  <p className="mt-1 flex min-w-0 items-center gap-1 text-[10px] text-white/40">
                    <Calendar className="w-3 h-3 shrink-0 text-[#FBBF24]" />
                    <span className="truncate">{validityLabel(special)}</span>
                  </p>

                  <div className="mt-auto flex items-center gap-2 pt-2">
                    {special.special_price != null && (
                      <span className="flex items-baseline gap-1.5">
                        {discounted && (
                          <span className="text-white/35 text-xs line-through">
                            ${special.original_price!.toFixed(2)}
                          </span>
                        )}
                        <span className="text-[#E85D04] font-bold text-sm">
                          ${special.special_price.toFixed(2)}
                        </span>
                      </span>
                    )}
                    {special.is_live ? (
                      <Link
                        href={ctaHref(special)}
                        className="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-md bg-[#E85D04] px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#C2410C]"
                        aria-label={`${isGiftCardSpecial(special) ? 'Comprar' : 'Ordenar'} ${special.title}`}
                      >
                        {isGiftCardSpecial(special) ? 'Comprar' : 'Ordenar'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <span className="ml-auto shrink-0 rounded-full border border-[#FBBF24]/30 bg-[#FBBF24]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#FBBF24]">
                        Pronto
                      </span>
                    )}
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
