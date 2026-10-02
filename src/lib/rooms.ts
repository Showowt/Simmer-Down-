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
  /** English amenities — added by 20260920c; absent until that migration runs. */
  amenities_en?: string[] | null
  is_active: boolean
  sort_order: number
}

export interface RoomAvailability extends GuestRoom {
  available: boolean
  reason?: 'inactive' | 'booked' | 'too_small'
}

/** Columns every guest_rooms read selects (public + admin). */
export const GUEST_ROOM_COLUMNS =
  'id, location_id, code, name, name_es, description, description_es, capacity, price_per_night, image_url, amenities, amenities_en, is_active, sort_order'

/** Same list minus the columns 20260920c adds — used as a pre-migration fallback. */
export const GUEST_ROOM_COLUMNS_LEGACY =
  'id, location_id, code, name, name_es, description, description_es, capacity, price_per_night, image_url, amenities, is_active, sort_order'

/**
 * "That column does not exist" — i.e. migration 20260920c has not been applied
 * (or PostgREST's schema cache has not caught up with it yet). Reads surface
 * Postgres 42703 (undefined_column); writes are rejected by PostgREST itself
 * with PGRST204 before they reach Postgres, so both codes count.
 *
 * Callers retry once without the new columns, so a deploy that lands before the
 * migration degrades instead of taking estadía down.
 */
export const MISSING_COLUMN_CODES = ['42703', 'PGRST204']

export function isUndefinedColumn(
  error: { code?: string | null } | null | undefined,
): boolean {
  return !!error?.code && MISSING_COLUMN_CODES.includes(error.code)
}

// Locations that offer lodging (reservation location_id).
export const LODGING_LOCATIONS = new Set<string>(['lago-coatepeque'])

export function hasLodging(locationId: string | null | undefined): boolean {
  return !!locationId && LODGING_LOCATIONS.has(locationId)
}

// Booking statuses that still hold a room. 'pending_payment' is a card hold:
// the booking is created before the 3DS charge so the room is reserved during
// checkout. Abandoned holds are swept after HOLD_EXPIRY_MINUTES (see the
// checkout + rooms routes), so a dropped payment never locks a room for long.
export const ACTIVE_ROOM_STATUSES = ['pending', 'confirmed', 'checked_in', 'pending_payment']

// How long an unpaid card hold ('pending_payment') keeps a room before it is
// swept back to 'expired'. A 3DS flow completes well within this.
export const HOLD_EXPIRY_MINUTES = 15

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isValidDate(s: string | null | undefined): s is string {
  return !!s && DATE_RE.test(s)
}

// El Salvador is UTC-6 year-round (no DST).
const SV_TIME_ZONE = 'America/El_Salvador'

/** Today's calendar date in El Salvador as YYYY-MM-DD (never the UTC date). */
export function todayInSV(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SV_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/**
 * Add whole days to a YYYY-MM-DD date using calendar parts.
 * Never via local-time ms math: `new Date('2026-09-20T00:00:00')` parses in the
 * viewer's timezone, so +1 day then .toISOString() lands back on the SAME day
 * for anyone at a positive UTC offset (Europe, Asia) — which dead-ended the
 * check-out field.
 */
export function addDays(dateStr: string, days: number): string {
  if (!isValidDate(dateStr)) return dateStr
  const [y, m, d] = dateStr.split('-').map(Number)
  const shifted = new Date(Date.UTC(y, m - 1, d + days))
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(shifted.getUTCDate()).padStart(2, '0')
  return `${shifted.getUTCFullYear()}-${mm}-${dd}`
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
 * Stay total from the DB rate. Returns null when the room has no published
 * rate or the range is empty — never a fabricated 0.
 */
export function computeStayTotal(
  pricePerNight: number | null | undefined,
  nights: number,
): number | null {
  if (pricePerNight == null || !Number.isFinite(pricePerNight)) return null
  if (!Number.isFinite(nights) || nights <= 0) return null
  return Math.round(pricePerNight * nights * 100) / 100
}

const ROOM_IMAGE_HOSTS = ['images.unsplash.com']
const SUPABASE_PUBLIC_PREFIX = '/storage/v1/object/public/'

/**
 * Only URLs the browser can actually load: next.config.ts images.remotePatterns
 * and the CSP img-src allow our Supabase Storage objects, Unsplash and local
 * /images paths. Anything else is rejected when the owner saves it, so the
 * public card never renders a link the browser will block.
 */
export function isRenderableRoomImage(url: string | null | undefined): url is string {
  if (!url) return false
  if (url.startsWith('/images/')) return true
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:') return false
  if (ROOM_IMAGE_HOSTS.includes(parsed.hostname)) return true
  return (
    parsed.hostname.endsWith('.supabase.co') &&
    parsed.pathname.startsWith(SUPABASE_PUBLIC_PREFIX)
  )
}

/** Amenities for the viewer's language, falling back to the Spanish list. */
export function roomAmenities(
  room: { amenities?: string[] | null; amenities_en?: string[] | null },
  locale: 'es' | 'en',
): string[] {
  const es = room.amenities ?? []
  if (locale === 'es') return es
  const en = room.amenities_en ?? []
  return en.length > 0 ? en : es
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
