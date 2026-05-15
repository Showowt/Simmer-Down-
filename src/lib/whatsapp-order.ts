/**
 * WhatsApp Order System — Simmer Down
 *
 * Generates pre-filled WhatsApp deep links per location.
 * Each location has its own WhatsApp number. The website
 * builds a formatted order message and opens wa.me with
 * the cart contents pre-filled.
 */

import type { CartItem, OrderType } from '@/lib/types'

// ============================================================================
// LOCATION WHATSAPP DATA
// ============================================================================

export interface WhatsAppLocation {
  id: string
  name: string
  slug: string
  whatsapp: string // International format, no + prefix, no dashes
  address: string
  city: string
}

/**
 * WhatsApp numbers per location.
 * Format: country code + number, digits only (e.g. "50324455999")
 * Update these when client provides per-location numbers.
 */
export const WHATSAPP_LOCATIONS: WhatsAppLocation[] = [
  {
    id: 'santa-ana',
    name: 'Santa Ana',
    slug: 'santa-ana',
    whatsapp: '50324455999',
    address: '1ra Calle Pte y Callejuela Sur Catedral',
    city: 'Santa Ana',
  },
  {
    id: 'coatepeque',
    name: 'Lago de Coatepeque',
    slug: 'coatepeque',
    whatsapp: '50324455999',
    address: 'Calle Principal al Lago #119',
    city: 'Coatepeque',
  },
  {
    id: 'san-benito',
    name: 'San Benito',
    slug: 'san-benito',
    whatsapp: '50324455999',
    address: 'Boulevard del Hipódromo',
    city: 'San Salvador',
  },
  {
    id: 'simmer-garden',
    name: 'Simmer Garden',
    slug: 'juayua',
    whatsapp: '50324455999',
    address: 'Kilómetro 91.5, San José La Majada',
    city: 'Juayúa, Sonsonate',
  },
  {
    id: 'surf-city',
    name: 'Surf City',
    slug: 'surf-city',
    whatsapp: '50324455999',
    address: 'Hotel Casa Santa Emilia',
    city: 'La Libertad',
  },
]

// ============================================================================
// MESSAGE BUILDER
// ============================================================================

interface OrderDetails {
  items: CartItem[]
  location: WhatsAppLocation
  orderType: OrderType
  customerName: string
  customerPhone: string
  notes?: string
  locale?: 'es' | 'en'
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

/**
 * Builds a formatted WhatsApp order message.
 * Bilingual headers, clean formatting for readability on mobile.
 */
export function buildOrderMessage(order: OrderDetails): string {
  const { items, location, orderType, customerName, customerPhone, notes, locale = 'es' } = order

  const isES = locale === 'es'

  // Header
  const lines: string[] = [
    `*Nuevo Pedido — Simmer Down*`,
    `Sucursal: ${location.name}`,
    `Tipo: ${orderType === 'delivery'
      ? (isES ? 'Domicilio' : 'Delivery')
      : orderType === 'dine_in'
        ? (isES ? 'Comer aquí' : 'Dine in')
        : (isES ? 'Para recoger' : 'Pickup')
    }`,
    '',
    '──────────────',
    isES ? '*Pedido:*' : '*Order:*',
  ]

  // Items
  let subtotal = 0
  for (const item of items) {
    const itemTotal = item.price * item.quantity
    subtotal += itemTotal
    lines.push(`• ${item.quantity}x ${item.name} — ${formatCurrency(itemTotal)}`)
  }

  // Totals
  lines.push('──────────────')
  lines.push(`${isES ? 'Subtotal' : 'Subtotal'}: ${formatCurrency(subtotal)}`)
  lines.push(`*Total: ${formatCurrency(subtotal)}*`)
  lines.push('')

  // Customer info
  lines.push(`${isES ? 'Nombre' : 'Name'}: ${customerName}`)
  lines.push(`${isES ? 'Teléfono' : 'Phone'}: ${customerPhone}`)

  if (notes?.trim()) {
    lines.push(`${isES ? 'Notas' : 'Notes'}: ${notes.trim()}`)
  }

  lines.push('')
  lines.push(`_${isES ? 'Pedido desde' : 'Order from'} simmerdownsv.com_`)

  return lines.join('\n')
}

/**
 * Generates a WhatsApp deep link URL with pre-filled message.
 * Uses wa.me for universal compatibility (works on mobile + desktop).
 */
export function generateWhatsAppLink(order: OrderDetails): string {
  const message = buildOrderMessage(order)
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${order.location.whatsapp}?text=${encoded}`
}
