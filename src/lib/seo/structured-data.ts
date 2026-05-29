/**
 * Structured Data (JSON-LD) generators for SEO
 * Targets: #1 pizza restaurant in El Salvador
 */

// ─── Types ───────────────────────────────────────────────────────────────────

interface LocationData {
  id: string
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
const BRAND_DESCRIPTION = 'La mejor pizza artesanal de horno de leña en El Salvador. 12 años, 5 ubicaciones. Restaurante gastro-musical líder en Santa Ana, San Salvador, Coatepeque, Juayúa y Surf City.'

// ─── Location Database ───────────────────────────────────────────────────────

export const LOCATIONS: LocationData[] = [
  {
    id: 'santa-ana',
    name: 'Simmer Down Santa Ana',
    description: 'El restaurante original de Simmer Down. La mejor pizza artesanal de horno de leña frente a la catedral histórica de Santa Ana. 12 años de tradición gastronómica.',
    address: '1ra Calle Pte y Callejuela Sur Catedral',
    city: 'Santa Ana',
    region: 'Santa Ana',
    phone: '+50324455999',
    latitude: 13.9946,
    longitude: -89.5597,
    rating: 4.9,
    reviewCount: 2100,
    image: `${BASE_URL}/images/locations/santa-ana-fachada.png`,
    hours: [
      { days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '11:00', closes: '21:00' },
      { days: ['Friday', 'Saturday'], opens: '11:00', closes: '22:00' },
    ],
  },
  {
    id: 'coatepeque',
    name: 'Simmer Down Lago de Coatepeque',
    description: 'Pizza artesanal con la mejor vista al lago volcánico de Coatepeque. Experiencia gastronómica única frente a una maravilla natural de El Salvador.',
    address: 'Calle Principal al Lago #119',
    city: 'Lago de Coatepeque',
    region: 'Santa Ana',
    phone: '+50368316907',
    latitude: 13.8667,
    longitude: -89.5500,
    rating: 4.9,
    reviewCount: 1850,
    image: `${BASE_URL}/images/locations/gallery-coatepeque/coatepeque-2.jpg`,
    hours: [
      { days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '11:00', closes: '20:00' },
      { days: ['Friday', 'Saturday'], opens: '11:00', closes: '21:00' },
    ],
  },
  {
    id: 'san-benito',
    name: 'Simmer Down San Benito',
    description: 'Restaurante de pizza artesanal en la Zona Rosa de San Salvador. Jazz nights, valet parking, y la mejor cocina italiana de la capital salvadoreña.',
    address: '#548, Colonia San Benito',
    city: 'San Salvador',
    region: 'San Salvador',
    phone: '+50374877792',
    latitude: 13.6929,
    longitude: -89.2365,
    rating: 4.8,
    reviewCount: 1420,
    image: `${BASE_URL}/images/locations/gallery-san-benito/san-benito-1.jpg`,
    hours: [
      { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Sunday'], opens: '11:00', closes: '23:00' },
      { days: ['Friday', 'Saturday'], opens: '11:00', closes: '00:00' },
    ],
  },
  {
    id: 'juayua',
    name: 'Simmer Garden — Juayúa',
    description: 'Pizza artesanal en la Ruta de las Flores. Jardín botánico, café de altura y la magia de Juayúa. El destino perfecto para escapadas gastronómicas.',
    address: 'Kilómetro 91.5, San José La Majada',
    city: 'Juayúa',
    region: 'Sonsonate',
    phone: '+50369904674',
    latitude: 13.8442,
    longitude: -89.7456,
    rating: 4.9,
    reviewCount: 980,
    image: `${BASE_URL}/images/locations/gallery-garden/garden-4.jpg`,
    hours: [
      { days: ['Friday', 'Saturday', 'Sunday'], opens: '11:00', closes: '20:00' },
    ],
  },
  {
    id: 'surf-city',
    name: 'Simmer Down Surf City',
    description: 'Pizza frente al mar en El Tunco, Surf City. Atardeceres, surf y la mejor comida artesanal de la costa salvadoreña.',
    address: 'Hotel Casa Santa Emilia, Conchalio 2',
    city: 'La Libertad',
    region: 'La Libertad',
    phone: '+50376804434',
    latitude: 13.4833,
    longitude: -89.3833,
    rating: 4.8,
    reviewCount: 750,
    image: `${BASE_URL}/images/locations/surf-city-exterior.jpg`,
    hours: [
      { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Sunday'], opens: '11:00', closes: '21:00' },
      { days: ['Friday', 'Saturday'], opens: '11:00', closes: '22:00' },
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
    foundingDate: '2012',
    founder: {
      '@type': 'Person',
      name: 'Marvin Medina',
    },
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
        telephone: '+503-2445-5999',
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
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      minValue: 50,
      maxValue: 100,
    },
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
    url: `${BASE_URL}/locations`,
    telephone: location.phone,
    description: location.description,
    priceRange: location.priceRange || '$$',
    servesCuisine: ['Pizza', 'Pizza Artesanal', 'Italiana', 'Internacional', 'Salvadoreña'],
    acceptsReservations: true,
    menu: `${BASE_URL}/menu`,
    hasMenu: {
      '@type': 'Menu',
      url: `${BASE_URL}/menu`,
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
    '@id': `${BASE_URL}/menu#menu`,
    name: 'Menú Simmer Down',
    description: 'Menú completo de pizzas artesanales de horno de leña, pastas, cortes, mariscos y cócteles',
    url: `${BASE_URL}/menu`,
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
        urlTemplate: `${BASE_URL}/menu?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

// ─── Pre-built FAQ Data (El Salvador pizza queries) ──────────────────────────

export const RESTAURANT_FAQS: FAQItem[] = [
  {
    question: '¿Cuál es la mejor pizza en El Salvador?',
    answer: 'Simmer Down es reconocido como el mejor restaurante de pizza artesanal en El Salvador, con 12 años de tradición, más de 8,000 reseñas positivas y 5 ubicaciones: Santa Ana, Lago de Coatepeque, San Benito (San Salvador), Juayúa y Surf City. Nuestras pizzas son preparadas en horno de leña con ingredientes premium.',
  },
  {
    question: '¿Dónde puedo comer pizza artesanal de horno de leña en El Salvador?',
    answer: 'Simmer Down ofrece pizza artesanal de horno de leña en 5 ubicaciones estratégicas de El Salvador: frente a la catedral de Santa Ana, con vista al Lago de Coatepeque, en la Zona Rosa de San Benito (San Salvador), en la Ruta de las Flores (Juayúa) y frente al mar en Surf City.',
  },
  {
    question: '¿Simmer Down tiene reservaciones?',
    answer: 'Sí, Simmer Down acepta reservaciones en todas sus ubicaciones. Puedes reservar en línea en simmerdownsv.com/reservations o llamar directamente: Santa Ana +503 2445-5999, Coatepeque +503 6831-6907, San Benito +503 7487-7792.',
  },
  {
    question: '¿Cuáles son los horarios de Simmer Down?',
    answer: 'Santa Ana: Dom-Jue 11AM-9PM, Vie-Sáb 11AM-10PM. Lago de Coatepeque: Dom-Jue 11AM-8PM, Vie-Sáb 11AM-9PM. San Benito: Lun-Dom 11AM-11PM, Vie-Sáb hasta medianoche. Simmer Garden (Juayúa): Vie-Dom 11AM-8PM. Surf City: horario estándar.',
  },
  {
    question: '¿Qué tipo de comida sirve Simmer Down?',
    answer: 'Simmer Down es un restaurante gastro-musical especializado en pizza artesanal de horno de leña, pastas frescas, cortes de carne premium, mariscos y cócteles de autor. También ofrecemos opciones vegetarianas y menú infantil.',
  },
  {
    question: '¿Simmer Down tiene delivery o para llevar?',
    answer: 'Sí, Simmer Down ofrece servicio de delivery a través de Uber Eats, DoorDash, PedidosYa y Hugo. También puedes ordenar para llevar directamente en cualquiera de nuestras 5 ubicaciones o a través de nuestra página web.',
  },
  {
    question: '¿Cuánto cuesta comer en Simmer Down?',
    answer: 'El rango de precios en Simmer Down es moderado ($$). Las pizzas van desde $8.99, las pastas desde $9.99, los cortes desde $14.99 y las entradas desde $6.99. Ofrecemos excelente relación calidad-precio para la experiencia gastronómica premium que brindamos.',
  },
  {
    question: '¿Simmer Down es bueno para eventos y grupos grandes?',
    answer: 'Sí, Simmer Down es ideal para eventos privados, cenas de negocios y celebraciones. Nuestra ubicación de San Benito ofrece noches de jazz y valet parking. Contáctanos para eventos privados y menús especiales para grupos.',
  },
]

// ─── Signature Menu Items for Schema ─────────────────────────────────────────

export const SIGNATURE_MENU_ITEMS: MenuItemData[] = [
  { name: 'Pizza La Memoravel', description: 'Fajitas de res y pollo, cebolla marinada, salsa BBQ artesanal, ajonjolí tostado — la pizza más famosa de El Salvador', price: 13.99, category: 'Pizzas Artesanales', image: `${BASE_URL}/images/menu/pizza-memoravel.jpg` },
  { name: 'Pizza Margherita Clásica', description: 'Salsa de tomate San Marzano, mozzarella fresca, albahaca — auténtica pizza italiana de horno de leña', price: 9.99, category: 'Pizzas Artesanales' },
  { name: 'Pizza Cuatro Quesos', description: 'Mozzarella, gorgonzola, parmesano, queso de cabra — la combinación perfecta de quesos artesanales', price: 12.99, category: 'Pizzas Artesanales' },
  { name: 'Pizza Pepperoni Artesanal', description: 'Pepperoni premium con mozzarella derretida y salsa de tomate casera en masa de horno de leña', price: 11.99, category: 'Pizzas Artesanales' },
  { name: 'Pizza Hawaiian Twist', description: 'Jamón ahumado, piña caramelizada, jalapeño y salsa teriyaki sobre masa artesanal', price: 12.99, category: 'Pizzas Artesanales' },
  { name: 'Pizza Vegetariana del Huerto', description: 'Hongos, pimientos, aceitunas, espinaca, tomate cherry y pesto fresco', price: 11.99, category: 'Pizzas Artesanales' },
  { name: 'Terramar al Maitre', description: 'Lomito de res con camarones jumbo, mantequilla maitre d\'hôtel, vegetales de temporada', price: 24.99, category: 'Cortes & Mariscos', image: `${BASE_URL}/images/menu/pro-IMG4591.jpg` },
  { name: 'Fettuccine Calamardiña', description: 'Calamares, camarones jumbo, almejas y mejillones en salsa marinera mediterránea', price: 16.99, category: 'Pastas', image: `${BASE_URL}/images/menu/food-IMG20045.jpg` },
  { name: 'Penne alla Vodka', description: 'Pasta penne en salsa cremosa de vodka con tomate, albahaca y parmesano rallado', price: 12.99, category: 'Pastas' },
  { name: 'Bruschetta Caprese', description: 'Pan artesanal con tomate fresco, mozzarella de búfala, albahaca y reducción de balsámico', price: 8.99, category: 'Entradas' },
  { name: 'Alitas BBQ Simmer', description: 'Alitas de pollo glaseadas con nuestra salsa BBQ ahumada artesanal', price: 9.99, category: 'Entradas' },
  { name: 'Mojito Clásico', description: 'Ron blanco, hierba buena fresca, limón, azúcar de caña y soda', price: 6.99, category: 'Cócteles' },
]
