// ============================================================
// Door check-in — shared by the scanner page (/admin/boletos), its API
// (/api/admin/tickets) and the single-ticket page. Pure module: safe to
// import from client and server code.
// ============================================================

// qr_token is two UUIDs without dashes (64 hex chars); the check-in API has
// always accepted 16–80 alphanumerics, so the scanner does too.
const TOKEN_RE = /^[A-Za-z0-9]{16,80}$/
const TOKEN_IN_URL_RE = /\/boletos\/([A-Za-z0-9]{16,80})(?:[/?#]|$)/

/**
 * Pull the ticket token out of whatever a QR scan produced: the URL printed on
 * every ticket (https://simmerdownsv.com/admin/boletos/<token>), the customer
 * link (/boletos/<token>), or a bare token. Anything else is not our ticket.
 */
export function extractTicketToken(raw: string): string | null {
  const text = raw.trim()
  if (TOKEN_RE.test(text)) return text
  const match = TOKEN_IN_URL_RE.exec(text)
  return match ? match[1] : null
}

export function isTicketToken(value: string): boolean {
  return TOKEN_RE.test(value)
}

export type DoorTicketStatus = 'valid' | 'used' | 'void'

export interface DoorTicket {
  token: string
  quantity: number
  admitted: number
  status: DoorTicketStatus
  buyerName: string | null
  buyerPhone: string | null
  orderNumber: string | null
  oversold: boolean
  checkedInAt: string | null
  /** Ticket type ("VIP Dinner"), null for single-price events. */
  tierName: string | null
  event: { id: string; title: string; startsAt: string | null } | null
}

/** Seats sold / inside for one ticket type. */
export interface DoorTierCount {
  name: string
  seats: number
  admitted: number
}

export interface DoorEvent {
  id: string
  title: string
  startsAt: string
  liveOrUpcoming: boolean
  ticketsEnabled: boolean
  orders: number
  seats: number
  admitted: number
  /** Per ticket type (empty for single-price events). */
  tiers: DoorTierCount[]
}

/** Group non-void tickets by type for the door counters. */
export function tierCounts(
  tickets: { tierName: string | null; quantity: number; admitted: number; status: string }[],
): DoorTierCount[] {
  if (!tickets.some((t) => t.tierName)) return []
  const byName = new Map<string, DoorTierCount>()
  for (const t of tickets) {
    if (t.status === 'void') continue
    const name = t.tierName || 'General'
    const row = byName.get(name) ?? { name, seats: 0, admitted: 0 }
    row.seats += t.quantity
    row.admitted += t.admitted
    byName.set(name, row)
  }
  return [...byName.values()]
}

export interface DoorRoster {
  event: DoorEvent
  tickets: DoorTicket[]
}

/** People still allowed in on this ticket. */
export function ticketRemaining(t: Pick<DoorTicket, 'quantity' | 'admitted' | 'status'>): number {
  if (t.status !== 'valid') return 0
  return Math.max(0, t.quantity - t.admitted)
}

// Shape returned by public.check_in_ticket (via POST /api/admin/tickets/checkin).
export interface CheckInResult {
  ok: boolean
  reason?: 'not_found' | 'void' | 'already_used' | 'bad_count' | 'unauthorized' | 'bad_token' | 'error' | 'rate_limited'
  admitted?: number
  admitted_total?: number
  quantity?: number
  remaining?: number
  checked_in_at?: string | null
}
