'use client'

/**
 * Should the Calendario de Adviento entry points (floating gift, menu chip)
 * show? One shared fetch of /api/advent/status for every subscriber, refreshed
 * at most once a minute when the tab regains focus.
 *
 * useSyncExternalStore: the server snapshot is "inactive", so SSR and
 * hydration render nothing and the button appears once the fetch lands —
 * no hydration mismatch, no setState in an effect. On failure it stays
 * inactive (the button simply doesn't show) and retries on the next focus.
 */

import { useSyncExternalStore } from 'react'
import type { AdventStatus } from '@/lib/advent'

const INACTIVE: AdventStatus = { active: false, todayIsDrawer: false }
const REFRESH_MS = 60_000

let current: AdventStatus = INACTIVE
let inflight = false
let fetchedAt = 0
const listeners = new Set<() => void>()

function load(): void {
  if (inflight || Date.now() - fetchedAt < REFRESH_MS) return
  inflight = true
  fetch('/api/advent/status')
    .then((res) => (res.ok ? (res.json() as Promise<{ data?: Partial<AdventStatus> | null }>) : null))
    .then((json) => {
      const d = json?.data
      fetchedAt = Date.now()
      const next: AdventStatus =
        d && typeof d.active === 'boolean'
          ? { active: d.active, todayIsDrawer: d.todayIsDrawer === true }
          : INACTIVE
      if (next.active !== current.active || next.todayIsDrawer !== current.todayIsDrawer) {
        current = next
        listeners.forEach((l) => l())
      }
    })
    .catch((error) => console.error('[useAdventStatus]', error))
    .finally(() => {
      inflight = false
    })
}

function onFocus(): void {
  load()
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange)
  if (listeners.size === 1) window.addEventListener('focus', onFocus)
  load()
  return () => {
    listeners.delete(onChange)
    if (listeners.size === 0) window.removeEventListener('focus', onFocus)
  }
}

const getSnapshot = (): AdventStatus => current
const getServerSnapshot = (): AdventStatus => INACTIVE

export function useAdventStatus(): AdventStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
