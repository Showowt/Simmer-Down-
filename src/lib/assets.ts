/**
 * SIMMER DOWN - ASSET MANAGEMENT SYSTEM
 *
 * Integrates Google Drive images into the site.
 * Provides fallback handling and optimization.
 * Migration path to Supabase Storage included.
 */

// ============================================================================
// GOOGLE DRIVE ASSET MAPPING
// ============================================================================

export const DRIVE_ASSETS = {
  products: {
    picollo: '1uoS3RIVoAvz0vgXgQLqJGUqFN5Y9X6yY',
    pizza1: '1uTdUEjZcxbazvzj6KpzkDFRFo3H43jZz',
    pizza2: '1jAwci7wMMKtorESR6FfrzUroetathY5X',
    pizza3: '1Y5HOb_KwG5xxpPY1W2Eg6Au5Not2RCbv',
    ambiance1: '1nKt-5CO3jXfk0bJ1_sdg4NkEDb1oHn88',
    hero: '12bynndYB2vpNYKmrwjt_pmCOw9fjwxms',
  },

  thumbnails: {
    thumb1: '1IGNCllYGBIs1fdRJJJgRarRZtVaFTGsG',
    thumb2: '1zo32iwzvDk1000l2eDhb7MnB0Iq2CjTp',
    thumb3: '1mHmgzjtKDXV_fLBwApQOO59cMC7KjAvn',
    thumb4: '1TLl92Q1HZKDZlS73QUY5jf2nWeBeDwDu',
    thumb5: '1gdvopMQDbtMlJNqBuQYroJy_EJDR2d3B',
    thumb6: '1_wZSStSDZO31Ga87Omf1lHo0poAEwC3Q',
    thumb7: '1E8hcjQxjuYssZ6J6qIw6GsB2rS61L7Po',
    thumb8: '1Fhu9yPoWvMsgjjbqC05ZitbebrSo81AT',
  },

  locations: {
    santaAna: { folder: '1tgt_7XcpV6omjRtR6_2SZdebeO9xf2Cy' },
    sanSalvador: { folder: '1m5bsacSZ4iAt0pkk4GQZh3W1c_QNLL42' },
    simmerGarden: { folder: '1Hzptl0zw5hL9xwOL6K09CEHSUYBB59ov' },
    lago: { folder: '1FE9wvoa2MNUA9_7PgQmDPpQahOT2fhUC' },
  },

  content: {
    gallery: '1R5R9-bWm2qLJ65YQL5W0phML3rVUzkRr',
  },
} as const

// ============================================================================
// URL GENERATION
// ============================================================================

export function getDriveImageUrl(
  fileId: string,
  size: 'thumbnail' | 'medium' | 'full' = 'medium'
): string {
  switch (size) {
    case 'thumbnail':
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`
    case 'medium':
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`
    case 'full':
      return `https://lh3.googleusercontent.com/d/${fileId}`
    default:
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`
  }
}

export function getDriveDirectUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`
}

// ============================================================================
// ASSET HELPERS
// ============================================================================

export function getProductImage(
  key: keyof typeof DRIVE_ASSETS.products,
  size: 'thumbnail' | 'medium' | 'full' = 'medium'
): string {
  const fileId = DRIVE_ASSETS.products[key]
  return getDriveImageUrl(fileId, size)
}

export function getThumbnail(
  key: keyof typeof DRIVE_ASSETS.thumbnails
): string {
  const fileId = DRIVE_ASSETS.thumbnails[key]
  return getDriveImageUrl(fileId, 'thumbnail')
}

export const FALLBACK_IMAGES = {
  pizza: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80',
  pasta: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&q=80',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
  hero: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80',
}

// ============================================================================
// MENU ITEM TO IMAGE MAPPING
// ============================================================================

export function getMenuItemImage(
  _categorySlug: string,
  itemIndex: number
): string {
  const thumbnailKeys = Object.keys(DRIVE_ASSETS.thumbnails) as Array<keyof typeof DRIVE_ASSETS.thumbnails>
  const key = thumbnailKeys[itemIndex % thumbnailKeys.length]
  return getDriveImageUrl(DRIVE_ASSETS.thumbnails[key], 'medium')
}

export const CATEGORY_IMAGES: Record<string, string> = {
  'pizzas': getProductImage('picollo', 'full'),
  'specialty-pizzas': getProductImage('pizza1', 'full'),
  'pasta': getProductImage('pizza2', 'medium'),
  'salads': FALLBACK_IMAGES.salad,
  'tickets': getProductImage('pizza3', 'medium'),
  'main-courses': getProductImage('ambiance1', 'medium'),
  'cold-drinks': FALLBACK_IMAGES.restaurant,
  'local-beers': FALLBACK_IMAGES.restaurant,
  'childrens-menu': getThumbnail('thumb1'),
}

// ============================================================================
// LOCATION IMAGES
// ============================================================================

export const LOCATION_IMAGES: Record<string, { hero: string; gallery: string[] }> = {
  'santa-ana': {
    hero: getProductImage('ambiance1', 'full'),
    gallery: [
      getProductImage('pizza1', 'medium'),
      getProductImage('pizza2', 'medium'),
      getProductImage('pizza3', 'medium'),
    ],
  },
  'lago-coatepeque': {
    hero: getProductImage('hero', 'full'),
    gallery: [
      getProductImage('picollo', 'medium'),
      getProductImage('pizza1', 'medium'),
    ],
  },
  'san-benito': {
    hero: getProductImage('pizza2', 'full'),
    gallery: [
      getProductImage('pizza3', 'medium'),
      getProductImage('ambiance1', 'medium'),
    ],
  },
  'surf-city': {
    hero: getProductImage('picollo', 'full'),
    gallery: [
      getProductImage('hero', 'medium'),
      getProductImage('pizza1', 'medium'),
    ],
  },
  'simmer-garden': {
    hero: getProductImage('ambiance1', 'full'),
    gallery: [
      getProductImage('picollo', 'medium'),
      getProductImage('pizza2', 'medium'),
    ],
  },
}

// ============================================================================
// PROMO IMAGES
// ============================================================================

export const PROMO_IMAGES = {
  '2x1': getProductImage('pizza1', 'full'),
  'family': getProductImage('picollo', 'full'),
  'happy-hour': getProductImage('ambiance1', 'full'),
  'seasonal': getProductImage('hero', 'full'),
}

// ============================================================================
// LOGO ASSETS
// ============================================================================

export const LOGO = {
  main: {
    svg: `<svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 0C50 0 20 40 20 70C20 95 35 110 50 110C65 110 80 95 80 70C80 40 50 0 50 0Z" fill="url(#flame-gradient)"/>
      <path d="M50 30C50 30 35 55 35 75C35 90 42 100 50 100C58 100 65 90 65 75C65 55 50 30 50 30Z" fill="#8B1E1E"/>
      <defs>
        <linearGradient id="flame-gradient" x1="50" y1="0" x2="50" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FF6B35"/>
          <stop offset="100%" stop-color="#8B1E1E"/>
        </linearGradient>
      </defs>
    </svg>`,
  },

  text: {
    fontFamily: "'Bebas Neue', 'Impact', sans-serif",
    simmerColor: '#FF6B35',
    downColor: '#1a1a1a',
  },

  taglines: {
    'lago-coatepeque': 'GASTRONOMIA / ESTANCIA / AVENTURA',
    'san-benito': 'En El Corazon De San Benito',
    'santa-ana': 'Frente a Catedral',
    'surf-city': 'Surf - Pizza - Vibes',
    'simmer-garden': 'Cafe & Pizza Garden',
  },
}

// ============================================================================
// IMAGE COMPONENT HELPERS
// ============================================================================

export function getDriveImageProps(
  fileId: string,
  alt: string,
  size: 'thumbnail' | 'medium' | 'full' = 'medium'
) {
  const dimensions = {
    thumbnail: { width: 200, height: 150 },
    medium: { width: 800, height: 600 },
    full: { width: 1920, height: 1080 },
  }

  return {
    src: getDriveImageUrl(fileId, size),
    alt,
    width: dimensions[size].width,
    height: dimensions[size].height,
    blurDataURL: getDriveImageUrl(fileId, 'thumbnail'),
    placeholder: 'blur' as const,
  }
}

// ============================================================================
// SUPABASE STORAGE MIGRATION HELPERS
// ============================================================================

export function getSupabaseStorageUrl(
  bucket: string,
  path: string,
  transform?: { width?: number; height?: number; quality?: number }
): string {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

  let url = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`

  if (transform) {
    const params = new URLSearchParams()
    if (transform.width) params.set('width', String(transform.width))
    if (transform.height) params.set('height', String(transform.height))
    if (transform.quality) params.set('quality', String(transform.quality))

    url = `${SUPABASE_URL}/storage/v1/render/image/public/${bucket}/${path}?${params}`
  }

  return url
}

export const STORAGE_PATHS = {
  products: 'images/products',
  locations: 'images/locations',
  promos: 'images/promos',
  logos: 'images/logos',
  menu: 'images/menu',
}
