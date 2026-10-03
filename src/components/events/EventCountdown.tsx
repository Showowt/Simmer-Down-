'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import {
  countdownTo,
  effectiveEndMs,
  isLiveNow,
  isRecurring,
  type EventTiming,
} from '@/lib/events'

interface Props {
  startsAt: string
  endsAt?: string | null
  recurrence?: string | null
  locale?: string
  variant?: 'hero' | 'card'
  className?: string
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Live, ticking countdown to an event. Hydration-safe: renders nothing until
 * mounted (the server has no stable "now"), then updates every second.
 * Returns null for recurring events and for events that are already over.
 */
export default function EventCountdown({
  startsAt,
  endsAt,
  recurrence,
  locale = 'es',
  variant = 'card',
  className = '',
}: Props) {
  const es = locale !== 'en'
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Recurring programmes have no single countdown; the date label says "Cada mes".
  // (Non-recurring events are stored as the string 'none', not NULL.)
  if (isRecurring({ recurrence })) return null
  // Not mounted → render nothing so SSR and the first client paint match.
  if (now === null) return null

  const timing: EventTiming = { starts_at: startsAt, ends_at: endsAt, recurrence }

  // Happening right now → a pulsing "EN VIVO" badge.
  if (isLiveNow(timing, now)) {
    if (variant === 'hero') {
      return (
        <div className={`inline-flex items-center gap-2.5 bg-[#E11D48] text-white px-5 py-3 rounded-xl ${className}`}>
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
          </span>
          <span className="font-bold uppercase tracking-[0.15em] text-sm">
            {es ? 'En vivo ahora' : 'Live now'}
          </span>
        </div>
      )
    }
    return (
      <span className={`inline-flex items-center gap-1.5 bg-[#E11D48] text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${className}`}>
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
        </span>
        {es ? 'En vivo' : 'Live'}
      </span>
    )
  }

  // Already over (edge case — these are filtered out upstream).
  if (effectiveEndMs(timing) < now) return null

  const cd = countdownTo(startsAt, now)
  if (!cd || cd.totalMs <= 0) return null

  const urgent = cd.totalMs < 48 * 3_600_000 // final 48h → heightened urgency (accent + pulse)
  const finalHours = cd.totalMs < 6 * 3_600_000 // truly imminent → "Últimas horas"
  const accent = urgent ? '#E85D04' : '#FBBF24'

  // ── Hero: segmented tiles (the showstopper on the /events page) ──
  if (variant === 'hero') {
    const segs: Array<[number, string]> = [
      [cd.days, es ? 'Días' : 'Days'],
      [cd.hours, es ? 'Hrs' : 'Hrs'],
      [cd.minutes, es ? 'Min' : 'Min'],
      [cd.seconds, es ? 'Seg' : 'Sec'],
    ]
    return (
      <div className={className}>
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2.5"
          style={{ color: accent }}
        >
          {finalHours ? (es ? '¡Últimas horas!' : 'Final hours!') : es ? 'Comienza en' : 'Starts in'}
        </p>
        <div className="flex items-start gap-2 sm:gap-2.5">
          {segs.map(([value, label], i) => (
            <div key={label} className="flex items-center gap-2 sm:gap-2.5">
              <div className="flex flex-col items-center">
                <div
                  className={`min-w-[3.25rem] sm:min-w-[3.75rem] px-2 py-2.5 bg-[#141414] border rounded-lg text-center ${urgent ? 'animate-pulse' : ''}`}
                  style={{ borderColor: urgent ? 'rgba(232,93,4,0.5)' : 'rgba(255,255,255,0.1)' }}
                >
                  <span className="font-display text-2xl sm:text-3xl text-white tabular-nums leading-none">
                    {pad(value)}
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-white/40 mt-1.5">
                  {label}
                </span>
              </div>
              {i < segs.length - 1 && (
                <span className="font-display text-xl sm:text-2xl text-white/20 -mt-3">:</span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Card: compact pill. Far out → "5d 12h"; final day → ticking H M S. ──
  const disp =
    cd.days >= 1
      ? `${cd.days}${es ? 'd' : 'd'} ${cd.hours}h`
      : `${cd.hours}h ${pad(cd.minutes)}m ${pad(cd.seconds)}s`

  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-[#0A0A0A]/85 backdrop-blur-sm border text-white text-xs font-semibold px-2.5 py-1 rounded-full tabular-nums ${urgent ? 'animate-pulse' : ''} ${className}`}
      style={{ borderColor: urgent ? 'rgba(232,93,4,0.55)' : 'rgba(251,191,36,0.4)' }}
    >
      <Clock className="w-3 h-3" style={{ color: accent }} />
      {disp}
    </span>
  )
}
