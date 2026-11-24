'use client'

import { useSyncExternalStore } from 'react'

/**
 * The current time, known only on the client.
 *
 * Returns null during SSR and during hydration, then the real Date once
 * React is running in the browser (refreshed every minute). Anything
 * rendered from "now" — open/closed badges, countdowns — must go through
 * this: the home page and /restaurantes are prerendered at build time and
 * Vercel renders in UTC, so a `new Date()` evaluated during render disagrees
 * with the visitor's browser and React throws hydration error #418 on every
 * load (seen 2026-11-24).
 *
 * Built on useSyncExternalStore so the server snapshot (null) is what the
 * hydration render uses, with no setState-in-effect cascade.
 */
let tick = 0
let timer: ReturnType<typeof setInterval> | null = null
const listeners = new Set<() => void>()

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange)
  if (!timer) {
    timer = setInterval(() => {
      tick += 1
      listeners.forEach((l) => l())
    }, 60_000)
  }
  return () => {
    listeners.delete(onChange)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }
}
const getSnapshot = () => tick
const getServerSnapshot = () => -1

export function useNow(): Date | null {
  const t = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return t < 0 ? null : new Date()
}
