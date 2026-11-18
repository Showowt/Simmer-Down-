/**
 * Segment CMS shared types + helpers (client + server safe).
 *
 * Owner-editable content for the brand pages (Cortes Premium, El Maridaje
 * Perfecto, Hospitality, Merch), the Ubicaciones photos and the Nuestra
 * Historia numbers + Trabaja con Nosotros page. Backed by `segment_items`,
 * `location_media` and the `settings` key/value table
 * (migration 20261015_segment_cms.sql), served by GET /api/site-content.
 */

import { isRenderableRoomImage } from '@/lib/rooms'

export type SegmentKey = 'cortes' | 'maridaje' | 'hospitality' | 'merch'

export const SEGMENT_KEYS: SegmentKey[] = ['cortes', 'maridaje', 'hospitality', 'merch']

export interface SegmentItem {
  id: string
  segment: SegmentKey
  category: string | null
  name_es: string
  name_en: string
  description_es: string | null
  description_en: string | null
  price: number | null
  image_url: string | null
  is_active: boolean
  sort_order: number
}

export type LocationMediaKind = 'cover' | 'hero' | 'gallery'

export interface LocationMediaRow {
  id: string
  location_id: string
  kind: LocationMediaKind
  image_url: string
  sort_order: number
  is_active: boolean
}

/** Per-location effective media: single cover/hero override + gallery list. */
export interface LocationMedia {
  cover?: string
  hero?: string
  gallery: string[]
}

export type LocationMediaMap = Record<string, LocationMedia>

export interface CareersContent {
  form_url: string | null
  intro_es: string
  intro_en: string
  photos: string[]
}

// ── Page headings (owner-editable hero eyebrow/title/subtitle) ──────────────
// Martin's Nov 2026 ask: "esos encabezados los quisiera poder modificar también".
// Stored in settings key 'page_headings'. Empty string = keep the original
// static text, so a page never renders blank.

export type HeadingPageKey = 'cortes' | 'maridaje' | 'hospitality' | 'merch' | 'events' | 'trabaja'

export const HEADING_PAGE_KEYS: HeadingPageKey[] = [
  'cortes', 'maridaje', 'hospitality', 'merch', 'events', 'trabaja',
]

export interface PageHeading {
  eyebrow_es: string
  eyebrow_en: string
  title_es: string
  title_en: string
  subtitle_es: string
  subtitle_en: string
}

export type PageHeadings = Record<HeadingPageKey, PageHeading>

export const EMPTY_HEADING: PageHeading = {
  eyebrow_es: '', eyebrow_en: '', title_es: '', title_en: '', subtitle_es: '', subtitle_en: '',
}

const HEADING_FIELDS = Object.keys(EMPTY_HEADING) as (keyof PageHeading)[]

export const DEFAULT_PAGE_HEADINGS: PageHeadings = {
  cortes: { ...EMPTY_HEADING },
  maridaje: { ...EMPTY_HEADING },
  hospitality: { ...EMPTY_HEADING },
  merch: { ...EMPTY_HEADING },
  events: { ...EMPTY_HEADING },
  trabaja: { ...EMPTY_HEADING },
}

/**
 * The original static copy per page — shown as placeholders in the admin so
 * the owner sees what renders today, and what an empty field falls back to.
 */
export const HEADING_STATIC_FALLBACKS: PageHeadings = {
  cortes: {
    eyebrow_es: 'Simmer Down', eyebrow_en: 'Simmer Down',
    title_es: 'Cortes Premium', title_en: 'Premium Cuts',
    subtitle_es: 'Carnes selectas, maduradas con cuidado y selladas al fuego. La misma alma de Simmer Down, ahora en el corte perfecto.',
    subtitle_en: 'Select cuts, carefully aged and fire-seared. The same Simmer Down soul, now in the perfect cut.',
  },
  maridaje: {
    eyebrow_es: 'Vinos y bebidas', eyebrow_en: 'Wines & drinks',
    title_es: 'El Maridaje Perfecto', title_en: 'The Perfect Pairing',
    subtitle_es: 'Nuestros vinos y la variedad de bebidas que acompañan cada corte.',
    subtitle_en: 'Our wines and the drinks selection that pairs with every cut.',
  },
  hospitality: {
    eyebrow_es: 'Simmer Down Hospitality', eyebrow_en: 'Simmer Down Hospitality',
    title_es: 'Eventos, catering y experiencias', title_en: 'Events, catering & experiences',
    subtitle_es: 'Deja que Simmer Down reciba a tu gente. Eventos privados, catering a tu medida y experiencias frente al lago — en nuestras 5 sucursales.',
    subtitle_en: 'Let Simmer Down host your people. Private events, custom catering and lakefront experiences — across our 5 locations.',
  },
  merch: {
    eyebrow_es: 'Simmer Down', eyebrow_en: 'Simmer Down',
    title_es: 'Merch', title_en: 'Merch',
    subtitle_es: 'Lleva las buenas vibras contigo. Camisetas, gorras y accesorios con el sello Simmer Down.',
    subtitle_en: 'Take the good vibes with you. Tees, caps and accessories with the Simmer Down mark.',
  },
  events: {
    eyebrow_es: 'Experiencias Únicas', eyebrow_en: 'Unique Experiences',
    title_es: 'Eventos y Experiencias', title_en: 'Events & Experiences',
    subtitle_es: 'Desde música en vivo hasta talleres de pizza, siempre hay algo emocionante sucediendo en Simmer Down.',
    subtitle_en: "From live music to pizza workshops, there's always something exciting happening at Simmer Down.",
  },
  trabaja: {
    eyebrow_es: 'Simmer Down', eyebrow_en: 'Simmer Down',
    title_es: 'Trabaja con Nosotros', title_en: 'Work With Us',
    // The /trabaja subtitle is the careers intro, edited in its own tab.
    subtitle_es: '', subtitle_en: '',
  },
}

/** Coerce an untrusted settings value into a complete PageHeadings record. */
export function sanitizePageHeadings(raw: unknown): PageHeadings {
  const out: PageHeadings = {
    cortes: { ...EMPTY_HEADING },
    maridaje: { ...EMPTY_HEADING },
    hospitality: { ...EMPTY_HEADING },
    merch: { ...EMPTY_HEADING },
    events: { ...EMPTY_HEADING },
    trabaja: { ...EMPTY_HEADING },
  }
  if (!raw || typeof raw !== 'object') return out
  for (const page of HEADING_PAGE_KEYS) {
    const v = (raw as Record<string, unknown>)[page]
    if (!v || typeof v !== 'object') continue
    for (const field of HEADING_FIELDS) {
      const val = (v as Record<string, unknown>)[field]
      if (typeof val === 'string') out[page][field] = val.slice(0, 500)
    }
  }
  return out
}

/**
 * Same text in every field (after the 500-char cap the server stores). Used to
 * find which pages an editor changed, and by the API to refuse a save made
 * from a screen whose copy of that page is out of date.
 */
export function samePageHeading(a: PageHeading | undefined, b: PageHeading | undefined): boolean {
  return HEADING_FIELDS.every(
    (field) => (a?.[field] ?? '').slice(0, 500) === (b?.[field] ?? '').slice(0, 500),
  )
}

/**
 * Effective heading text: owner override wins, EN falls back to the owner's
 * ES override (owner intent beats stale static EN), then the static copy.
 */
export function headingText(
  heading: PageHeading | undefined,
  field: 'eyebrow' | 'title' | 'subtitle',
  locale: 'es' | 'en',
  fallbackEs: string,
  fallbackEn: string,
): string {
  const es = (heading?.[`${field}_es`] ?? '').trim()
  const en = (heading?.[`${field}_en`] ?? '').trim()
  if (locale === 'es') return es || fallbackEs
  return en || es || fallbackEn
}

export interface HistoriaStats {
  years: number
  locations: number
  reviews: number
  stars: number
}

export interface SiteContentPayload {
  segments: Record<SegmentKey, SegmentItem[]>
  locationMedia: LocationMediaMap
  careers: CareersContent
  historia: HistoriaStats
  headings: PageHeadings
}

// Real public numbers (Google listings network, Oct 2026 audit: 5,535 reviews /
// 4.6 average). Fallback when the settings row is unreachable.
export const DEFAULT_HISTORIA: HistoriaStats = {
  years: 12,
  locations: 5,
  reviews: 5500,
  stars: 4.6,
}

export const DEFAULT_CAREERS: CareersContent = {
  form_url: null,
  intro_es: '',
  intro_en: '',
  photos: [],
}

export const EMPTY_SITE_CONTENT: SiteContentPayload = {
  segments: { cortes: [], maridaje: [], hospitality: [], merch: [] },
  locationMedia: {},
  careers: DEFAULT_CAREERS,
  historia: DEFAULT_HISTORIA,
  headings: DEFAULT_PAGE_HEADINGS,
}

export const MERCH_CATEGORIES = [
  { id: 'camisetas', es: 'Camisetas', en: 'Tees' },
  { id: 'gorras-accesorios', es: 'Gorras y Accesorios', en: 'Caps & Accessories' },
  { id: 'ediciones-limitadas', es: 'Ediciones Limitadas', en: 'Limited Drops' },
] as const

export const HOSPITALITY_CATEGORIES = [
  { id: 'servicio', es: 'Servicio', en: 'Service' },
  { id: 'galeria', es: 'Galería', en: 'Gallery' },
] as const

/** Same allowlist as rooms: Supabase Storage public objects, Unsplash, /images. */
export const isRenderableSiteImage = isRenderableRoomImage

export function itemName(item: SegmentItem, locale: 'es' | 'en'): string {
  if (locale === 'es') return item.name_es
  return item.name_en || item.name_es
}

export function itemDescription(item: SegmentItem, locale: 'es' | 'en'): string | null {
  if (locale === 'es') return item.description_es
  return item.description_en || item.description_es
}

/** "5500" → "+5,500" / "5,500+" for the historia stats strip. */
export function formatStatPlus(n: number, locale: 'es' | 'en'): string {
  const s = n.toLocaleString('en-US')
  return locale === 'es' ? `+${s}` : `${s}+`
}
