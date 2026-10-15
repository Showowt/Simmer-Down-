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
  Beef, Wine, Sparkles, ShoppingBag, MapPin, BookOpen, Briefcase,
  Plus, Trash2, Check, Loader2, RefreshCw, ImagePlus,
} from 'lucide-react'
import ImageUpload from '@/components/admin/ImageUpload'
import { LOCATIONS } from '@/lib/data'
import {
  MERCH_CATEGORIES,
  type CareersContent,
  type HistoriaStats,
  type LocationMediaKind,
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

type Tab = 'cortes' | 'maridaje' | 'hospitality' | 'merch' | 'ubicaciones' | 'historia' | 'trabaja'

const TABS: { id: Tab; label: string; icon: typeof Beef }[] = [
  { id: 'cortes', label: 'Cortes Premium', icon: Beef },
  { id: 'maridaje', label: 'Maridaje', icon: Wine },
  { id: 'hospitality', label: 'Hospitality', icon: Sparkles },
  { id: 'merch', label: 'Merch', icon: ShoppingBag },
  { id: 'ubicaciones', label: 'Fotos Ubicaciones', icon: MapPin },
  { id: 'historia', label: 'Historia', icon: BookOpen },
  { id: 'trabaja', label: 'Trabaja con Nosotros', icon: Briefcase },
]

const SEGMENT_HELP: Record<SegmentKey, string> = {
  cortes: 'Productos de la página Cortes Premium. Sube fotos y agrega los cortes nuevos; el precio es opcional y se muestra en la tarjeta.',
  maridaje: 'Sección "El Maridaje Perfecto" dentro de Cortes Premium: vinos y bebidas con foto e información. Se publica al marcar "Visible".',
  hospitality: 'Tarjetas de servicios (eventos privados, catering...) y fotos de eventos. Las fotos con categoría "Galería" se muestran como galería en /hospitality y /events.',
  merch: 'Productos del merch con foto y precio en 3 categorías. El cliente pide por WhatsApp; la compra en línea llegará después.',
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
    const t = setTimeout(() => setToast(null), 3500)
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

  // ── Render helpers ────────────────────────────────────────

  const renderItemsEditor = (seg: SegmentKey) => {
    const list = segmentItems(seg)
    const catOptions =
      seg === 'merch' ? MERCH_CAT_OPTIONS : seg === 'hospitality' ? HOSPITALITY_CAT_OPTIONS : null
    return (
      <div>
        <p className="text-sm text-[#6B6560] mb-4">{SEGMENT_HELP[seg]}</p>
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
                  className={`bg-[#252320] border p-4 ${item.is_active ? 'border-[#3D3936]' : 'border-[#3D3936] opacity-60'}`}
                >
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
                    <div className="md:col-span-12 flex items-center gap-3 pt-1">
                      <label className="flex items-center gap-2 text-sm text-[#B8B0A8] cursor-pointer">
                        <input type="checkbox" checked={item.is_active} onChange={(e) => patchItem(item, { is_active: e.target.checked })} className="accent-[#FF6B35] w-4 h-4" />
                        {item.is_active ? 'Visible al público' : 'Oculto'}
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

      {toast && (
        <div className={`mb-5 px-4 py-3 text-sm border ${toast.kind === 'ok' ? 'bg-[#4CAF50]/10 border-[#4CAF50]/30 text-[#8FD694]' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>{toast.text}</div>
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
        </>
      )}
    </div>
  )
}
