'use client'

/**
 * Admin → Contenido Web (segment CMS)
 *
 * Owner-editable content for the brand pages, per the client's Oct 2026 PDF:
 *   · Cortes Premium products (+ photos, prices)
 *   · El Maridaje Perfecto (wines & drinks on the Cortes page)
 *   · Hospitality services + event photo gallery
 *   · Merch products in 3 categories (photo + price; WhatsApp ordering)
 *   · Ubicaciones photos (cover / hero / gallery per venue)
 *   · Nuestra Historia numbers
 *   · Trabaja con Nosotros (Google Forms link, intro, team photos)
 *
 * Backed by /api/admin/segment-items, /api/admin/location-media and
 * /api/admin/site-content. Public pages refresh within ~1 minute.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  Beef, Wine, Sparkles, ShoppingBag, MapPin, BookOpen, Briefcase, Type,
  Plus, Trash2, Check, Loader2, RefreshCw, ImagePlus, Eye, EyeOff, ExternalLink,
} from 'lucide-react'
import ImageUpload from '@/components/admin/ImageUpload'
import { LOCATIONS } from '@/lib/data'
import {
  DEFAULT_PAGE_HEADINGS,
  HEADING_PAGE_KEYS,
  HEADING_STATIC_FALLBACKS,
  MERCH_CATEGORIES,
  samePageHeading,
  type CareersContent,
  type HeadingPageKey,
  type HistoriaStats,
  type LocationMediaKind,
  type PageHeadings,
  type SegmentKey,
} from '@/lib/site-content'

// ── Types (admin rows include inactive) ─────────────────────

interface Item {
  id: string | null
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

interface MediaRow {
  id: string
  location_id: string
  kind: LocationMediaKind
  image_url: string
  sort_order: number
  is_active: boolean
}

type Tab = 'cortes' | 'maridaje' | 'hospitality' | 'merch' | 'ubicaciones' | 'historia' | 'trabaja' | 'encabezados'

const TABS: { id: Tab; label: string; icon: typeof Beef }[] = [
  { id: 'cortes', label: 'Cortes Premium', icon: Beef },
  { id: 'maridaje', label: 'Maridaje', icon: Wine },
  { id: 'hospitality', label: 'Hospitality', icon: Sparkles },
  { id: 'merch', label: 'Merch', icon: ShoppingBag },
  { id: 'ubicaciones', label: 'Fotos Ubicaciones', icon: MapPin },
  { id: 'historia', label: 'Historia', icon: BookOpen },
  { id: 'trabaja', label: 'Trabaja con Nosotros', icon: Briefcase },
  { id: 'encabezados', label: 'Encabezados', icon: Type },
]

// Pages whose hero heading (etiqueta/título/subtítulo) is owner-editable.
const HEADING_PAGES: { id: HeadingPageKey; label: string; href: string; note?: string }[] = [
  { id: 'cortes', label: 'Cortes Premium', href: '/cortes-premium' },
  { id: 'maridaje', label: 'El Maridaje Perfecto', href: '/cortes-premium', note: 'Sección dentro de la página Cortes Premium.' },
  { id: 'hospitality', label: 'Hospitality', href: '/hospitality' },
  { id: 'merch', label: 'Merch', href: '/merch' },
  // Key stays 'events' (saved settings use it); the page is branded TicketManía.
  { id: 'events', label: 'TicketManía', href: '/ticketmania' },
  { id: 'trabaja', label: 'Trabaja con Nosotros', href: '/trabaja', note: 'El párrafo de introducción se edita en la pestaña "Trabaja con Nosotros".' },
]

const SEGMENT_HELP: Record<SegmentKey, string> = {
  cortes: 'Productos de la página Cortes Premium. Sube fotos y agrega los cortes nuevos; el precio es opcional y se muestra en la tarjeta.',
  maridaje: 'Vinos y bebidas de "El Maridaje Perfecto" con foto e información. Precio opcional.',
  hospitality: 'Tarjetas de servicios (eventos privados, catering...) y fotos de eventos. Las fotos con categoría "Galería" se muestran como galería en /hospitality y /ticketmania.',
  merch: 'Productos del merch con foto y precio en 3 categorías. El cliente pide por WhatsApp; la compra en línea llegará después.',
}

// Where each segment surfaces on the public site. Shown as a banner so the
// owner knows where to look after editing — the Oct 2026 confusion was that
// Maridaje has its own admin tab but renders INSIDE the Cortes Premium page.
const SEGMENT_PUBLIC: Record<SegmentKey, { label: string; href: string }> = {
  cortes: { label: 'Cortes Premium', href: '/cortes-premium' },
  maridaje: { label: 'Cortes Premium · sección "El Maridaje Perfecto"', href: '/cortes-premium' },
  hospitality: { label: 'Hospitality', href: '/hospitality' },
  merch: { label: 'Merch', href: '/merch' },
}

const MERCH_CAT_OPTIONS = MERCH_CATEGORIES.map((c) => ({ value: c.id, label: c.es }))
const HOSPITALITY_CAT_OPTIONS = [
  { value: 'servicio', label: 'Servicio (tarjeta)' },
  { value: 'galeria', label: 'Galería (solo foto)' },
]

function blankItem(segment: SegmentKey, order: number): Item {
  return {
    id: null,
    segment,
    category: segment === 'merch' ? 'camisetas' : segment === 'hospitality' ? 'servicio' : null,
    name_es: '',
    name_en: '',
    description_es: '',
    description_en: '',
    price: null,
    image_url: null,
    is_active: true,
    sort_order: order,
  }
}

const inputCls =
  'bg-[#1F1D1A] border border-[#3D3936] px-3 py-2 text-[#FFF8F0] text-sm focus:outline-none focus:border-[#FF6B35]'

export default function AdminContenidoPage() {
  const [tab, setTab] = useState<Tab>('cortes')
  const [items, setItems] = useState<Item[]>([])
  const [media, setMedia] = useState<MediaRow[]>([])
  const [careers, setCareers] = useState<CareersContent>({ form_url: null, intro_es: '', intro_en: '', photos: [] })
  const [historia, setHistoria] = useState<HistoriaStats>({ years: 12, locations: 5, reviews: 5500, stars: 4.6 })
  const [headings, setHeadings] = useState<PageHeadings>(DEFAULT_PAGE_HEADINGS)
  // What the server held when this screen loaded / last saved. A page whose
  // text differs from its base has unsaved changes; the base also travels
  // with each save so the API can refuse to overwrite newer text.
  const [headingsBase, setHeadingsBase] = useState<PageHeadings>(DEFAULT_PAGE_HEADINGS)
  const [headingsSavedAt, setHeadingsSavedAt] = useState<Date | null>(null)
  const [headingsConflict, setHeadingsConflict] = useState<string | null>(null)
  const [headingPage, setHeadingPage] = useState<HeadingPageKey>('cortes')
  const [mediaVenue, setMediaVenue] = useState<string>(LOCATIONS[0]?.id ?? 'santa-ana')
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [itemsRes, mediaRes, contentRes] = await Promise.all([
        fetch('/api/admin/segment-items', { cache: 'no-store' }),
        fetch('/api/admin/location-media', { cache: 'no-store' }),
        fetch('/api/admin/site-content', { cache: 'no-store' }),
      ])
      const itemsJson = await itemsRes.json()
      const mediaJson = await mediaRes.json()
      const contentJson = await contentRes.json()
      if (itemsRes.ok) setItems(itemsJson.data as Item[])
      else setToast({ kind: 'err', text: itemsJson.message || 'Error al cargar elementos' })
      if (mediaRes.ok) setMedia(mediaJson.data as MediaRow[])
      else setToast({ kind: 'err', text: mediaJson.message || 'Error al cargar fotos' })
      if (contentRes.ok && contentJson.data) {
        setCareers(contentJson.data.careers as CareersContent)
        setHistoria(contentJson.data.historia as HistoriaStats)
        if (contentJson.data.headings) {
          const loaded = contentJson.data.headings as PageHeadings
          setHeadings(loaded)
          setHeadingsBase(loaded)
          setHeadingsConflict(null)
        }
      } else {
        setToast({ kind: 'err', text: contentJson.message || 'Error al cargar los textos — toca Actualizar' })
      }
    } catch {
      setToast({ kind: 'err', text: 'Error al cargar' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), toast.kind === 'err' ? 9000 : 5000)
    return () => clearTimeout(t)
  }, [toast])

  // ── Segment item CRUD ─────────────────────────────────────

  const segmentItems = (seg: SegmentKey) => items.filter((i) => i.segment === seg)

  const patchItem = (target: Item, patch: Partial<Item>) =>
    setItems((prev) => prev.map((i) => (i === target ? { ...i, ...patch } : i)))

  const addItem = (seg: SegmentKey) =>
    setItems((prev) => [...prev, blankItem(seg, segmentItems(seg).length + 1)])

  const saveItem = async (item: Item) => {
    if (!item.name_es.trim()) {
      setToast({ kind: 'err', text: 'El nombre (ES) es requerido' })
      return
    }
    const key = item.id ?? `new-${item.segment}-${item.sort_order}`
    setBusyKey(key)
    try {
      const isNew = !item.id
      const payload = {
        segment: item.segment,
        category: item.category,
        name_es: item.name_es,
        name_en: item.name_en,
        description_es: item.description_es,
        description_en: item.description_en,
        price: item.price,
        image_url: item.image_url || null,
        is_active: item.is_active,
        sort_order: item.sort_order,
      }
      const res = await fetch('/api/admin/segment-items', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isNew ? payload : { id: item.id, ...payload }),
      })
      const json = await res.json()
      if (!res.ok) setToast({ kind: 'err', text: json.message || 'Error al guardar' })
      else {
        if (json.data?.id && !item.id) patchItem(item, { id: json.data.id })
        setToast({ kind: 'ok', text: 'Guardado — visible en el sitio en ~1 minuto' })
      }
    } catch {
      setToast({ kind: 'err', text: 'Error de conexión' })
    } finally {
      setBusyKey(null)
    }
  }

  // One-click publish: flip the local toggle AND persist, so an edited-but-hidden
  // item (e.g. a seeded example the owner filled in) goes live in a single action.
  const publishItem = (item: Item) => {
    patchItem(item, { is_active: true })
    void saveItem({ ...item, is_active: true })
  }

  const deleteItem = async (item: Item) => {
    if (!item.id) {
      setItems((prev) => prev.filter((i) => i !== item))
      return
    }
    setBusyKey(item.id)
    try {
      const res = await fetch(`/api/admin/segment-items?id=${item.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) setToast({ kind: 'err', text: json.message || 'Error al eliminar' })
      else {
        setToast({ kind: 'ok', text: 'Eliminado' })
        setItems((prev) => prev.filter((i) => i.id !== item.id))
      }
    } catch {
      setToast({ kind: 'err', text: 'Error de conexión' })
    } finally {
      setBusyKey(null)
    }
  }

  // ── Location media ────────────────────────────────────────

  const venueMedia = media.filter((m) => m.location_id === mediaVenue)
  const slotUrl = (kind: 'cover' | 'hero') => venueMedia.find((m) => m.kind === kind)?.image_url ?? null

  const setSlot = async (kind: 'cover' | 'hero', url: string | null) => {
    setBusyKey(`${mediaVenue}-${kind}`)
    try {
      const existing = venueMedia.find((m) => m.kind === kind)
      if (!url) {
        if (existing) {
          const res = await fetch(`/api/admin/location-media?id=${existing.id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error()
          setMedia((prev) => prev.filter((m) => m.id !== existing.id))
          setToast({ kind: 'ok', text: 'Foto quitada — vuelve la foto original' })
        }
        return
      }
      const res = await fetch('/api/admin/location-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_id: mediaVenue, kind, image_url: url }),
      })
      const json = await res.json()
      if (!res.ok) setToast({ kind: 'err', text: json.message || 'Error al guardar' })
      else {
        setMedia((prev) => [
          ...prev.filter((m) => !(m.location_id === mediaVenue && m.kind === kind)),
          { id: json.data.id, location_id: mediaVenue, kind, image_url: url, sort_order: 0, is_active: true },
        ])
        setToast({ kind: 'ok', text: 'Foto guardada — visible en ~1 minuto' })
      }
    } catch {
      setToast({ kind: 'err', text: 'Error de conexión' })
    } finally {
      setBusyKey(null)
    }
  }

  const addGalleryPhoto = async (url: string | null) => {
    if (!url) return
    setBusyKey(`${mediaVenue}-gallery`)
    try {
      const order = venueMedia.filter((m) => m.kind === 'gallery').length + 1
      const res = await fetch('/api/admin/location-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_id: mediaVenue, kind: 'gallery', image_url: url, sort_order: order }),
      })
      const json = await res.json()
      if (!res.ok) setToast({ kind: 'err', text: json.message || 'Error al guardar' })
      else {
        setMedia((prev) => [
          ...prev,
          { id: json.data.id, location_id: mediaVenue, kind: 'gallery', image_url: url, sort_order: order, is_active: true },
        ])
        setToast({ kind: 'ok', text: 'Foto agregada a la galería' })
      }
    } catch {
      setToast({ kind: 'err', text: 'Error de conexión' })
    } finally {
      setBusyKey(null)
    }
  }

  const deleteGalleryPhoto = async (row: MediaRow) => {
    setBusyKey(row.id)
    try {
      const res = await fetch(`/api/admin/location-media?id=${row.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        setToast({ kind: 'err', text: json.message || 'Error al eliminar' })
      } else {
        setMedia((prev) => prev.filter((m) => m.id !== row.id))
        setToast({ kind: 'ok', text: 'Foto eliminada' })
      }
    } catch {
      setToast({ kind: 'err', text: 'Error de conexión' })
    } finally {
      setBusyKey(null)
    }
  }

  // ── Settings (historia + careers) ─────────────────────────

  const saveSettings = async (body: { careers?: CareersContent; historia?: HistoriaStats }) => {
    setBusyKey('settings')
    try {
      const res = await fetch('/api/admin/site-content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) setToast({ kind: 'err', text: json.message || 'Error al guardar' })
      else setToast({ kind: 'ok', text: 'Guardado — visible en el sitio en ~1 minuto' })
    } catch {
      setToast({ kind: 'err', text: 'Error de conexión' })
    } finally {
      setBusyKey(null)
    }
  }

  // ── Page headings: save only the pages that changed ───────

  const dirtyHeadingPages = HEADING_PAGE_KEYS.filter((p) => !samePageHeading(headings[p], headingsBase[p]))

  // After a save, open the public page with ?cms=<save time>: useSiteContent
  // passes it to /api/site-content, so the owner sees the new text at once
  // instead of the edge-cached copy.
  const freshHref = (href: string) => (headingsSavedAt ? `${href}?cms=${headingsSavedAt.getTime()}` : href)

  const saveHeadings = async () => {
    if (dirtyHeadingPages.length === 0) {
      setToast({ kind: 'ok', text: 'No hay cambios nuevos: lo que ves ya está guardado.' })
      return
    }
    const sent = headings
    const heading_pages = Object.fromEntries(
      dirtyHeadingPages.map((p) => [p, { value: sent[p], base: headingsBase[p] }]),
    )
    setBusyKey('settings')
    try {
      const res = await fetch('/api/admin/site-content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heading_pages }),
      })
      const json = await res.json()
      if (!res.ok) {
        const text = json.message || 'Error al guardar'
        if (res.status === 409) setHeadingsConflict(text)
        setToast({ kind: 'err', text })
        return
      }
      const saved = json.data?.headings as PageHeadings | null | undefined
      if (saved) {
        setHeadingsBase(saved)
        // Keep anything typed while the save was in flight; otherwise take
        // the server copy (it also carries other people's saved pages).
        setHeadings((prev) => {
          const next = { ...prev }
          for (const p of HEADING_PAGE_KEYS) {
            if (samePageHeading(prev[p], sent[p])) next[p] = saved[p]
          }
          return next
        })
      }
      setHeadingsConflict(null)
      setHeadingsSavedAt(new Date())
      setToast({ kind: 'ok', text: 'Guardado ✓ — en el sitio en unos segundos (recarga la página para verlo).' })
    } catch {
      setToast({ kind: 'err', text: 'Error de conexión: no se guardó. Revisa el internet y vuelve a tocar Guardar.' })
    } finally {
      setBusyKey(null)
    }
  }

  // ── Render helpers ────────────────────────────────────────

  const renderItemsEditor = (seg: SegmentKey) => {
    const list = segmentItems(seg)
    const catOptions =
      seg === 'merch' ? MERCH_CAT_OPTIONS : seg === 'hospitality' ? HOSPITALITY_CAT_OPTIONS : null
    const pub = SEGMENT_PUBLIC[seg]
    return (
      <div>
        <div className="mb-4 bg-[#252320] border border-[#3D3936] px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="text-[#6B6560]">Aparece en:</span>
            <a
              href={pub.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#FF8C42] hover:text-[#FFB07A] font-medium"
            >
              {pub.label} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-sm text-[#6B6560] mt-1.5">{SEGMENT_HELP[seg]}</p>
          <p className="text-xs text-[#8A837C] mt-1.5">
            Cada elemento solo se muestra en el sitio si está marcado como{' '}
            <span className="text-[#8FD694] font-medium">Visible al público</span>.
          </p>
        </div>
        <div className="flex justify-end mb-3">
          <button
            onClick={() => addItem(seg)}
            className="flex items-center gap-2 bg-[#252320] border border-[#3D3936] hover:border-[#FF6B35]/50 text-[#B8B0A8] px-4 py-2 text-sm transition"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
        {list.length === 0 ? (
          <div className="bg-[#252320] border border-[#3D3936] p-8 text-center text-[#6B6560]">
            No hay elementos. Agrega el primero.
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((item, idx) => {
              const key = item.id ?? `new-${seg}-${idx}`
              const busy = busyKey === key
              return (
                <div
                  key={key}
                  className={`bg-[#252320] border p-4 ${item.is_active ? 'border-[#3D3936]' : 'border-[#F59E0B]/50'}`}
                >
                  {!item.is_active && (
                    <div className="flex items-center gap-1.5 mb-3 text-[11px] font-bold uppercase tracking-wide text-[#F59E0B]">
                      <EyeOff className="w-3.5 h-3.5" /> Oculto — no aparece en el sitio
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-4">
                      <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Nombre (ES)</label>
                      <input value={item.name_es} onChange={(e) => patchItem(item, { name_es: e.target.value })} className={`${inputCls} w-full`} />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Nombre (EN)</label>
                      <input value={item.name_en} onChange={(e) => patchItem(item, { name_en: e.target.value })} className={`${inputCls} w-full`} placeholder="Vacío = usa el español" />
                    </div>
                    {catOptions ? (
                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Categoría</label>
                        <select
                          value={item.category ?? catOptions[0].value}
                          onChange={(e) => patchItem(item, { category: e.target.value })}
                          className={`${inputCls} w-full`}
                        >
                          {catOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="md:col-span-2" />
                    )}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Precio $ (opcional)</label>
                      <input
                        type="number" min={0} step="0.01" value={item.price ?? ''}
                        onChange={(e) => patchItem(item, { price: e.target.value === '' ? null : parseFloat(e.target.value) })}
                        className={`${inputCls} w-full`}
                      />
                    </div>
                    <div className="md:col-span-6">
                      <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Descripción (ES)</label>
                      <input value={item.description_es ?? ''} onChange={(e) => patchItem(item, { description_es: e.target.value })} className={`${inputCls} w-full`} />
                    </div>
                    <div className="md:col-span-6">
                      <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Descripción (EN)</label>
                      <input value={item.description_en ?? ''} onChange={(e) => patchItem(item, { description_en: e.target.value })} className={`${inputCls} w-full`} />
                    </div>
                    <div className="md:col-span-12">
                      <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Foto</label>
                      <ImageUpload value={item.image_url} onChange={(url) => patchItem(item, { image_url: url })} folder={`segments/${seg}`} />
                    </div>
                    <div className="md:col-span-12 pt-1">
                      {!item.is_active && (
                        <div className="mb-3 flex items-center gap-3 bg-[#F59E0B]/10 border border-[#F59E0B]/40 px-3 py-2 flex-wrap">
                          <span className="text-sm text-[#F5C87A]">
                            Este elemento <strong>no se ve</strong> en el sitio todavía.
                          </span>
                          <button
                            onClick={() => publishItem(item)}
                            disabled={busy}
                            className="ml-auto flex items-center gap-1.5 bg-[#F59E0B] hover:bg-[#D98A08] text-[#1F1D1A] px-4 py-2 text-sm font-bold transition disabled:opacity-50"
                          >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} Hacer visible y guardar
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                          <input type="checkbox" checked={item.is_active} onChange={(e) => patchItem(item, { is_active: e.target.checked })} className="accent-[#FF6B35] w-4 h-4" />
                          <span className={item.is_active ? 'text-[#8FD694] font-medium' : 'text-[#B8B0A8]'}>
                            {item.is_active ? 'Visible al público' : 'Mostrar en el sitio'}
                          </span>
                        </label>
                        <div className="ml-auto flex items-center gap-2">
                          <button onClick={() => saveItem(item)} disabled={busy} className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E85D04] text-white px-4 py-2 text-sm font-semibold transition disabled:opacity-50">
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {item.id ? 'Guardar' : 'Crear'}
                          </button>
                          <button onClick={() => deleteItem(item)} disabled={busy} className="flex items-center gap-2 border border-red-500/30 text-red-300 hover:bg-red-500/15 px-3 py-2 text-sm transition disabled:opacity-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderUbicaciones = () => (
    <div>
      <p className="text-sm text-[#6B6560] mb-4">
        Portada (tarjeta en Ubicaciones y en el inicio), héroe (foto grande de la página de la sucursal)
        y galería. Al quitar una foto vuelve la original del sitio.
      </p>
      <div className="flex gap-2 mb-6 flex-wrap">
        {LOCATIONS.map((loc) => (
          <button
            key={loc.id}
            onClick={() => setMediaVenue(loc.id)}
            className={`px-4 py-2 text-sm font-medium border transition ${
              mediaVenue === loc.id
                ? 'bg-[#FF6B35] border-[#FF6B35] text-white'
                : 'bg-[#252320] border-[#3D3936] text-[#B8B0A8] hover:border-[#FF6B35]/50'
            }`}
          >
            {loc.shortName}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#252320] border border-[#3D3936] p-4">
          <h3 className="text-sm font-semibold text-[#FFF8F0] mb-3">Portada (tarjeta)</h3>
          <ImageUpload value={slotUrl('cover')} onChange={(url) => setSlot('cover', url)} folder={`locations/${mediaVenue}`} />
        </div>
        <div className="bg-[#252320] border border-[#3D3936] p-4">
          <h3 className="text-sm font-semibold text-[#FFF8F0] mb-3">Héroe (página de la sucursal)</h3>
          <ImageUpload value={slotUrl('hero')} onChange={(url) => setSlot('hero', url)} folder={`locations/${mediaVenue}`} />
        </div>
      </div>

      <div className="bg-[#252320] border border-[#3D3936] p-4">
        <h3 className="text-sm font-semibold text-[#FFF8F0] mb-3 flex items-center gap-2">
          <ImagePlus className="w-4 h-4 text-[#FF6B35]" /> Galería
        </h3>
        {venueMedia.filter((m) => m.kind === 'gallery').length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {venueMedia.filter((m) => m.kind === 'gallery').map((row) => (
              <div key={row.id} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={row.image_url} alt="Galería" className="w-full h-28 object-cover border border-[#3D3936]" />
                <button
                  onClick={() => deleteGalleryPhoto(row)}
                  disabled={busyKey === row.id}
                  className="absolute top-1.5 right-1.5 p-1.5 bg-[#1F1D1A]/80 hover:bg-red-500 text-white transition disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <ImageUpload value={null} onChange={addGalleryPhoto} folder={`locations/${mediaVenue}`} />
        <p className="text-[10px] text-[#6B6560] mt-2">Cada foto subida aquí se agrega a la galería de la sucursal.</p>
      </div>
    </div>
  )

  const renderHistoria = () => (
    <div className="max-w-xl">
      <p className="text-sm text-[#6B6560] mb-4">
        Números de la sección &quot;Nuestra Historia&quot; (y del inicio). Usa cifras reales — hoy la red
        suma ~5,535 reseñas en Google con promedio 4.6.
      </p>
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Años de historia</label>
          <input type="number" min={0} value={historia.years} onChange={(e) => setHistoria({ ...historia, years: parseInt(e.target.value) || 0 })} className={`${inputCls} w-full`} />
        </div>
        <div>
          <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Ubicaciones</label>
          <input type="number" min={0} value={historia.locations} onChange={(e) => setHistoria({ ...historia, locations: parseInt(e.target.value) || 0 })} className={`${inputCls} w-full`} />
        </div>
        <div>
          <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Reseñas</label>
          <input type="number" min={0} value={historia.reviews} onChange={(e) => setHistoria({ ...historia, reviews: parseInt(e.target.value) || 0 })} className={`${inputCls} w-full`} />
        </div>
        <div>
          <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Estrellas (0–5)</label>
          <input type="number" min={0} max={5} step="0.1" value={historia.stars} onChange={(e) => setHistoria({ ...historia, stars: Math.min(5, parseFloat(e.target.value) || 0) })} className={`${inputCls} w-full`} />
        </div>
      </div>
      <button
        onClick={() => saveSettings({ historia })}
        disabled={busyKey === 'settings'}
        className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E85D04] text-white px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50"
      >
        {busyKey === 'settings' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Guardar
      </button>
    </div>
  )

  const renderEncabezados = () => {
    const page = HEADING_PAGES.find((p) => p.id === headingPage) ?? HEADING_PAGES[0]
    const h = headings[page.id]
    const fb = HEADING_STATIC_FALLBACKS[page.id]
    const patch = (field: keyof typeof h, value: string) =>
      setHeadings({ ...headings, [page.id]: { ...h, [field]: value } })
    const showSubtitle = page.id !== 'trabaja'
    return (
      <div className="max-w-2xl">
        <p className="text-sm text-[#6B6560] mb-4">
          Edita la etiqueta pequeña, el título grande y el subtítulo de cada página.
          Deja un campo vacío para usar el texto original (se muestra como ejemplo gris).
        </p>
        <div className="flex gap-2 mb-6 flex-wrap">
          {HEADING_PAGES.map((p) => (
            <button
              key={p.id}
              onClick={() => setHeadingPage(p.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border transition ${
                headingPage === p.id
                  ? 'bg-[#FF6B35] border-[#FF6B35] text-white'
                  : 'bg-[#252320] border-[#3D3936] text-[#B8B0A8] hover:border-[#FF6B35]/50'
              }`}
            >
              {p.label}
              {dirtyHeadingPages.includes(p.id) && (
                <span
                  role="img"
                  title="Cambios sin guardar"
                  aria-label="cambios sin guardar"
                  className={`w-2 h-2 rounded-full ${headingPage === p.id ? 'bg-white' : 'bg-[#F59E0B]'}`}
                />
              )}
            </button>
          ))}
        </div>

        <div className="mb-4 bg-[#252320] border border-[#3D3936] px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="text-[#6B6560]">Aparece en:</span>
            <a
              href={freshHref(page.href)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#FF8C42] hover:text-[#FFB07A] font-medium"
            >
              {page.label} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          {page.note && <p className="text-sm text-[#6B6560] mt-1.5">{page.note}</p>}
        </div>

        <div className="space-y-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Etiqueta pequeña (ES)</label>
              <input value={h.eyebrow_es} onChange={(e) => patch('eyebrow_es', e.target.value)} placeholder={fb.eyebrow_es} className={`${inputCls} w-full`} />
            </div>
            <div>
              <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Etiqueta pequeña (EN)</label>
              <input value={h.eyebrow_en} onChange={(e) => patch('eyebrow_en', e.target.value)} placeholder={fb.eyebrow_en} className={`${inputCls} w-full`} />
            </div>
            <div>
              <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Título (ES)</label>
              <input value={h.title_es} onChange={(e) => patch('title_es', e.target.value)} placeholder={fb.title_es} className={`${inputCls} w-full`} />
            </div>
            <div>
              <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Título (EN)</label>
              <input value={h.title_en} onChange={(e) => patch('title_en', e.target.value)} placeholder={fb.title_en} className={`${inputCls} w-full`} />
            </div>
          </div>
          {showSubtitle && (
            <>
              <div>
                <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Subtítulo (ES)</label>
                <textarea value={h.subtitle_es} onChange={(e) => patch('subtitle_es', e.target.value)} placeholder={fb.subtitle_es} rows={2} className={`${inputCls} w-full`} />
              </div>
              <div>
                <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Subtítulo (EN)</label>
                <textarea value={h.subtitle_en} onChange={(e) => patch('subtitle_en', e.target.value)} placeholder={fb.subtitle_en} rows={2} className={`${inputCls} w-full`} />
              </div>
            </>
          )}
        </div>
        {headingsConflict && (
          <div className="mb-4 flex items-start gap-3 bg-red-500/10 border border-red-500/40 px-4 py-3 flex-wrap">
            <p className="text-sm text-red-300 flex-1 min-w-[14rem]">{headingsConflict}</p>
            <button
              onClick={load}
              className="flex items-center gap-2 bg-[#252320] border border-red-500/40 hover:border-red-400 text-red-200 px-3 py-1.5 text-sm transition"
            >
              <RefreshCw className="w-4 h-4" /> Actualizar
            </button>
          </div>
        )}
        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
          <button
            onClick={saveHeadings}
            disabled={busyKey === 'settings'}
            className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E85D04] text-white px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50"
          >
            {busyKey === 'settings' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Guardar
          </button>
          <p role="status" aria-live="polite" className="text-sm" data-testid="headings-status">
            {busyKey === 'settings' ? (
              <span className="text-[#B8B0A8]">Guardando…</span>
            ) : dirtyHeadingPages.length > 0 ? (
              <span className="text-[#F5C87A]">
                ● Cambios sin guardar:{' '}
                {dirtyHeadingPages.map((id) => HEADING_PAGES.find((p) => p.id === id)?.label ?? id).join(', ')}
              </span>
            ) : headingsSavedAt ? (
              <span className="text-[#8FD694]">
                ✓ Guardado a las{' '}
                {headingsSavedAt.toLocaleTimeString('es-SV', { hour: 'numeric', minute: '2-digit' })} ·{' '}
                <a
                  href={freshHref(page.href)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-[#B5F0B9]"
                >
                  Ver en el sitio <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </span>
            ) : null}
          </p>
        </div>
        <p className="text-[10px] text-[#6B6560] mt-2">
          Guardar guarda las páginas que editaste (marcadas con ●). Si alguien cambió la misma página desde
          otra ventana o teléfono mientras editabas, no se borra su cambio: te avisamos.
        </p>
      </div>
    )
  }

  const renderTrabaja = () => (
    <div className="max-w-2xl">
      <p className="text-sm text-[#6B6560] mb-4">
        Página /trabaja: enlace al Google Forms de aplicación, texto de introducción y fotos de los
        equipos. Sin enlace, el botón de aplicar usa WhatsApp.
      </p>
      <div className="space-y-4 mb-5">
        <div>
          <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Enlace de Google Forms</label>
          <input
            type="url"
            value={careers.form_url ?? ''}
            onChange={(e) => setCareers({ ...careers, form_url: e.target.value || null })}
            placeholder="https://forms.gle/..."
            className={`${inputCls} w-full`}
          />
        </div>
        <div>
          <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Introducción (ES)</label>
          <textarea value={careers.intro_es} onChange={(e) => setCareers({ ...careers, intro_es: e.target.value })} rows={3} className={`${inputCls} w-full`} />
        </div>
        <div>
          <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Introducción (EN)</label>
          <textarea value={careers.intro_en} onChange={(e) => setCareers({ ...careers, intro_en: e.target.value })} rows={3} className={`${inputCls} w-full`} />
        </div>
        <div>
          <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Fotos del equipo</label>
          {careers.photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {careers.photos.map((photo, i) => (
                <div key={`${photo}-${i}`} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="Equipo" className="w-full h-28 object-cover border border-[#3D3936]" />
                  <button
                    onClick={() => setCareers({ ...careers, photos: careers.photos.filter((_, pi) => pi !== i) })}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-[#1F1D1A]/80 hover:bg-red-500 text-white transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <ImageUpload
            value={null}
            onChange={(url) => url && setCareers({ ...careers, photos: [...careers.photos, url] })}
            folder="careers"
          />
          <p className="text-[10px] text-[#6B6560] mt-2">Recuerda guardar después de agregar o quitar fotos.</p>
        </div>
      </div>
      <button
        onClick={() => saveSettings({ careers })}
        disabled={busyKey === 'settings'}
        className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E85D04] text-white px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50"
      >
        {busyKey === 'settings' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Guardar
      </button>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#FFF8F0]">Contenido Web</h1>
        <button onClick={load} className="flex items-center gap-2 bg-[#252320] border border-[#3D3936] hover:border-[#FF6B35]/50 text-[#B8B0A8] px-4 py-2 text-sm transition">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {/* Fixed, not inline: the Guardar buttons sit below the fold, and an
          inline banner at the top of the page was off-screen — saves looked
          like they did nothing (Nov 17: six clicks in six minutes). */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          data-testid="contenido-toast"
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] w-[min(92vw,560px)] px-4 py-3 text-sm border shadow-2xl shadow-black/60 backdrop-blur ${
            toast.kind === 'ok'
              ? 'bg-[#15291A]/95 border-[#4CAF50]/40 text-[#8FD694]'
              : 'bg-[#2E1414]/95 border-red-500/50 text-red-300'
          }`}
        >
          {toast.text}
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border transition ${
                tab === t.id
                  ? 'bg-[#FF6B35] border-[#FF6B35] text-white'
                  : 'bg-[#252320] border-[#3D3936] text-[#B8B0A8] hover:border-[#FF6B35]/50'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-10 text-center">
          <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {(tab === 'cortes' || tab === 'maridaje' || tab === 'hospitality' || tab === 'merch') && renderItemsEditor(tab)}
          {tab === 'ubicaciones' && renderUbicaciones()}
          {tab === 'historia' && renderHistoria()}
          {tab === 'trabaja' && renderTrabaja()}
          {tab === 'encabezados' && renderEncabezados()}
        </>
      )}
    </div>
  )
}
