// ============================================================
// Staff alert for a paid ticket purchase (Telegram, Markdown with the
// plain-text fallback in lib/telegram). One line per ticket type, the
// total split into taquilla (the tickets' own price — the artist's share)
// and service fee, and one QR link per type. A paid order with no QR is
// called out so staff fix it before the buyer reaches the door.
// ============================================================

export interface TicketSaleRow {
  qr_token: string
  tier_name: string | null
  quantity: number
  unit_fee: number | string | null
  total_amount: number | string | null
  oversold: boolean | null
}

export interface TicketSaleInput {
  eventName: string
  orderNumber: string | number | null
  customerName: string | null
  customerPhone: string | null
  totalAmount: number | string
  /** orders.ticket_quantity — used when no ticket rows exist. */
  ticketQuantity: number | null
  tickets: TicketSaleRow[]
  siteUrl?: string
}

/** Strip Telegram Markdown control characters from user/admin text. */
const safe = (s: unknown) => String(s ?? '').replace(/[_*`[\]]/g, '')
const cents = (n: unknown) => Math.round(Number(n ?? 0) * 100)
const usd = (c: number) => `$${(c / 100).toFixed(2)}`

export function formatTicketSaleMessage(input: TicketSaleInput): string {
  const site = input.siteUrl ?? 'https://simmerdownsv.com'
  const tickets = input.tickets
  const seats = tickets.reduce((sum, t) => sum + Number(t.quantity), 0) || (input.ticketQuantity ?? 1)
  const typed = tickets.some((t) => t.tier_name)
  const feeC = tickets.reduce((sum, t) => sum + cents(t.unit_fee) * Number(t.quantity), 0)
  const totalC = cents(input.totalAmount)
  const link = (token: string) => `${site}/boletos/${token}`
  const typeName = (t: TicketSaleRow) => safe(t.tier_name) || 'General'

  const lines: string[] = [`🎫 *BOLETO VENDIDO — ${safe(input.eventName) || 'Evento'}*`, '']
  if (typed) {
    for (const t of tickets) lines.push(`• ${typeName(t)} × ${t.quantity} — ${usd(cents(t.total_amount))}`)
  } else {
    lines.push(`Cantidad: ${seats}`)
  }
  lines.push(
    `Total: ${usd(totalC)}` + (feeC > 0 ? ` (taquilla ${usd(totalC - feeC)} + cargo ${usd(feeC)})` : ''),
  )
  lines.push(`Comprador: ${safe(input.customerName) || 'Cliente'} · ${safe(input.customerPhone) || '—'}`)
  lines.push(`Pedido: #${input.orderNumber ?? ''}`)

  if (tickets.length === 1) {
    lines.push(`Boleto: ${link(tickets[0].qr_token)}`)
  } else if (tickets.length > 1) {
    lines.push('Boletos:')
    for (const t of tickets) lines.push(`${typeName(t)}: ${link(t.qr_token)}`)
  } else {
    lines.push('⚠️ El QR no se generó para este pago — revisa el pedido en el panel.')
  }
  if (tickets.some((t) => t.oversold)) lines.push('⚠️ Venta sobre cupo — confirmar con gerencia.')
  return lines.join('\n')
}
