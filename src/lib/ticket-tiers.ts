// ============================================================
// Ticket types ("tipos de boleto") + service fee ("cargo por servicio").
//
// One event can sell several ticket types on simmerdownsv.com
// (e.g. Preferencial $45 + VIP Dinner $75), each with an optional cupo.
// A type's price is its OWN price — the taquilla the artist is paid —
// and the event's ticket_fee_percent is added on top of every ticket
// ($5.00 + 13% = $0.65 cargo → $5.65 charged).
//
// Pure module (client + server): the checkout route prices orders with it
// and every surface (listing, detail page, checkout, La Llamita, Google
// JSON-LD, Telegram) displays prices through it, so they always agree.
// The DB normalises events.ticket_tiers on every write (trigger
// normalize_event_ticket_tiers, migration 20261118); this still parses
// defensively because the column is JSONB.
// ============================================================

export interface TicketTier {
  id: string
  name: string
  name_en: string | null
  description: string | null
  description_en: string | null
  /** The ticket's own price (taquilla), before the service fee. */
  price: number
  /** Seats for this type; null = only the event's cupo applies. */
  capacity: number | null
  /** false = no longer sold (tickets already bought stay valid). */
  active: boolean
}

/** A type as a buyer sees it right now. */
export interface TierAvailability extends TicketTier {
  sold: number
  /** Seats left (its own cupo and the event's), null = no limit. */
  remaining: number | null
  soldOut: boolean
  /** Service fee per ticket. */
  fee: number
  /** What one ticket costs the buyer: price + fee. */
  total: number
}

/** Pseudo type id for single-price events (no ticket types configured). */
export const SINGLE_TIER_ID = 'general'
/** Per type, per purchase. */
export const MAX_TICKETS_PER_TYPE = 10
export const MAX_TICKET_TYPES = 12

export interface TicketEventFields {
  tickets_enabled?: boolean | null
  ticket_price?: number | string | null
  ticket_tiers?: unknown
  ticket_tier_sold?: unknown
  ticket_fee_percent?: number | string | null
  has_capacity_limit?: boolean | null
  max_capacity?: number | null
  tickets_sold?: number | null
}

function toNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function toText(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t ? t.slice(0, max) : null
}

const toCents = (n: number) => Math.round(n * 100)
const fromCents = (c: number) => c / 100

/** "$5.65" */
export function money(n: number): string {
  return `$${(Math.round(n * 100) / 100).toFixed(2)}`
}

/** The event's service-fee percentage (0 when none / invalid). */
export function feePercent(e: Pick<TicketEventFields, 'ticket_fee_percent'>): number {
  const p = toNumber(e.ticket_fee_percent)
  return p != null && p > 0 && p <= 100 ? p : 0
}

/** Fee for one ticket of `price` at `percent`, rounded to the cent. */
export function ticketFee(price: number, percent: number): number {
  if (!(percent > 0) || !(price > 0)) return 0
  return fromCents(Math.round((toCents(price) * percent) / 100))
}

/** "13%" / "12.5%" */
export function percentLabel(percent: number): string {
  return `${Number.isInteger(percent) ? percent : percent.toFixed(2).replace(/0+$/, '')}%`
}

/** events.ticket_tiers → clean list (unnamed / malformed rows dropped). */
export function parseTicketTiers(raw: unknown): TicketTier[] {
  if (!Array.isArray(raw)) return []
  const out: TicketTier[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    const name = toText(r.name, 60)
    if (!name) continue
    const price = toNumber(r.price)
    const capacity = toNumber(r.capacity)
    out.push({
      id: typeof r.id === 'string' ? r.id.trim() : '',
      name,
      name_en: toText(r.name_en, 60),
      description: toText(r.description, 160),
      description_en: toText(r.description_en, 160),
      price: price != null && price > 0 ? fromCents(toCents(price)) : 0,
      capacity: capacity != null && capacity >= 0 ? Math.floor(capacity) : null,
      active: r.active !== false,
    })
  }
  return out
}

/** events.ticket_tier_sold → {type id: seats}. */
export function soldByTier(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = toNumber(v)
    if (n != null && n > 0) out[id] = Math.floor(n)
  }
  return out
}

/** Seats left under the event-wide cupo, null = no limit. */
export function eventSeatsLeft(e: TicketEventFields): number | null {
  if (!e.has_capacity_limit || e.max_capacity == null) return null
  return Math.max(0, e.max_capacity - (e.tickets_sold ?? 0))
}

export type OnSiteMode = 'tiers' | 'single' | 'none'

export interface OnSiteTickets {
  /** 'tiers' = ticket types, 'single' = one price, 'none' = not sold on the site. */
  mode: OnSiteMode
  /** What can be bought (sold-out types included, flagged). */
  tiers: TierAvailability[]
  feePercent: number
  /** Cheapest / dearest ticket price, before fee. */
  fromPrice: number
  toPrice: number
  /** Same, what the buyer pays (price + fee). */
  fromTotal: number
  toTotal: number
  /** Several different prices → "desde $X". */
  multiPrice: boolean
  /** Nothing left to buy. */
  soldOut: boolean
}

function availability(
  tier: TicketTier,
  sold: number,
  eventLeft: number | null,
  percent: number,
): TierAvailability {
  const ownLeft = tier.capacity != null ? Math.max(0, tier.capacity - sold) : null
  const remaining =
    ownLeft == null ? eventLeft : eventLeft == null ? ownLeft : Math.min(ownLeft, eventLeft)
  const fee = ticketFee(tier.price, percent)
  return {
    ...tier,
    sold,
    remaining,
    soldOut: remaining === 0,
    fee,
    total: fromCents(toCents(tier.price) + toCents(fee)),
  }
}

/**
 * What a buyer can purchase on simmerdownsv.com for this event, ignoring the
 * date (callers check that). Configured types win over the single price; an
 * event whose types are all hidden is not on sale.
 */
export function onSiteTickets(e: TicketEventFields, singleName = 'General'): OnSiteTickets {
  const percent = feePercent(e)
  const none: OnSiteTickets = {
    mode: 'none',
    tiers: [],
    feePercent: percent,
    fromPrice: 0,
    toPrice: 0,
    fromTotal: 0,
    toTotal: 0,
    multiPrice: false,
    soldOut: false,
  }
  if (!e.tickets_enabled) return none

  const eventLeft = eventSeatsLeft(e)
  const configured = parseTicketTiers(e.ticket_tiers)
  let mode: OnSiteMode
  let tiers: TierAvailability[]

  if (configured.length > 0) {
    const sold = soldByTier(e.ticket_tier_sold)
    tiers = configured
      .filter((t) => t.active && t.price > 0 && t.id)
      .map((t) => availability(t, sold[t.id] ?? 0, eventLeft, percent))
    mode = 'tiers'
  } else {
    const price = toNumber(e.ticket_price)
    if (price == null || price <= 0) return none
    const single: TicketTier = {
      id: SINGLE_TIER_ID,
      name: singleName,
      name_en: null,
      description: null,
      description_en: null,
      price: fromCents(toCents(price)),
      capacity: null,
      active: true,
    }
    tiers = [availability(single, e.tickets_sold ?? 0, eventLeft, percent)]
    mode = 'single'
  }
  if (tiers.length === 0) return none

  // "desde $X" is about what can still be bought: a sold-out cheap type
  // mustn't advertise its price.
  const soldOut = tiers.every((t) => t.soldOut)
  const priced = soldOut ? tiers : tiers.filter((t) => !t.soldOut)
  const prices = priced.map((t) => t.price)
  const totals = priced.map((t) => t.total)
  return {
    mode,
    tiers,
    feePercent: percent,
    fromPrice: Math.min(...prices),
    toPrice: Math.max(...prices),
    fromTotal: Math.min(...totals),
    toTotal: Math.max(...totals),
    multiPrice: new Set(prices).size > 1,
    soldOut,
  }
}

/** Type name in the visitor's language (Spanish is the source of truth). */
export function tierName(t: Pick<TicketTier, 'name' | 'name_en'>, locale?: string): string {
  return locale === 'en' ? t.name_en || t.name : t.name
}

/** What the type includes, in the visitor's language. */
export function tierDescription(
  t: Pick<TicketTier, 'description' | 'description_en'>,
  locale?: string,
): string | null {
  return locale === 'en' ? t.description_en || t.description : t.description
}

/** One priced line of a ticket order, as stored in orders.ticket_lines. */
export interface TicketLine {
  tier_id: string | null
  name: string | null
  unit_price: number
  unit_fee: number
  quantity: number
}

/** Order totals for priced lines, summed in cents. */
export function lineTotals(lines: Pick<TicketLine, 'unit_price' | 'unit_fee' | 'quantity'>[]): {
  base: number
  fee: number
  total: number
  seats: number
} {
  let base = 0
  let fee = 0
  let seats = 0
  for (const l of lines) {
    base += toCents(l.unit_price) * l.quantity
    fee += toCents(l.unit_fee) * l.quantity
    seats += l.quantity
  }
  return { base: fromCents(base), fee: fromCents(fee), total: fromCents(base + fee), seats }
}

/** orders.ticket_lines → typed lines (malformed entries dropped). */
export function parseTicketLines(raw: unknown): TicketLine[] {
  if (!Array.isArray(raw)) return []
  const out: TicketLine[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    const quantity = toNumber(r.quantity)
    const unit = toNumber(r.unit_price)
    if (quantity == null || quantity < 1 || unit == null) continue
    out.push({
      tier_id: typeof r.tier_id === 'string' ? r.tier_id : null,
      name: typeof r.name === 'string' ? r.name : null,
      unit_price: unit,
      unit_fee: toNumber(r.unit_fee) ?? 0,
      quantity: Math.floor(quantity),
    })
  }
  return out
}

/**
 * La Llamita's ticket line for one event: each type with price, service fee,
 * total and sold-out state, plus where to buy — the same numbers the checkout
 * charges. "" when nothing is sold online or elsewhere.
 */
export function ticketsLineForAssistant(
  e: TicketEventFields & { slug?: string | null; external_tickets_url?: string | null },
): string {
  const price = (p: number, fee: number, total: number) =>
    fee > 0 ? `${money(p)} + ${money(fee)} de cargo = ${money(total)}` : money(p)
  const offer = onSiteTickets(e)
  if (offer.mode !== 'none' && e.slug) {
    const url = `simmerdownsv.com/boletos/comprar/${e.slug}`
    if (offer.soldOut) return ' · Boletos AGOTADOS'
    if (offer.mode === 'single') {
      const t = offer.tiers[0]
      return ` · Boletos en línea: ${price(t.price, t.fee, t.total)} por boleto → ${url}`
    }
    const types = offer.tiers
      .map(
        (t) =>
          `${t.name} ${price(t.price, t.fee, t.total)}${t.description ? ` (${t.description})` : ''}${t.soldOut ? ' AGOTADO' : ''}`,
      )
      .join('; ')
    return ` · Boletos en línea — ${types} → ${url}`
  }
  const external = e.external_tickets_url?.trim()
  if (external) {
    const listed = parseTicketTiers(e.ticket_tiers).filter((t) => t.active && t.price > 0)
    return ` · Boletos en ${external}${listed.length ? ` (${listed.map((t) => `${t.name} ${money(t.price)}`).join('; ')})` : ''}`
  }
  return ''
}

/** A fresh id for a ticket type created in the admin editor. */
export function newTierId(): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
  return `t${uuid.replace(/-/g, '').slice(0, 11)}`
}
