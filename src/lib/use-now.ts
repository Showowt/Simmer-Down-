'use client'

import { useEffect, useState } from 'react'

/**
 * The current time, known only on the client.
 *
 * Returns null during SSR and on the first client render, then the real
 * Date after mount (refreshed every `intervalMs`). Anything rendered from
 * "now" — open/closed badges, countdowns — must go through this: the home
 * page is prerendered at build time and Vercel renders in UTC, so a
 * `new Date()` evaluated during render disagrees with the visitor's browser
 * and React throws hydration error #418 on every load (seen 2026-11-24).
 */
export function useNow(intervalMs = 60_000): Date | null {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
