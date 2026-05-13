/**
 * SIMMER DOWN - ASSET MANAGEMENT SYSTEM
 *
 * Complete inventory of all assets mapped to local paths.
 * Google Drive IDs retained for CDN/Supabase migration.
 * NO external fallbacks — all images are real Simmer Down assets.
 */

// ============================================================================
// LOGOS
// ============================================================================

export const LOGOS = {
  /** Primary brand logo (flame + SIMMER DOWN wordmark) — official SVG from brand kit */
  main: '/logos/logo-brand-full.svg',
  /** Icon-only version for favicons, loading screens, small spaces */
  icon: '/logos/logo-icon.svg',
  /** Full horizontal version */
  full: '/logos/logo-full.svg',
  /** Simmer Garden sub-brand — official SVG */
  garden: '/logos/simmer-garden-official.svg',
}

// ============================================================================
// HERO / PRODUCT PHOTOS (Professional Photography)
// ============================================================================

export const PRODUCT_PHOTOS = {
  /** Picollo pizza — grilled chicken pizza, hero-quality (Drive: 1uoS3RIVoAvz0vgXgQLqJGUqFN5Y9X6yY) */
  picollo: '/images/menu/pro-picollo.jpg',
  /** Professional platter shot (Drive: 12bynndYB2vpNYKmrwjt_pmCOw9fjwxms) */
  heroPlatter: '/images/menu/pro-MG4664.jpg',
  /** Fresh from oven shot (Drive: 1jAwci7wMMKtorESR6FfrzUroetathY5X) */
  freshPizza: '/images/menu/pro-IMG4632.jpg',
  /** Premium feature shot (Drive: 1nKt-5CO3jXfk0bJ1_sdg4NkEDb1oHn88) */
  june19Feature: '/images/menu/pro-junio19.jpg',
  /** Pizza detail/texture shot (Drive: 1Y5HOb_KwG5xxpPY1W2Eg6Au5Not2RCbv) */
  pizzaDetail: '/images/menu/pro-IMG4591.jpg',
  /** Restaurant ambiance (Drive: 1uTdUEjZcxbazvzj6KpzkDFRFo3H43jZz) */
  ambiance: '/images/menu/pro-IMG4588.jpg',
  /** Homepage hero pizzas */
  homepageHero: '/images/heroes/homepage-pizzas.jpg',
}

// ============================================================================
// MENU ITEM PHOTOS (Web-optimized)
// ============================================================================

export const MENU_PHOTOS = {
  // Named menu items with real photos
  pizzaMaradona: '/images/menu/pizza-maradona.jpg',
  pizzaMemoravel: '/images/menu/pizza-memoravel.jpg',
  molcajeteCoulotte: '/images/menu/molcajete-coulotte.jpg',
  terramarMaitre: '/images/menu/terramar-maitre.jpg',
  medallonLomito: '/images/menu/medallon-lomito-maitre.jpg',
  cheeseBalls: '/images/menu/entradas-cheese-balls.jpg',
  fettuccineMarTierra: '/images/menu/pasta-fettuccine-mar-tierra.jpg',
  penneBrocoli: '/images/menu/pasta-penne-brocoli-tocino.jpg',
  brownieHelado: '/images/menu/brownie-helado.jpg',
  pannaCotta: '/images/menu/panna-cotta.jpg',
  michelada: '/images/menu/michelada.jpg',
  // Professional food photography series
  food01: '/images/menu/food-IMG20040.jpg',
  food02: '/images/menu/food-IMG20042.jpg',
  food03: '/images/menu/food-IMG20044.jpg',
  food04: '/images/menu/food-IMG20045.jpg',
  food05: '/images/menu/food-IMG20048.jpg',
  food06: '/images/menu/food-IMG20051.jpg',
  food07: '/images/menu/food-IMG20052.jpg',
  food08: '/images/menu/food-IMG20059.jpg',
  food09: '/images/menu/food-IMG20060.jpg',
  food10: '/images/menu/food-IMG20063.jpg',
  // Product numbered series
  product01: '/images/menu/product-01.jpg',
  product02: '/images/menu/product-02.jpg',
  product03: '/images/menu/product-03.jpg',
  product04: '/images/menu/product-04.jpg',
  product05: '/images/menu/product-05.jpg',
  product06: '/images/menu/product-06.jpg',
  product07: '/images/menu/product-07.jpg',
  product08: '/images/menu/product-08.jpg',
}

// ============================================================================
// LOCATION IMAGES
// ============================================================================

export const LOCATION_IMAGES: Record<string, { hero: string; gallery: string[] }> = {
  'santa-ana': {
    hero: '/images/locations/gallery-santa-ana/santa-ana-interior-2.jpg',
    gallery: [
      '/images/locations/gallery-santa-ana/santa-ana-awards.jpg',
      '/images/locations/gallery-santa-ana/santa-ana-1.jpg',
      '/images/locations/gallery-santa-ana/santa-ana-3.jpg',
      '/images/locations/gallery-santa-ana/santa-ana-interior-3.jpg',
      '/images/locations/gallery-santa-ana/santa-ana-interior-4.jpg',
      '/images/locations/drive-santa-ana/santa-ana-drive-01.png',
      '/images/locations/drive-santa-ana/santa-ana-drive-02.png',
      '/images/locations/drive-santa-ana/santa-ana-drive-03.png',
    ],
  },
  'coatepeque': {
    hero: '/images/locations/gallery-coatepeque/coatepeque-2.jpg',
    gallery: [
      '/images/locations/gallery-coatepeque/coatepeque-1.jpg',
      '/images/locations/gallery-coatepeque/coatepeque-3.jpg',
      '/images/locations/gallery-coatepeque/coatepeque-4.jpg',
      '/images/locations/drive-lago/lago-01.jpg',
      '/images/locations/drive-lago/lago-02.jpg',
      '/images/locations/drive-lago/lago-03.jpg',
      '/images/locations/drive-lago/lago-04.jpg',
      '/images/locations/drive-lago/lago-05.jpg',
    ],
  },
  'san-benito': {
    hero: '/images/locations/gallery-san-benito/san-benito-1.jpg',
    gallery: [
      '/images/locations/gallery-san-benito/san-benito-2.jpg',
      '/images/locations/gallery-san-benito/san-benito-3.jpg',
      '/images/locations/gallery-san-benito/san-benito-4.jpg',
    ],
  },
  'juayua': {
    hero: '/images/locations/gallery-garden/garden-4.jpg',
    gallery: [
      '/images/locations/gallery-garden/garden-1.jpg',
      '/images/locations/gallery-garden/garden-2.jpg',
      '/images/locations/gallery-garden/garden-3.jpg',
      '/images/locations/gallery-garden/garden-5.png',
      '/images/locations/drive-garden/garden-drive-01.jpg',
      '/images/locations/drive-garden/garden-drive-02.jpg',
      '/images/locations/drive-garden/garden-drive-03.png',
      '/images/locations/drive-garden/garden-drive-04.jpg',
      '/images/locations/drive-garden/garden-drive-05.jpg',
    ],
  },
  'surf-city': {
    hero: '/images/locations/surf-city-exterior.jpg',
    gallery: [
      '/images/locations/gallery-surf-city/surf-city-1.jpg',
      '/images/locations/gallery-surf-city/surf-city-2.jpg',
      '/images/locations/gallery-surf-city/surf-city-3.jpg',
      '/images/locations/gallery-surf-city/surf-city-4.jpg',
    ],
  },
}

/** Shared restaurant photos (awards wall, interiors) */
export const SHARED_PHOTOS = [
  '/images/locations/drive-shared/awards-wall.jpg',
  '/images/locations/drive-shared/shared-02.jpg',
  '/images/locations/drive-shared/shared-03.jpg',
  '/images/locations/drive-shared/shared-04.jpg',
]

// ============================================================================
// CATEGORY HERO IMAGES
// ============================================================================

export const CATEGORY_IMAGES: Record<string, string> = {
  'pizzas': PRODUCT_PHOTOS.picollo,
  'specialty-pizzas': PRODUCT_PHOTOS.freshPizza,
  'pasta': MENU_PHOTOS.fettuccineMarTierra,
  'entradas': MENU_PHOTOS.cheeseBalls,
  'ensaladas': MENU_PHOTOS.food04,
  'platos-fuertes': MENU_PHOTOS.terramarMaitre,
  'mariscos': MENU_PHOTOS.food02,
  'postres': MENU_PHOTOS.brownieHelado,
  'bebidas': MENU_PHOTOS.product02,
  'cervezas': MENU_PHOTOS.michelada,
  'infantil': MENU_PHOTOS.product03,
  'main-courses': PRODUCT_PHOTOS.ambiance,
  'cold-drinks': MENU_PHOTOS.product07,
  'local-beers': MENU_PHOTOS.michelada,
  'childrens-menu': MENU_PHOTOS.product03,
}

// ============================================================================
// EVENT IMAGES
// ============================================================================

export const EVENT_IMAGES = {
  simmermania: '/images/events/simmermania-marzo.jpg',
  musicosPoetas: '/images/events/musicos-poetas-locos-abril.jpg',
  zoeSiddhartha: '/images/events/zoe-siddhartha-bandalos.jpg',
  salzon: '/images/events/salzon-mayo.jpg',
  openMic: '/images/events/open-mic-abril.jpg',
  musicosLineup: '/images/events/musicos-poetas-locos-lineup.jpg',
}

// ============================================================================
// PROMO IMAGES
// ============================================================================

export const PROMO_IMAGES = {
  '2x1': PRODUCT_PHOTOS.freshPizza,
  'family': PRODUCT_PHOTOS.picollo,
  'happy-hour': PRODUCT_PHOTOS.ambiance,
  'seasonal': PRODUCT_PHOTOS.heroPlatter,
}

// ============================================================================
// BRAND / HERO IMAGES
// ============================================================================

export const BRAND_IMAGES = {
  elSalvadorMap: '/images/brand/el-salvador-map.jpg',
  directionsMap: '/images/brand/locations-directions-map.jpg',
  escapeGarden: '/images/heroes/escape-garden.jpg',
  surfCityDusk: '/images/heroes/surf-city-dusk.jpg',
}

// ============================================================================
// LOGO TAGLINES PER LOCATION
// ============================================================================

export const LOCATION_TAGLINES: Record<string, string> = {
  'santa-ana': 'Frente a Catedral',
  'coatepeque': 'Gastronomia / Estancia / Aventura',
  'san-benito': 'En El Corazon De San Benito',
  'surf-city': 'Surf - Pizza - Vibes',
  'juayua': 'Cafe & Pizza Garden',
}

// ============================================================================
// GOOGLE DRIVE IDS (for CDN migration reference)
// ============================================================================

export const DRIVE_IDS = {
  logos: {
    main: '1bky4wGZMxrEdgmcAr8tOdi2NxBUuJV8f',
    garden: '12k5WBrHOhuRN_yAxhDxuG-jqe7eSoLBe',
  },
  products: {
    picollo: '1uoS3RIVoAvz0vgXgQLqJGUqFN5Y9X6yY',
    heroPlatter: '12bynndYB2vpNYKmrwjt_pmCOw9fjwxms',
    freshPizza: '1jAwci7wMMKtorESR6FfrzUroetathY5X',
    june19Feature: '1nKt-5CO3jXfk0bJ1_sdg4NkEDb1oHn88',
    pizzaDetail: '1Y5HOb_KwG5xxpPY1W2Eg6Au5Not2RCbv',
    ambiance: '1uTdUEjZcxbazvzj6KpzkDFRFo3H43jZz',
  },
  menuPdfs: {
    santaAnaEs: '1rcqsVH-n4goxYO4zAj0_WQTLl1RilIM9',
    santaAnaEn: '1pg46Ez52QEpoxBOd4q2yzGcfjLP6bfq1',
    lagoEs: '1Q-otXuIK-JR-brDPPOMIb2jCKXj6LDQP',
    sanBenitoEs: '1pgA_zoxDrxV3rjK-iWtt852T5qta5KrB',
    sanBenitoEn: '1A-IrNdJrm1GVhJ-lDMMQkDUjNLHHtf_N',
    surfCityEs: '1ulsAcD2CDI_YwbhOQxDB4C_vLAQKWOyN',
  },
  folders: {
    mainProject: '11piHufp59gC0J0JUvFMi0fS4cISOxsK7',
    productPhotos: '1HnbWAEVPtvB2k7v42VnLhl02GbdbHfDN',
    sharedPhotos: '104oDh7G3uXWSZaPtXoJzqW3DvZ9bTMSp',
  },
} as const

// ============================================================================
// MENU PDF LINKS (Google Drive viewer — downloadable)
// ============================================================================

export const MENU_PDFS: Record<string, { es?: string; en?: string }> = {
  'santa-ana': {
    es: `https://drive.google.com/file/d/${DRIVE_IDS.menuPdfs.santaAnaEs}/view`,
    en: `https://drive.google.com/file/d/${DRIVE_IDS.menuPdfs.santaAnaEn}/view`,
  },
  'coatepeque': {
    es: `https://drive.google.com/file/d/${DRIVE_IDS.menuPdfs.lagoEs}/view`,
  },
  'san-benito': {
    es: `https://drive.google.com/file/d/${DRIVE_IDS.menuPdfs.sanBenitoEs}/view`,
    en: `https://drive.google.com/file/d/${DRIVE_IDS.menuPdfs.sanBenitoEn}/view`,
  },
  'surf-city': {
    es: `https://drive.google.com/file/d/${DRIVE_IDS.menuPdfs.surfCityEs}/view`,
  },
}

// ============================================================================
// MENU ITEM IMAGE ROTATION (for items without specific photos)
// ============================================================================

const MENU_ROTATION = [
  MENU_PHOTOS.product01,
  MENU_PHOTOS.product02,
  MENU_PHOTOS.product03,
  MENU_PHOTOS.product04,
  MENU_PHOTOS.product05,
  MENU_PHOTOS.product06,
  MENU_PHOTOS.product07,
  MENU_PHOTOS.product08,
  MENU_PHOTOS.food01,
  MENU_PHOTOS.food02,
  MENU_PHOTOS.food03,
  MENU_PHOTOS.food04,
]

export function getMenuItemImage(_categorySlug: string, itemIndex: number): string {
  return MENU_ROTATION[itemIndex % MENU_ROTATION.length]
}

// ============================================================================
// SUPABASE STORAGE HELPERS (for future migration)
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
