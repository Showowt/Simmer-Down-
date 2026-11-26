'use client'

/**
 * Calendario de Adviento — the public /adviento page body.
 *
 * Recreates the client's campaign art (red striped wallpaper, wooden house
 * with 12 numbered drawers). Everything time-based arrives as props from the
 * server (drawer states computed in El Salvador time), so nothing here reads
 * the clock and SSR/hydration always agree. Locked drawers carry no image,
 * title or description — the server never sends them early.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Great_Vibes } from 'next/font/google'
import { Check, Gift, Instagram, Lock, MapPin, Share2, Snowflake, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { trackAdventOpen } from '@/lib/track'
import {
  formatAdventLong,
  formatAdventShort,
  type AdventCalendarView,
  type AdventDayPublic,
} from '@/lib/advent'

const script = Great_Vibes({ weight: '400', subsets: ['latin'], display: 'swap' })

const WALLPAPER =
  'repeating-linear-gradient(90deg, #A11B2D 0 36px, #B5233A 36px 72px)'
const GRAIN =
  'repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 9px), repeating-linear-gradient(90deg, rgba(255,226,190,0.035) 0 1px, transparent 1px 14px)'
const DRAWER_FACE = 'linear-gradient(180deg, #91501F 0%, #76401A 55%, #643314 100%)'
const CABINET = 'linear-gradient(180deg, #5E2E12 0%, #4A230D 100%)'
const ROOF = 'linear-gradient(180deg, #7C4119 0%, #5B2C11 100%)'
const FLOOR =
  'repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 120px), linear-gradient(180deg, #7A4520 0%, #5A3014 100%)'

const DEVICE_KEY = 'sd_advent_device'
const INSTAGRAM_URL = 'https://instagram.com/simmerdown_sv'

function deviceId(): string | null {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    return null
  }
}

function recordOpen(day: number): void {
  trackAdventOpen(day)
  const id = deviceId()
  if (!id) return
  void fetch('/api/advent/open', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ day, deviceId: id }),
    keepalive: true,
  }).catch((error) => console.error('[AdventCalendar] record open', error))
}

const SNOWFLAKES: Array<{ className: string; size: number }> = [
  { className: 'left-[4%] top-[6%]', size: 64 },
  { className: 'right-[6%] top-[3%]', size: 48 },
  { className: 'left-[10%] top-[38%]', size: 36 },
  { className: 'right-[3%] top-[30%]', size: 72 },
  { className: 'left-[2%] top-[62%]', size: 56 },
  { className: 'right-[9%] top-[58%]', size: 40 },
]

interface Props {
  view: AdventCalendarView
  /** Admin preview (?vista=YYYY-MM-DD): opens aren't counted. */
  preview: boolean
}

export default function AdventCalendar({ view, preview }: Props) {
  const { t, locale } = useI18n()
  const reduceMotion = useReducedMotion()
  const [active, setActive] = useState<AdventDayPublic | null>(null)
  const [imgState, setImgState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [shakeDay, setShakeDay] = useState<number | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const byDate = useMemo(
    () => [...view.days].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
    [view.days],
  )
  const todayDrawer = view.days.find((d) => d.state === 'today') ?? null
  const nextDrawer = byDate.find((d) => d.state === 'locked') ?? null
  const firstDrawer = byDate[0] ?? null

  // Modal: lock page scroll, Escape closes, focus the close button.
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [active])

  useEffect(
    () => () => {
      if (noteTimer.current) clearTimeout(noteTimer.current)
    },
    [],
  )

  const showNote = (text: string) => {
    setNote(text)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => {
      setNote(null)
      setShakeDay(null)
    }, 3800)
  }

  const onDrawer = (d: AdventDayPublic) => {
    if (d.state === 'locked') {
      setShakeDay(d.day)
      showNote(
        view.isLive
          ? t(
              { es: 'La casilla {n} se abre el {date}. ¡Vuelve ese día!', en: 'Drawer {n} opens on {date}. Come back that day!' },
              { n: String(d.day), date: formatAdventLong(d.date, locale) },
            )
          : t({
              es: 'El calendario abre muy pronto. ¡Síguenos en Instagram!',
              en: 'The calendar opens very soon. Follow us on Instagram!',
            }),
      )
      return
    }
    setImgState(d.imageUrl ? 'loading' : 'error')
    setCopied(false)
    setActive(d)
    if (!preview) recordOpen(d.day)
  }

  const share = async () => {
    const url = `${window.location.origin}/adviento`
    const text = t({
      es: 'Abre la casilla de hoy del Calendario de Adviento de Simmer Down 🎁',
      en: "Open today's drawer of the Simmer Down Advent Calendar 🎁",
    })
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'Calendario de Adviento — Simmer Down', text, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('[AdventCalendar] share', error)
    }
  }

  let status: string
  if (view.days.length === 0) {
    status = t({
      es: 'El calendario no está disponible en este momento. Intenta de nuevo en unos minutos.',
      en: "The calendar isn't available right now. Please try again in a few minutes.",
    })
  } else if (!view.isLive) {
    status = firstDrawer
      ? t(
          { es: 'Muy pronto: la primera casilla se abre el {date}.', en: 'Coming soon: the first drawer opens on {date}.' },
          { date: formatAdventLong(firstDrawer.date, locale) },
        )
      : t({ es: 'Muy pronto.', en: 'Coming soon.' })
  } else if (view.ended) {
    status = t({
      es: '¡Gracias por jugar con nosotros! El calendario de este año terminó.',
      en: 'Thanks for playing with us! This year’s calendar has ended.',
    })
  } else if (todayDrawer) {
    status = t(
      { es: '¡Hoy se abre la casilla {n}! Tócala para descubrir el reto.', en: 'Drawer {n} opens today! Tap it to discover the challenge.' },
      { n: String(todayDrawer.day) },
    )
  } else if (nextDrawer) {
    status = t(
      { es: 'Próxima sorpresa: casilla {n}, el {date}.', en: 'Next surprise: drawer {n}, on {date}.' },
      { n: String(nextDrawer.day), date: formatAdventLong(nextDrawer.date, locale) },
    )
  } else {
    status = t({
      es: 'Todas las casillas están abiertas. ¡Descubre los retos!',
      en: 'Every drawer is open. Discover the challenges!',
    })
  }

  const steps = [
    {
      n: '01.',
      title: t({ es: 'Descubre el reto', en: 'Discover the challenge' }),
      body: t({
        es: 'Revisa nuestras historias de Instagram y entra al enlace del calendario en nuestro sitio web.',
        en: 'Check our Instagram stories and open the calendar link on our website.',
      }),
    },
    {
      n: '02.',
      title: t({ es: 'Conoce la sorpresa', en: 'Find the surprise' }),
      body: t({
        es: 'Abre la casilla del día y descubre el reto navideño.',
        en: "Open the day's drawer and discover the holiday challenge.",
      }),
    },
    {
      n: '03.',
      title: t({ es: '¡Vive el reto!', en: 'Take the challenge!' }),
      body: t({
        es: 'Visítanos y cumple la dinámica en cualquiera de nuestros restaurantes.',
        en: 'Visit us and complete the challenge at any of our restaurants.',
      }),
    },
    {
      n: '04.',
      title: t({ es: 'Recibe tu premio', en: 'Get your prize' }),
      body: t({
        es: '¡Completa el reto y disfruta de tu sorpresa!',
        en: 'Complete the challenge and enjoy your surprise!',
      }),
    },
  ]

  const drawerLabel = (d: AdventDayPublic): string => {
    const date = formatAdventLong(d.date, locale)
    if (d.state === 'today') return t({ es: 'Casilla {n}, {date}: ¡ábrela hoy!', en: 'Drawer {n}, {date}: open it today!' }, { n: String(d.day), date })
    if (d.state === 'past') return t({ es: 'Casilla {n}, {date}: ver el reto', en: 'Drawer {n}, {date}: see the challenge' }, { n: String(d.day), date })
    return t({ es: 'Casilla {n}, se abre el {date}', en: 'Drawer {n}, opens on {date}' }, { n: String(d.day), date })
  }

  return (
    // pt-16: the header is fixed (h-16) and the location bar sticks under it,
    // so the first 64px of the page would sit behind them.
    <div className="relative overflow-hidden pt-16" data-testid="advent-page">
      {preview && (
        <div className="relative z-20 bg-[#FBBF24] text-[#3A1D00] text-sm px-4 py-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
          <span className="font-semibold">Vista previa de administrador:</span>
          <span>así se verá el {formatAdventLong(view.today, 'es')}. Los clientes ven la fecha real.</span>
          <Link href="/admin/adviento" className="underline font-semibold">Volver al panel</Link>
        </div>
      )}

      {/* ── WALLPAPER HERO ─────────────────────────────── */}
      <section className="relative" style={{ background: WALLPAPER }}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 30%, transparent 0%, rgba(40,0,8,0.45) 100%)' }}
        />
        {SNOWFLAKES.map((s, i) => (
          <Snowflake
            key={i}
            aria-hidden
            className={`pointer-events-none absolute text-white/20 ${s.className}`}
            style={{ width: s.size, height: s.size }}
            strokeWidth={1.25}
          />
        ))}

        <div className="relative max-w-3xl mx-auto px-4 pt-10 sm:pt-14 text-center">
          <p className="font-display text-sm sm:text-base tracking-[0.22em] text-white/90">
            {t({ es: 'Por primera vez llega nuestro', en: 'For the first time, our' }).toUpperCase()}
          </p>
          <h1
            className={`${script.className} mt-1 text-[3.6rem] leading-[0.95] sm:text-[5.2rem] text-white drop-shadow-[0_6px_14px_rgba(60,0,10,0.45)]`}
          >
            {t({ es: 'Calendario de Adviento', en: 'Advent Calendar' })}
          </h1>
          <p className="font-display mt-3 text-lg sm:text-2xl tracking-wide text-white max-w-xl mx-auto leading-snug text-balance">
            {t({
              es: 'Este diciembre, Simmer Down tiene 12 sorpresas preparadas para ti.',
              en: 'This December, Simmer Down has 12 surprises ready for you.',
            }).toUpperCase()}
          </p>

          <p
            role="status"
            data-testid="advent-status"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/25 backdrop-blur-sm px-4 py-2 text-sm text-white/95"
          >
            <Gift className="w-4 h-4 text-[#F5C451] shrink-0" aria-hidden />
            <span>{status}</span>
          </p>
        </div>

        {/* ── THE HOUSE ─────────────────────────────────── */}
        <div className="relative mx-auto mt-8 sm:mt-10 w-full max-w-[440px] px-5 sm:px-0">
          {/* Roof */}
          <div className="relative h-[96px] sm:h-[116px]">
            <div
              aria-hidden
              className="absolute -left-3 -right-3 inset-y-0 drop-shadow-[0_-2px_0_rgba(0,0,0,0.25)]"
              style={{ clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', background: `${GRAIN}, ${ROOF}` }}
            />
            <div
              aria-hidden
              className="absolute left-[6%] right-[6%] top-[14%] bottom-0"
              style={{ clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', background: `${GRAIN}, linear-gradient(180deg, #6A3414, #4E250D)` }}
            />
            <div
              aria-hidden
              className="absolute left-1/2 bottom-2.5 -translate-x-1/2 w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle at 40% 35%, #B06A35 0%, #8A4C22 60%, #6C3816 100%)',
                boxShadow: 'inset 0 2px 3px rgba(255,220,180,0.25), inset 0 -3px 5px rgba(0,0,0,0.35), 0 1px 0 rgba(0,0,0,0.4)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logos/logo-icon.svg"
                alt=""
                className="h-[34px] sm:h-[40px] w-auto opacity-80"
                style={{ filter: 'brightness(0) invert(0.82) sepia(0.7) saturate(1.6) hue-rotate(-12deg)' }}
              />
            </div>
          </div>

          {/* Cabinet */}
          <div
            className="relative grid grid-cols-4 gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-b-[6px]"
            style={{
              background: `${GRAIN}, ${CABINET}`,
              boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.25), 0 18px 40px rgba(40,0,8,0.45)',
            }}
          >
            {view.days.map((d) => {
              const isToday = d.state === 'today'
              const isPast = d.state === 'past'
              return (
                <motion.button
                  key={d.day}
                  type="button"
                  onClick={() => onDrawer(d)}
                  aria-label={drawerLabel(d)}
                  data-testid={`advent-drawer-${d.day}`}
                  data-state={d.state}
                  animate={shakeDay === d.day && !reduceMotion ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                  transition={{ duration: 0.45 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                  whileHover={reduceMotion || d.state === 'locked' ? undefined : { y: -2 }}
                  className="relative aspect-square rounded-[5px] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C451] focus-visible:ring-offset-2 focus-visible:ring-offset-[#4A230D]"
                  style={{
                    background: `${GRAIN}, ${DRAWER_FACE}`,
                    boxShadow: isToday
                      ? '0 0 0 2px #F5C451, 0 0 26px rgba(245,196,81,0.6), inset 0 1px 0 rgba(255,220,180,0.3)'
                      : 'inset 0 1px 0 rgba(255,220,180,0.22), inset 0 -2px 0 rgba(0,0,0,0.35), 0 2px 0 rgba(0,0,0,0.35)',
                  }}
                >
                  <span aria-hidden className="absolute inset-[5px] rounded-[3px] border border-black/25 shadow-[inset_0_0_0_1px_rgba(255,220,180,0.07)]" />
                  {isPast && <span aria-hidden className="absolute inset-0 bg-black/20" />}

                  <span
                    aria-hidden
                    className={`${script.className} absolute inset-0 flex items-center justify-center pb-2 text-[2.4rem] sm:text-[2.9rem] text-[#FBEBD5] drop-shadow-[0_2px_2px_rgba(0,0,0,0.45)] ${isToday && !reduceMotion ? 'animate-pulse' : ''}`}
                  >
                    {d.day}
                  </span>
                  <span
                    aria-hidden
                    className="absolute right-[13%] top-1/2 -translate-y-[85%] w-[7px] h-[7px] rounded-full"
                    style={{ background: 'radial-gradient(circle at 35% 35%, #FFE7A8, #C9952F 60%, #7A5410)' }}
                  />
                  <span aria-hidden className="absolute bottom-1.5 inset-x-0 text-center text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase text-[#F3D9B5]/80">
                    {formatAdventShort(d.date, locale)}
                  </span>

                  {d.state === 'locked' && (
                    <Lock aria-hidden className="absolute top-1.5 left-1.5 w-3 h-3 text-[#F3D9B5]/45" />
                  )}
                  {isPast && (
                    <Check aria-hidden className="absolute top-1.5 left-1.5 w-3.5 h-3.5 text-[#F5C451]/80" />
                  )}
                  {isToday && (
                    <span aria-hidden className="absolute top-1 left-1/2 -translate-x-1/2 rounded-sm bg-[#F5C451] px-1.5 py-px text-[9px] font-bold tracking-wider text-[#5A1A0C]">
                      {t({ es: 'HOY', en: 'TODAY' })}
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>
          <div aria-hidden className="mx-3 h-2.5 rounded-b-sm" style={{ background: CABINET }} />
        </div>

        {/* Floor */}
        <div aria-hidden className="relative mt-[-4px] h-16 sm:h-20" style={{ background: FLOOR }} />
      </section>

      {/* ── HOW TO PLAY ─────────────────────────────────── */}
      <section className="relative px-4 py-12 sm:py-16" style={{ background: `${GRAIN}, linear-gradient(180deg, #4E2810 0%, #2B1408 100%)` }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-center text-4xl sm:text-5xl text-white tracking-wide -rotate-1">
            {t({ es: '¡Participar es muy fácil!', en: 'Joining in is easy!' }).toUpperCase()}
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <li key={s.n} className="rounded-xl border border-white/10 bg-black/25 backdrop-blur-sm p-5">
                <p className="font-display text-2xl text-[#F5C451] tracking-wide">
                  {s.n} {s.title.toUpperCase()}
                </p>
                <p className="mt-2 text-sm text-white/80 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/restaurantes"
              className="inline-flex items-center gap-2 rounded-full bg-[#E85D04] hover:bg-[#C2410C] px-6 py-3 text-sm font-semibold text-white transition-colors"
            >
              <MapPin className="w-4 h-4" aria-hidden />
              {t({ es: 'Ver nuestros restaurantes', en: 'See our restaurants' })}
            </Link>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 hover:border-white/40 px-6 py-3 text-sm font-semibold text-white/90 transition-colors"
            >
              <Instagram className="w-4 h-4" aria-hidden />
              {t({ es: 'Síguenos en Instagram', en: 'Follow us on Instagram' })}
            </a>
          </div>
        </div>
      </section>

      {/* Locked-drawer note */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 lg:bottom-8 z-[10001] flex justify-center px-4">
        <AnimatePresence>
          {note && (
            <motion.p
              key={note}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              data-testid="advent-note"
              className="pointer-events-auto flex items-center gap-2 rounded-xl border border-[#F5C451]/30 bg-[#1A0A06]/95 px-4 py-3 text-sm text-white shadow-2xl max-w-sm"
            >
              <Lock className="w-4 h-4 text-[#F5C451] shrink-0" aria-hidden />
              {note}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── REVEAL ──────────────────────────────────────── */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[10002] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="advent-dialog-title"
              data-testid="advent-dialog"
              onClick={(e) => e.stopPropagation()}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 48, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.97 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[#F5C451]/25 bg-[#1B0E08] shadow-2xl"
            >
              <div
                className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-3"
                style={{ background: `${GRAIN}, ${DRAWER_FACE}` }}
              >
                <div>
                  <p id="advent-dialog-title" className={`${script.className} text-3xl leading-none text-[#FBEBD5]`}>
                    {t({ es: 'Casilla {n}', en: 'Drawer {n}' }, { n: String(active.day) })}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-[#F3D9B5]/80">
                    {formatAdventLong(active.date, locale)}
                  </p>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setActive(null)}
                  aria-label={t({ es: 'Cerrar', en: 'Close' })}
                  className="w-10 h-10 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C451]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative bg-black">
                {active.imageUrl && imgState !== 'error' ? (
                  <>
                    {imgState === 'loading' && (
                      <div aria-hidden className="absolute inset-0 animate-pulse bg-gradient-to-b from-[#2A160C] to-[#120804]" />
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={active.imageUrl}
                      alt={active.title ?? t({ es: 'Sorpresa de la casilla {n}', en: 'Drawer {n} surprise' }, { n: String(active.day) })}
                      data-testid="advent-prize-image"
                      onLoad={() => setImgState('ready')}
                      onError={() => setImgState('error')}
                      className={`relative w-full h-auto max-h-[62vh] min-h-[240px] object-contain transition-opacity duration-500 ${imgState === 'ready' ? 'opacity-100' : 'opacity-0'}`}
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                    <Gift className="w-12 h-12 text-[#F5C451]" aria-hidden />
                    <p className="text-white font-semibold">
                      {active.imageUrl
                        ? t({ es: 'No pudimos cargar la sorpresa.', en: "We couldn't load the surprise." })
                        : t({ es: 'La sorpresa de esta casilla se está envolviendo.', en: "This drawer's surprise is still being wrapped." })}
                    </p>
                    <p className="text-white/60 text-sm">
                      {t({ es: 'Recarga la página en un rato.', en: 'Reload the page in a little while.' })}
                    </p>
                  </div>
                )}
              </div>

              <div className="px-5 py-5">
                {active.title && <h3 className="font-display text-2xl tracking-wide text-white">{active.title}</h3>}
                {active.description && (
                  <p className="mt-2 whitespace-pre-line text-sm text-white/80 leading-relaxed">{active.description}</p>
                )}
                {active.state === 'past' && (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-white/5 px-3 py-1.5 text-xs text-white/70">
                    <Check className="w-3.5 h-3.5 text-[#F5C451]" aria-hidden />
                    {t({ es: 'Este reto fue el {date}.', en: 'This challenge was on {date}.' }, { date: formatAdventLong(active.date, locale) })}
                  </p>
                )}
                <p className="mt-4 text-sm text-white/70">
                  {t({
                    es: 'Visítanos y cumple el reto en cualquiera de nuestros restaurantes para recibir tu premio.',
                    en: 'Visit us and complete the challenge at any of our restaurants to get your prize.',
                  })}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link
                    href="/restaurantes"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E85D04] hover:bg-[#C2410C] px-4 py-3 text-sm font-semibold text-white transition-colors"
                  >
                    <MapPin className="w-4 h-4" aria-hidden />
                    {t({ es: 'Restaurantes', en: 'Restaurants' })}
                  </Link>
                  <button
                    type="button"
                    onClick={share}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 hover:border-white/40 px-4 py-3 text-sm font-semibold text-white transition-colors"
                  >
                    <Share2 className="w-4 h-4" aria-hidden />
                    {copied ? t({ es: '¡Enlace copiado!', en: 'Link copied!' }) : t({ es: 'Compartir', en: 'Share' })}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
