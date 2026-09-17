// ============================================================
// Dynamic table reservations — shared types & availability logic
// Venue #1 with a floor plan: Simmer Garden (location_id 'simmer-garden')
// ============================================================

export type TableZone = 'M' | 'J' | 'T' | 'BARRA'

export interface RestaurantTable {
  id: string
  location_id: string
  zone: TableZone
  code: string
  label: string
  seats: number
  pos_x: number // 0..100 %, left within the zone canvas
  pos_y: number // 0..100 %, top within the zone canvas
  shape: 'square' | 'rect'
  is_blocked: boolean
  is_active: boolean
  sort_order: number
}

/** A table decorated with computed availability for a given date/time. */
export interface TableAvailability extends RestaurantTable {
  available: boolean
  /** Why the table is unavailable, when it is. */
  reason?: 'blocked' | 'reserved'
}

// ─── Which locations have an interactive floor plan ──────────
// Keyed by the reservation location_id (see reservationFormSchema).
export const FLOORPLAN_LOCATIONS = new Set<string>(['simmer-garden'])

export function hasFloorPlan(locationId: string | null | undefined): boolean {
  return !!locationId && FLOORPLAN_LOCATIONS.has(locationId)
}

// ─── Zone display metadata ───────────────────────────────────

export const ZONE_ORDER: TableZone[] = ['M', 'J', 'T', 'BARRA']

export const ZONE_LABELS: Record<TableZone, { es: string; en: string }> = {
  M: { es: 'Zona M', en: 'Zone M' },
  J: { es: 'Zona J', en: 'Zone J' },
  T: { es: 'Terraza', en: 'Terrace' },
  BARRA: { es: 'Barra', en: 'Bar' },
}

// ─── Availability window ─────────────────────────────────────
// A table is considered occupied for a booking that starts within this many
// minutes of an existing reservation on the same date (covers one dining turn).
export const DINING_WINDOW_MINUTES = 120

/** Parse an "HH:MM" string into minutes since midnight. Returns null if malformed. */
export function timeToMinutes(time: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return h * 60 + min
}

/**
 * Do two reservation start-times collide within the dining window?
 * Both are "HH:MM" strings. Malformed times are treated as NON-colliding
 * (the DB-level checks stay authoritative; this is a UX pre-filter).
 */
export function timesConflict(
  a: string,
  b: string,
  windowMinutes: number = DINING_WINDOW_MINUTES,
): boolean {
  const am = timeToMinutes(a)
  const bm = timeToMinutes(b)
  if (am === null || bm === null) return false
  return Math.abs(am - bm) < windowMinutes
}

/**
 * Compute availability for every table given the manual block state and the
 * list of existing reservations (table_id + time) on the requested date.
 */
export function computeAvailability(
  tables: RestaurantTable[],
  reservationsOnDate: Array<{ table_id: string | null; time: string }>,
  requestedTime: string,
): TableAvailability[] {
  // Group taken table_ids that collide with the requested time.
  const takenTableIds = new Set<string>()
  for (const res of reservationsOnDate) {
    if (!res.table_id) continue
    if (timesConflict(res.time, requestedTime)) {
      takenTableIds.add(res.table_id)
    }
  }

  return tables.map((t) => {
    if (t.is_blocked) {
      return { ...t, available: false, reason: 'blocked' as const }
    }
    if (takenTableIds.has(t.id)) {
      return { ...t, available: false, reason: 'reserved' as const }
    }
    return { ...t, available: true }
  })
}
