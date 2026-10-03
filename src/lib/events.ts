// ============================================================
// Shared event timing logic — the single source of truth for
// "is this event upcoming, live, or past?" Used by the public API,
// the /events page, the homepage section, the admin archive, and
// the countdown component.
//
// Auto-archive is COMPUTED (no cron, no status column, no migration):
// an event drops off the public site the moment it is over, and shows
// up in the admin "Pasados" view — purely a function of the clock, so
// it can never drift or get stuck.
// ============================================================

// A no-end event stays "live" this long after it starts, so a concert that
// begins at 8pm doesn't vanish at 8pm while it's still happening.
export const EVENT_GRACE_HOURS = 5

export interface EventTiming {
  starts_at: string
  ends_at?: string | null
  recurrence?: string | null
}

// The DB stores non-recurring events as the string 'none' (NOT NULL), so an
// empty value OR 'none' both mean "does not repeat".
export const NON_RECURRING_VALUES = new Set(['', 'none', 'once', 'null'])

/** Recurring events (monthly/weekly programmes) repeat — they never "pass". */
export function isRecurring(e: Pick<EventTiming, 'recurrence'>): boolean {
  const r = e.recurrence ? String(e.recurrence).trim().toLowerCase() : ''
  return r.length > 0 && !NON_RECURRING_VALUES.has(r)
}

/**
 * When the event is effectively over (epoch ms). Recurring events never end.
 * An explicit `ends_at` wins; otherwise the start plus a grace window.
 * An unparseable start returns +Infinity so a bad row is never auto-hidden.
 */
export function effectiveEndMs(e: EventTiming): number {
  if (isRecurring(e)) return Number.POSITIVE_INFINITY
  const start = Date.parse(e.starts_at)
  if (Number.isNaN(start)) return Number.POSITIVE_INFINITY
  if (e.ends_at) {
    const end = Date.parse(e.ends_at)
    if (!Number.isNaN(end)) return end
  }
  return start + EVENT_GRACE_HOURS * 3_600_000
}

/** A passed event: over and not recurring. This is the "archived" predicate. */
export function isPastEvent(e: EventTiming, now: number = Date.now()): boolean {
  return effectiveEndMs(e) < now
}

/** Shown publicly: recurring, happening now, or still upcoming. */
export function isLiveOrUpcoming(e: EventTiming, now: number = Date.now()): boolean {
  return !isPastEvent(e, now)
}

/** Happening right now — started and not yet over. Recurring = false (no single window). */
export function isLiveNow(e: EventTiming, now: number = Date.now()): boolean {
  if (isRecurring(e)) return false
  const start = Date.parse(e.starts_at)
  if (Number.isNaN(start)) return false
  return now >= start && now < effectiveEndMs(e)
}

export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
}

/** Time remaining until `startsAt`. Returns zeros once the start has passed. */
export function countdownTo(startsAt: string, now: number = Date.now()): Countdown | null {
  const start = Date.parse(startsAt)
  if (Number.isNaN(start)) return null
  const totalMs = start - now
  if (totalMs <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 }
  const s = Math.floor(totalMs / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    totalMs,
  }
}

/**
 * PostgREST `or=` filter: a SUPERSET of the events to show (ends in the future,
 * has no end yet, or recurs). Callers must still JS-filter with isLiveOrUpcoming
 * for exact grace handling on no-end events.
 *
 * Kept deliberately FLAT — PostgREST `or()` with a clause that matches every row
 * (e.g. `recurrence.not.is.null` when the column is the string 'none', never
 * NULL) silently returns ALL rows. `recurrence.neq.none` matches only real
 * recurrences. `nowIso` = new Date().toISOString().
 */
export function upcomingOrFilter(nowIso: string): string {
  return [
    `ends_at.gte.${nowIso}`,
    'ends_at.is.null',
    'recurrence.neq.none',
  ].join(',')
}
