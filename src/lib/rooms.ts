// ============================================================
// Estadía — room reservations shared types & date-range logic
// Venue: Lago de Coatepeque (location_id 'lago-coatepeque').
// Reserve-request model (staff confirm + collect at check-in).
// ============================================================

export interface GuestRoom {
  id: string
  location_id: string
  code: string
  name: string
  name_es: string
  description: string | null
  description_es: string | null
  capacity: number
  price_per_night: number | null
  image_url: string | null
  amenities: string[]
  is_active: boolean
  sort_order: number
}

export interface RoomAvailability extends GuestRoom {
  available: boolean
  reason?: 'inactive' | 'booked' | 'too_small'
}

// Locations that offer lodging (reservation location_id).
export const LODGING_LOCATIONS = new Set<string>(['lago-coatepeque'])

export function hasLodging(locationId: string | null | undefined): boolean {
  return !!locationId && LODGING_LOCATIONS.has(locationId)
}

// Booking statuses that still hold a room.
export const ACTIVE_ROOM_STATUSES = ['pending', 'confirmed', 'checked_in']

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isValidDate(s: string | null | undefined): s is string {
  return !!s && DATE_RE.test(s)
}

/** Whole nights between two YYYY-MM-DD dates (>=0). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!isValidDate(checkIn) || !isValidDate(checkOut)) return 0
  const a = Date.parse(`${checkIn}T00:00:00Z`)
  const b = Date.parse(`${checkOut}T00:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  const diff = Math.round((b - a) / 86400000)
  return diff > 0 ? diff : 0
}

/**
 * Two date ranges [inA, outA) and [inB, outB) overlap iff inA < outB && inB < outA.
 * Same-day check-out / check-in does NOT conflict (the room turns over).
 */
export function rangesOverlap(
  inA: string,
  outA: string,
  inB: string,
  outB: string,
): boolean {
  return inA < outB && inB < outA
}

/**
 * Compute availability for each room given the requested stay and the set of
 * existing active bookings on the venue.
 */
export function computeRoomAvailability(
  rooms: GuestRoom[],
  bookings: Array<{ room_id: string | null; check_in: string; check_out: string }>,
  checkIn: string,
  checkOut: string,
  guestCount: number,
): RoomAvailability[] {
  const hasRange = isValidDate(checkIn) && isValidDate(checkOut) && checkOut > checkIn

  const bookedRoomIds = new Set<string>()
  if (hasRange) {
    for (const b of bookings) {
      if (!b.room_id) continue
      if (rangesOverlap(checkIn, checkOut, b.check_in, b.check_out)) {
        bookedRoomIds.add(b.room_id)
      }
    }
  }

  return rooms.map((r) => {
    if (!r.is_active) return { ...r, available: false, reason: 'inactive' as const }
    if (guestCount > r.capacity) return { ...r, available: false, reason: 'too_small' as const }
    if (hasRange && bookedRoomIds.has(r.id)) return { ...r, available: false, reason: 'booked' as const }
    return { ...r, available: true }
  })
}
