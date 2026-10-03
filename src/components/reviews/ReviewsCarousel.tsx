'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { CURATED_REVIEWS } from '@/lib/reviews-data'

// Google reviews listing (Business Profile). A Maps search is a safe default
// until the exact Place URL is wired in; it resolves to the Simmer Down listings.
const GOOGLE_REVIEWS_URL =
  'https://www.google.com/maps/search/Simmer+Down+El+Salvador'

// Google "G" mark — for authentic review attribution.
function GoogleG({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.5l6.3 5.3C41.8 35.6 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  )
}

function localizeTime(t: string, es: boolean): string {
  if (!es) return t
  return t
    .replace(/^a year ago$/, 'hace un año')
    .replace(/^a month ago$/, 'hace un mes')
    .replace(/^a week ago$/, 'hace una semana')
    .replace(/(\d+) years ago/, 'hace $1 años')
    .replace(/(\d+) months ago/, 'hace $1 meses')
    .replace(/(\d+) weeks ago/, 'hace $1 semanas')
    .replace(/(\d+) days ago/, 'hace $1 días')
}

export default function ReviewsCarousel() {
  const { locale } = useI18n()
  const es = locale === 'es'
  const tr = (a: string, b: string) => (es ? a : b)

  const scroller = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const reviews = CURATED_REVIEWS

  const goTo = useCallback((i: number) => {
    const c = scroller.current
    if (!c) return
    const n = reviews.length
    const idx = ((i % n) + n) % n
    const card = c.children[idx] as HTMLElement | undefined
    if (card) c.scrollTo({ left: card.offsetLeft, behavior: 'smooth' })
  }, [reviews.length])

  // Track the active card from scroll position (for dots).
  useEffect(() => {
    const c = scroller.current
    if (!c) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const children = Array.from(c.children) as HTMLElement[]
        const mid = c.scrollLeft + c.clientWidth / 2
        let best = 0
        let bestDist = Infinity
        children.forEach((ch, i) => {
          const center = ch.offsetLeft + ch.offsetWidth / 2
          const d = Math.abs(center - mid)
          if (d < bestDist) { bestDist = d; best = i }
        })
        setActive(best)
      })
    }
    c.addEventListener('scroll', onScroll, { passive: true })
    return () => { c.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  // Auto-advance (pauses on hover/touch/focus).
  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      setActive((a) => {
        const next = (a + 1) % reviews.length
        goTo(next)
        return next
      })
    }, 5000)
    return () => clearInterval(id)
  }, [paused, goTo, reviews.length])

  return (
    <section aria-label={tr('Reseñas de Google', 'Google reviews')} className="py-16 md:py-24 bg-[#0A0A0A] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-14"
        >
          <p className="inline-flex items-center gap-2 text-white/40 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            <GoogleG className="w-4 h-4" /> {tr('Reseñas de Google', 'Google reviews')}
          </p>
          <h2 className="font-display text-white leading-tight" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
            {tr('LO QUE DICEN NUESTROS CLIENTES', 'WHAT OUR GUESTS SAY')}
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-[#FBBF24] fill-[#FBBF24]" />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Carousel */}
      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
      >
        <div
          ref={scroller}
          className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory px-6 lg:px-8 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {reviews.map((r, i) => (
            <figure
              key={i}
              className="snap-start shrink-0 w-[85vw] sm:w-[360px] bg-[#141414] border border-white/10 rounded-2xl p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-0.5" aria-label={tr('5 de 5 estrellas', '5 out of 5 stars')}>
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-[#FBBF24] fill-[#FBBF24]" />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-white/10" />
              </div>
              <blockquote className="text-white/75 text-sm leading-relaxed flex-1">
                “{r.text}”
              </blockquote>
              <figcaption className="mt-5 pt-4 border-t border-white/8 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#E85D04]/20 text-[#E85D04] flex items-center justify-center font-bold shrink-0">
                  {r.author.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{r.author}</p>
                  <p className="text-white/40 text-xs flex items-center gap-1.5">
                    <span>{r.location}</span>
                    <span className="text-white/20">·</span>
                    <span>{localizeTime(r.time, es)}</span>
                  </p>
                </div>
                <GoogleG className="w-4 h-4 shrink-0 opacity-70" />
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Prev / Next (desktop) */}
        <button
          type="button"
          onClick={() => goTo(active - 1)}
          aria-label={tr('Anterior', 'Previous')}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#1A1A1A]/90 border border-white/15 text-white/70 hover:text-white hover:border-white/40 items-center justify-center backdrop-blur-sm transition-colors z-10"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => goTo(active + 1)}
          aria-label={tr('Siguiente', 'Next')}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#1A1A1A]/90 border border-white/15 text-white/70 hover:text-white hover:border-white/40 items-center justify-center backdrop-blur-sm transition-colors z-10"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Dots + CTA */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center gap-1.5 mt-6">
          {reviews.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={tr(`Ir a la reseña ${i + 1}`, `Go to review ${i + 1}`)}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? 'w-6 bg-[#E85D04]' : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
        <div className="text-center mt-8">
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition border border-white/15 hover:border-white/30 rounded-xl px-5 py-3"
          >
            <GoogleG className="w-4 h-4" />
            {tr('Ver todas las reseñas en Google', 'See all reviews on Google')}
          </a>
        </div>
      </div>
    </section>
  )
}
