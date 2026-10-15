/**
 * Structured Data (JSON-LD) generators for SEO
 * Targets: #1 pizza restaurant in El Salvador
 */

// ─── Types ───────────────────────────────────────────────────────────────────

interface LocationData {
  id: string
  /** Slug of this location's live page under /locations/ (differs from `id` for two venues). */
  pageSlug: string
  name: string
  description: string
  address: string
  city: string
  region: string
  phone: string
  latitude: number
  longitude: number
  rating: number
  reviewCount: number
  hours: OpeningHours[]
  image: string
  priceRange?: string
}

interface OpeningHours {
  days: string[]
  opens: string
  closes: string
}

interface MenuItemData {
  name: string
  description: string
  price: number
  currency?: string
  image?: string
  category: string
}

interface BreadcrumbItem {
  name: string
  url: string
}

interface FAQItem {
  question: string
  answer: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BASE_URL = 'https://simmerdownsv.com'
const BRAND_NAME = 'Simmer Down'
const BRAND_DESCRIPTION = 'La mejor pizza artesanal en El Salvador. 12 años, 5 ubicaciones. Restaurante gastro-musical líder en Santa Ana, San Salvador, Coatepeque, Juayúa y Surf City.'

// ─── Location Database ───────────────────────────────────────────────────────

export const LOCATIONS: LocationData[] = [
  {
    id: 'santa-ana',
    pageSlug: 'santa-ana',
    name: 'Simmer Down Santa Ana',
    description: 'El restaurante original de Simmer Down. La mejor pizza artesanal frente a la catedral histórica de Santa Ana. 12 años de tradición gastronómica.',
    address: '1ra Calle Pte y Callejuela Sur Catedral',
    city: 'Santa Ana',
    region: 'Santa Ana',
    phone: '+50376804434',
    latitude: 13.9946,
    longitude: -89.5597,
    // Real Google listing figures (network audit 2026-10-15) — schema review
    // claims must match the public profile or rich results get penalized.
    rating: 4.6,
    reviewCount: 3824,
    image: `${BASE_URL}/images/locations/santa-ana-fachada.png`,
    hours: [
      { days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '11:00', closes: '21:00' },
      { days: ['Friday', 'Saturday'], opens: '11:00', closes: '22:00' },
    ],
  },
  {
    id: 'coatepeque',
    pageSlug: 'lago-coatepeque',
    name: 'Simmer Down Lago de Coatepeque',
    description: 'Pizza artesanal con la mejor vista al lago volcánico de Coatepeque. Experiencia gastronómica única frente a una maravilla natural de El Salvador.',
    address: 'Calle Principal al Lago #119',
    city: 'Lago de Coatepeque',
    region: 'Santa Ana',
    phone: '+50368316907',
    latitude: 13.8667,
    longitude: -89.5500,
    rating: 4.7,
    reviewCount: 165,
    image: `${BASE_URL}/images/locations/gallery-coatepeque/coatepeque-2.jpg`,
    hours: [
      { days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '11:00', closes: '20:00' },
      { days: ['Friday', 'Saturday'], opens: '11:00', closes: '21:00' },
    ],
  },
  {
    id: 'san-benito',
    pageSlug: 'san-benito',
    name: 'Simmer Down San Benito',
    description: 'Restaurante de pizza artesanal en la Zona Rosa de San Salvador. Jazz nights, valet parking, y la mejor cocina italiana de la capital salvadoreña.',
    address: '#548, Colonia San Benito',
    city: 'San Salvador',
    region: 'San Salvador',
    phone: '+50374877792',
    latitude: 13.6929,
    longitude: -89.2365,
    rating: 4.6,
    reviewCount: 617,
    image: `${BASE_URL}/images/locations/gallery-san-benito/san-benito-1.jpg`,
    hours: [
      // Source of truth: src/lib/data.ts LOCATIONS.san-benito. Zona Rosa nightlife — opens PM weekdays.
      { days: ['Monday', 'Tuesday', 'Wednesday'], opens: '16:00', closes: '22:00' },
      { days: ['Thursday'], opens: '12:00', closes: '23:00' },
      { days: ['Friday', 'Saturday', 'Sunday'], opens: '12:00', closes: '01:00' },
    ],
  },
  {
    id: 'juayua',
    pageSlug: 'simmer-garden',
    name: 'Simmer Garden — Juayúa',
    description: 'Pizza artesanal en la Ruta de las Flores. Jardín botánico, café de altura y la magia de Juayúa. El destino perfecto para escapadas gastronómicas.',
    address: 'Kilómetro 91.5, San José La Majada',
    city: 'Juayúa',
    region: 'Sonsonate',
    phone: '+50369904674',
    latitude: 13.8442,
    longitude: -89.7456,
    rating: 4.6,
    reviewCount: 892,
    image: `${BASE_URL}/images/locations/gallery-garden/garden-4.jpg`,
    hours: [
      // Client-confirmed 2026-08-10 (operator): Simmer Garden is open every day, never closes.
      { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '11:00', closes: '20:00' },
    ],
  },
  {
    id: 'surf-city',
    pageSlug: 'surf-city',
    name: 'Simmer Down Surf City',
    description: 'Pizza frente al mar en El Tunco, Surf City. Atardeceres, surf y la mejor comida artesanal de la costa salvadoreña.',
    address: 'Hotel Casa Santa Emilia, Conchalio 2',
    city: 'La Libertad',
    region: 'La Libertad',
    phone: '+50375360735',
    latitude: 13.4833,
    longitude: -89.3833,
    rating: 4.5,
    reviewCount: 37,
    image: `${BASE_URL}/images/locations/surf-city-exterior.jpg`,
    hours: [
      // Source of truth: src/lib/data.ts LOCATIONS.surf-city — CLOSED Monday & Tuesday.
      { days: ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '12:00', closes: '20:00' },
    ],
  },
]

// ─── Schema Generators ───────────────────────────────────────────────────────

/** Organization schema — the parent entity */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    name: BRAND_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/logos/simmer-down-flame.svg`,
    image: `${BASE_URL}/og/home.jpg`,
    description: BRAND_DESCRIPTION,
    foundingDate: '2014',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '1ra Calle Pte y Callejuela Sur Catedral',
      addressLocality: 'Santa Ana',
      addressRegion: 'Santa Ana',
      addressCountry: 'SV',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+503-7680-4434',
        contactType: 'reservations',
        areaServed: 'SV',
        availableLanguage: ['Spanish', 'English'],
      },
    ],
    sameAs: [
      'https://www.instagram.com/simmerdownsv/',
      'https://www.facebook.com/simmerdownsv/',
      'https://www.tiktok.com/@simmerdownsv',
    ],
    areaServed: {
      '@type': 'Country',
      name: 'El Salvador',
    },
  }
}

/** Restaurant schema for a specific location */
export function generateRestaurantSchema(location: LocationData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${BASE_URL}/locations#${location.id}`,
    name: location.name,
    image: location.image,
    url: `${BASE_URL}/locations/${location.pageSlug}`,
    telephone: location.phone,
    description: location.description,
    priceRange: location.priceRange || '$$',
    servesCuisine: ['Pizza', 'Pizza Artesanal', 'Italiana', 'Internacional', 'Salvadoreña'],
    acceptsReservations: true,
    menu: `${BASE_URL}/carta`,
    hasMenu: {
      '@type': 'Menu',
      url: `${BASE_URL}/carta`,
      hasMenuSection: [
        { '@type': 'MenuSection', name: 'Pizzas Artesanales' },
        { '@type': 'MenuSection', name: 'Pastas' },
        { '@type': 'MenuSection', name: 'Cortes & Carnes' },
        { '@type': 'MenuSection', name: 'Mariscos' },
        { '@type': 'MenuSection', name: 'Entradas' },
      ],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: location.address,
      addressLocality: location.city,
      addressRegion: location.region,
      postalCode: '',
      addressCountry: 'SV',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: location.latitude,
      longitude: location.longitude,
    },
    openingHoursSpecification: location.hours.map(h => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    parentOrganization: {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: BRAND_NAME,
    },
  }
}

/** Generate all location schemas as an array */
export function generateAllLocationSchemas() {
  return LOCATIONS.map(generateRestaurantSchema)
}

/** BreadcrumbList schema */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/** FAQPage schema */
export function generateFAQSchema(faqs: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/** Menu schema with items */
export function generateMenuSchema(items: MenuItemData[]) {
  const sections = new Map<string, MenuItemData[]>()
  items.forEach(item => {
    const existing = sections.get(item.category) || []
    existing.push(item)
    sections.set(item.category, existing)
  })

  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': `${BASE_URL}/carta#menu`,
    name: 'Menú Simmer Down',
    description: 'Menú completo de pizzas artesanales, pastas, cortes, mariscos y cócteles',
    url: `${BASE_URL}/carta`,
    hasMenuSection: Array.from(sections.entries()).map(([category, sectionItems]) => ({
      '@type': 'MenuSection',
      name: category,
      hasMenuItem: sectionItems.map(item => ({
        '@type': 'MenuItem',
        name: item.name,
        description: item.description,
        offers: {
          '@type': 'Offer',
          price: item.price.toFixed(2),
          priceCurrency: item.currency || 'USD',
        },
        ...(item.image ? { image: item.image } : {}),
      })),
    })),
  }
}

/** WebSite schema with search action */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    name: BRAND_NAME,
    url: BASE_URL,
    description: BRAND_DESCRIPTION,
    inLanguage: ['es', 'en'],
    publisher: {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/carta?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

// ─── Pre-built FAQ Data (El Salvador pizza queries) ──────────────────────────

export const RESTAURANT_FAQS: FAQItem[] = [
  {
    question: '¿Cuál es la mejor pizza en El Salvador?',
    answer: 'Simmer Down es reconocido como el mejor restaurante de pizza artesanal en El Salvador, con 12 años de tradición, más de 5,500 reseñas en Google y 5 ubicaciones: Santa Ana, Lago de Coatepeque, San Benito (San Salvador), Juayúa y Surf City. Nuestras pizzas son preparadas con ingredientes premium y masa artesanal.',
  },
  {
    question: '¿Dónde puedo comer pizza artesanal en El Salvador?',
    answer: 'Simmer Down ofrece pizza artesanal en 5 ubicaciones estratégicas de El Salvador: frente a la catedral de Santa Ana, con vista al Lago de Coatepeque, en la Zona Rosa de San Benito (San Salvador), en la Ruta de las Flores (Juayúa) y frente al mar en Surf City.',
  },
  {
    question: '¿Simmer Down tiene reservaciones?',
    answer: 'Sí, Simmer Down acepta reservaciones en todas sus ubicaciones. Puedes reservar en línea en simmerdownsv.com/reservations o llamar directamente: Santa Ana +503 7680-4434, Coatepeque +503 6831-6907, San Benito +503 7487-7792.',
  },
  {
    question: '¿Cuáles son los horarios de Simmer Down?',
    answer: 'Santa Ana: Dom-Jue 11AM-9PM, Vie-Sáb 11AM-10PM. Lago de Coatepeque: Dom-Jue 11AM-8PM, Vie-Sáb 11AM-9PM. San Benito: Lun-Mié 4PM-10PM, Jue 12PM-11PM, Vie-Dom 12PM-1AM. Simmer Garden (Juayúa): todos los días 11AM-8PM. Surf City: Mié-Dom 12PM-8PM (cerrado lunes y martes).',
  },
  {
    question: '¿Qué tipo de comida sirve Simmer Down?',
    answer: 'Simmer Down es un restaurante gastro-musical especializado en pizza artesanal, pastas frescas, cortes de carne premium, mariscos y cócteles de autor. También ofrecemos opciones vegetarianas y menú infantil.',
  },
  {
    question: '¿Simmer Down tiene delivery o para llevar?',
    answer: 'Sí. Ordena en línea con entrega a domicilio directamente en simmerdownsv.com/carta — pagas con tarjeta o coordinas por WhatsApp. También puedes ordenar para llevar en cualquiera de nuestras 5 ubicaciones.',
  },
  {
    question: '¿Cuánto cuesta comer en Simmer Down?',
    answer: 'El rango de precios en Simmer Down es moderado ($$). Las pizzas artesanales van desde $5.75 (tamaño personal), las pastas desde $9.99, los cortes desde $14.99 y las entradas desde $6.99. Ofrecemos excelente relación calidad-precio para la experiencia gastronómica premium que brindamos.',
  },
  {
    question: '¿Simmer Down es bueno para eventos y grupos grandes?',
    answer: 'Sí, Simmer Down es ideal para eventos privados, cenas de negocios y celebraciones. Nuestra ubicación de San Benito ofrece noches de jazz y valet parking. Contáctanos para eventos privados y menús especiales para grupos.',
  },
]

// ─── Signature Menu Items for Schema ─────────────────────────────────────────

export const SIGNATURE_MENU_ITEMS: MenuItemData[] = [
  { name: 'Pizza La Memoravel', description: 'Fajitas de res y pollo, cebolla marinada, salsa BBQ artesanal, ajonjolí tostado — la pizza más famosa de El Salvador', price: 13.99, category: 'Pizzas Artesanales', image: `${BASE_URL}/images/menu/pizza-memoravel.jpg` },
  { name: 'Pizza Margherita Clásica', description: 'Salsa de tomate San Marzano, mozzarella fresca, albahaca — auténtica pizza artesanal italiana', price: 9.99, category: 'Pizzas Artesanales' },
  { name: 'Pizza Cuatro Quesos', description: 'Mozzarella, gorgonzola, parmesano, queso de cabra — la combinación perfecta de quesos artesanales', price: 12.99, category: 'Pizzas Artesanales' },
  { name: 'Pizza Pepperoni Artesanal', description: 'Pepperoni premium con mozzarella derretida y salsa de tomate casera en masa artesanal', price: 11.99, category: 'Pizzas Artesanales' },
  { name: 'Pizza Hawaiian Twist', description: 'Jamón ahumado, piña caramelizada, jalapeño y salsa teriyaki sobre masa artesanal', price: 12.99, category: 'Pizzas Artesanales' },
  { name: 'Pizza Vegetariana del Huerto', description: 'Hongos, pimientos, aceitunas, espinaca, tomate cherry y pesto fresco', price: 11.99, category: 'Pizzas Artesanales' },
  { name: 'Terramar al Maitre', description: 'Lomito de res con camarones jumbo, mantequilla maitre d\'hôtel, vegetales de temporada', price: 24.99, category: 'Cortes & Mariscos', image: `${BASE_URL}/images/menu/pro-IMG4591.jpg` },
  { name: 'Fettuccine Calamardiña', description: 'Calamares, camarones jumbo, almejas y mejillones en salsa marinera mediterránea', price: 16.99, category: 'Pastas', image: `${BASE_URL}/images/menu/food-IMG20045.jpg` },
  { name: 'Penne alla Vodka', description: 'Pasta penne en salsa cremosa de vodka con tomate, albahaca y parmesano rallado', price: 12.99, category: 'Pastas' },
  { name: 'Bruschetta Caprese', description: 'Pan artesanal con tomate fresco, mozzarella de búfala, albahaca y reducción de balsámico', price: 8.99, category: 'Entradas' },
  { name: 'Alitas BBQ Simmer', description: 'Alitas de pollo glaseadas con nuestra salsa BBQ ahumada artesanal', price: 9.99, category: 'Entradas' },
  { name: 'Mojito Clásico', description: 'Ron blanco, hierba buena fresca, limón, azúcar de caña y soda', price: 6.99, category: 'Cócteles' },
]

// ─── Event Schema (Google Event rich results) ────────────────────────────────
// Events come from the DB (user-managed text), so ALWAYS serialize JSON-LD
// with safeJsonLd() — it escapes `<` so a malicious title can never close the
// <script> tag.

import type { PublicEvent } from '@/lib/events'

/** JSON-LD serializer safe for DB-sourced strings. */
export function safeJsonLd(schema: object): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c')
}

/**
 * UTC ISO → El Salvador local ISO with explicit -06:00 offset (SV has no DST).
 * Google wants event times in the venue's local time, not UTC.
 */
export function svIso(utcIso: string): string {
  const d = new Date(utcIso)
  if (isNaN(d.getTime())) return utcIso
  const local = new Date(d.getTime() - 6 * 3600_000)
  return local.toISOString().replace(/\.\d{3}Z$/, '-06:00')
}

/** Best-effort match of a venue display name to one of our location records. */
export function matchLocationForVenue(venueName: string): LocationData | null {
  const v = venueName.toLowerCase()
  return (
    LOCATIONS.find(l => {
      const tokens = [l.city.toLowerCase(), l.name.toLowerCase()]
      return tokens.some(t => v.includes(t) || t.includes(v)) ||
        (v.includes('san benito') && l.id === 'san-benito') ||
        (v.includes('santa ana') && l.id === 'santa-ana') ||
        (v.includes('coatepeque') && l.id === 'coatepeque') ||
        ((v.includes('juay') || v.includes('garden')) && l.id === 'juayua') ||
        ((v.includes('surf') || v.includes('tunco')) && l.id === 'surf-city')
    }) ?? null
  )
}

/** schema.org Event for one show — the unit Google surfaces in event search. */
export function generateEventSchema(event: PublicEvent, venueName: string) {
  const url = `${BASE_URL}/events/${event.slug}`
  const name = event.title_es || event.title
  const description =
    event.description_es || event.description || `${name} en ${venueName}, El Salvador.`
  const loc = matchLocationForVenue(venueName)

  // Offers: native on-site ticketing wins; otherwise external tiers/link.
  const tiers = (event.ticket_tiers ?? []).filter(t => t?.name)
  const external = event.external_tickets_url?.trim()
  const nativePrice = event.ticket_price != null ? Number(event.ticket_price) : 0
  const nativeOnSale = !!event.tickets_enabled && nativePrice > 0 && !!event.slug
  const soldOut =
    !!event.has_capacity_limit &&
    event.max_capacity != null &&
    (event.tickets_sold ?? 0) >= event.max_capacity

  let offers: object | object[] | undefined
  if (nativeOnSale) {
    offers = {
      '@type': 'Offer',
      url: `${BASE_URL}/boletos/comprar/${event.slug}`,
      price: nativePrice.toFixed(2),
      priceCurrency: 'USD',
      availability: soldOut
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock',
      validFrom: event.created_at ?? event.starts_at,
    }
  } else if (external && tiers.length > 0) {
    offers = tiers.map(t => ({
      '@type': 'Offer',
      name: t.name,
      url: external,
      price: Number(t.price).toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      validFrom: event.created_at ?? event.starts_at,
    }))
  } else if (external) {
    offers = {
      '@type': 'Offer',
      url: external,
      availability: 'https://schema.org/InStock',
      validFrom: event.created_at ?? event.starts_at,
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${url}#event`,
    name,
    description,
    url,
    startDate: svIso(event.starts_at),
    ...(event.ends_at ? { endDate: svIso(event.ends_at) } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(event.image_url ? { image: [event.image_url] } : {}),
    inLanguage: 'es',
    location: {
      '@type': 'Place',
      // Full branded venue name when we matched one of our locations
      // ("Simmer Down San Benito" reads better in Google's event panel
      // than the DB's bare "San Benito").
      name: loc?.name ?? venueName,
      address: loc
        ? {
            '@type': 'PostalAddress',
            streetAddress: loc.address,
            addressLocality: loc.city,
            addressRegion: loc.region,
            addressCountry: 'SV',
          }
        : { '@type': 'PostalAddress', addressCountry: 'SV' },
      ...(loc
        ? {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: loc.latitude,
              longitude: loc.longitude,
            },
          }
        : {}),
    },
    performer: { '@type': 'PerformingGroup', name: event.title },
    organizer: {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: BRAND_NAME,
      url: BASE_URL,
    },
    ...(offers ? { offers } : {}),
  }
}

/** ItemList of upcoming events for the /events listing page. */
export function generateEventListSchema(events: PublicEvent[]) {
  const withSlug = events.filter(e => !!e.slug)
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${BASE_URL}/events#eventlist`,
    name: 'Próximos eventos en Simmer Down — Simmer Manía',
    numberOfItems: withSlug.length,
    itemListElement: withSlug.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${BASE_URL}/events/${e.slug}`,
    })),
  }
}
