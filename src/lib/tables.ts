// ============================================================
// Dynamic table reservations — shared types & availability logic
// Venue #1 with a floor plan: Simmer Garden (location_id 'simmer-garden')
// ============================================================

// Zone = the area code a table belongs to (e.g. 'PB', 'IGLESIA', 'VIP', 'M').
export type TableZone = string

export interface RestaurantTable {
  id: string
  location_id: string
  zone: string
  area_id: string | null
  code: string
  label: string
  seats: number
  pos_x: number // 0..100 %, left within the area canvas
  pos_y: number // 0..100 %, top within the area canvas
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

/** An owner-editable venue area (floor / view / VIP) grouping tables. */
export interface VenueArea {
  id: string
  location_id: string
  code: string
  name_es: string
  name_en: string
  description_es: string | null
  description_en: string | null
  floor: string | null
  view: string | null
  is_vip: boolean
  image_url: string | null
  min_party: number | null
  is_active: boolean
  sort_order: number
}

/** An area with its tables + availability, as served to the public map. */
export interface AreaWithTables extends VenueArea {
  tables: TableAvailability[]
  availableCount: number
}

// ─── Which locations offer an interactive floor plan ─────────
// Data-driven: every reservation venue can have areas; the map only renders
// when the venue actually has active areas + tables (see /api/tables).
export const FLOORPLAN_LOCATIONS = new Set<string>([
  'santa-ana',
  'lago-coatepeque',
  'san-benito',
  'simmer-garden',
  'surf-city',
])

export function hasFloorPlan(locationId: string | null | undefined): boolean {
  return !!locationId && FLOORPLAN_LOCATIONS.has(locationId)
}

export function localizedAreaName(area: { name_es: string; name_en: string }, locale: string): string {
  return locale === 'es' ? area.name_es : area.name_en
}

export function groupTablesByArea(
  areas: VenueArea[],
  tables: TableAvailability[],
): AreaWithTables[] {
  return areas
    .map((area) => {
      const areaTables = tables.filter((t) => t.area_id === area.id)
      return {
        ...area,
        tables: areaTables,
        availableCount: areaTables.filter((t) => t.available).length,
      }
    })
    .filter((a) => a.tables.length > 0)
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
