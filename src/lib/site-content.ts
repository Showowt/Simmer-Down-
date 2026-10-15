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
