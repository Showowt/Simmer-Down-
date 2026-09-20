'use client'

/**
 * Admin → Habitaciones (estadía)
 *
 * Manage the Lago de Coatepeque room catalog (owner-editable, ES + EN) and
 * handle incoming reserve-requests (confirm / check-in / check-out / cancel).
 * Backed by /api/admin/rooms and /api/admin/room-bookings.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BedDouble, Plus, Trash2, Check, Loader2, Users, CalendarClock, Phone, Mail, RefreshCw, DollarSign,
} from 'lucide-react'
import ImageUpload from '@/components/admin/ImageUpload'
import { todayInSV } from '@/lib/rooms'

const LOCATION = 'lago-coatepeque'

interface Room {
  id: string | null
  location_id: string
  code: string
  name: string
  name_es: string
  description: string | null
  description_es: string | null
  capacity: number
  price_per_night: number | null
  image_url: string | null
  amenities: string[]
  amenities_en: string[]
  is_active: boolean
  sort_order: number
}

interface LinkedRoom { code: string; name_es: string; name: string }
interface Booking {
  id: string
  room_id: string | null
  check_in: string
  check_out: string
  nights: number | null
  guest_count: number
  customer_name: string
  customer_phone: string
  customer_email: string | null
  special_requests: string | null
  status: string
  // Written at request time from the room's DB price — the amount actually
  // quoted to the guest, which the nightly rate may have drifted from since.
  price_per_night?: number | null
  total_amount?: number | null
  guest_rooms: LinkedRoom | LinkedRoom[] | null
}

type BookingFilter = 'upcoming' | 'past' | 'all'

const B_FILTERS: { id: BookingFilter; label: string }[] = [
  { id: 'upcoming', label: 'Próximas' },
  { id: 'past', label: 'Pasadas' },
  { id: 'all', label: 'Todas' },
]

const B_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pendiente', cls: 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20' },
  confirmed: { label: 'Confirmada', cls: 'bg-[#4CAF50]/10 text-[#8FD694] border-[#4CAF50]/20' },
  checked_in: { label: 'Check-in', cls: 'bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/20' },
  checked_out: { label: 'Check-out', cls: 'bg-white/10 text-[#B8B0A8] border-white/15' },
  cancelled: { label: 'Cancelada', cls: 'bg-[#C73E1D]/10 text-[#F0A090] border-[#C73E1D]/30' },
}
const B_ACTIONS = [
  { status: 'confirmed', label: 'Confirmar' },
  { status: 'checked_in', label: 'Check-in' },
  { status: 'checked_out', label: 'Check-out' },
  { status: 'cancelled', label: 'Cancelar' },
]

function linkedRoom(b: Booking): LinkedRoom | null {
  const r = b.guest_rooms
  if (!r) return null
  return Array.isArray(r) ? (r[0] ?? null) : r
}
function blankRoom(order: number): Room {
  return {
    id: null, location_id: LOCATION, code: '', name: '', name_es: '',
    description: '', description_es: '', capacity: 2, price_per_night: null,
    image_url: null, amenities: [], amenities_en: [], is_active: true, sort_order: order,
  }
}

export default function AdminHabitacionesPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>('upcoming')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // No `range` param: the API returns the full log, so Pasadas/Todas work.
      const [rRes, bRes] = await Promise.all([
        fetch(`/api/admin/rooms?location_id=${LOCATION}`, { cache: 'no-store' }),
        fetch(`/api/admin/room-bookings?location_id=${LOCATION}`, { cache: 'no-store' }),
      ])
      const r = await rRes.json()
      const b = await bRes.json()
      if (rRes.ok) {
        setRooms((r.data as Room[]).map((x) => ({
          ...x,
          amenities: x.amenities ?? [],
          amenities_en: x.amenities_en ?? [],
        })))
      } else {
        setToast({ kind: 'err', text: r.message || 'Error al cargar habitaciones' })
      }
      if (bRes.ok) setBookings(b.data as Booking[])
      else setToast({ kind: 'err', text: b.message || 'Error al cargar solicitudes' })
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

  const patchLocal = (idx: number, patch: Partial<Room>) =>
    setRooms((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))

  const saveRoom = async (idx: number) => {
    const r = rooms[idx]
    if (!r.name_es.trim() || !r.name.trim() || !r.code.trim()) {
      setToast({ kind: 'err', text: 'Código y nombre (ES/EN) requeridos' })
      return
    }
    const key = r.id ?? `new-${idx}`
    setBusyId(key)
    try {
      const isNew = !r.id
      const payload = {
        location_id: LOCATION, code: r.code, name: r.name, name_es: r.name_es,
        description: r.description, description_es: r.description_es,
        capacity: r.capacity, price_per_night: r.price_per_night,
        image_url: r.image_url || null, amenities: r.amenities, amenities_en: r.amenities_en,
        is_active: r.is_active, sort_order: r.sort_order,
      }
      const res = await fetch('/api/admin/rooms', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isNew ? payload : { id: r.id, ...payload }),
      })
      const json = await res.json()
      if (!res.ok) setToast({ kind: 'err', text: json.message || 'Error al guardar' })
      else {
        if (json.data?.id && !r.id) patchLocal(idx, { id: json.data.id })
        setToast({ kind: 'ok', text: 'Habitación guardada' })
      }
    } catch {
      setToast({ kind: 'err', text: 'Error de conexión' })
    } finally {
      setBusyId(null)
    }
  }

  const deleteRoom = async (idx: number) => {
    const r = rooms[idx]
    if (!r.id) { setRooms((prev) => prev.filter((_, i) => i !== idx)); return }
    setBusyId(r.id)
    try {
      const res = await fetch(`/api/admin/rooms?id=${r.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) setToast({ kind: 'err', text: json.message || 'Error al eliminar' })
      else {
        setToast({ kind: 'ok', text: json.message || 'Eliminada' })
        if (json.data?.softDeleted) patchLocal(idx, { is_active: false })
        else setRooms((prev) => prev.filter((_, i) => i !== idx))
      }
    } catch {
      setToast({ kind: 'err', text: 'Error de conexión' })
    } finally {
      setBusyId(null)
    }
  }

  const updateBooking = async (id: string, status: string) => {
    setBusyId(id)
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
    try {
      const res = await fetch('/api/admin/room-bookings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }),
      })
      if (!res.ok) { setToast({ kind: 'err', text: 'No se pudo actualizar' }); load() }
      else setToast({ kind: 'ok', text: 'Solicitud actualizada' })
    } catch {
      setToast({ kind: 'err', text: 'Error de conexión' }); load()
    } finally {
      setBusyId(null)
    }
  }

  const today = todayInSV()
  const visibleBookings = useMemo(() => bookings.filter((b) => {
    if (bookingFilter === 'all') return true
    const isPast = b.check_out < today || b.status === 'cancelled'
    return bookingFilter === 'past' ? isPast : !isPast
  }), [bookings, bookingFilter, today])

  const upcomingCount = useMemo(
    () => bookings.filter((b) => b.check_out >= today && b.status !== 'cancelled').length,
    [bookings, today],
  )
  const pendingCount = useMemo(() => bookings.filter((b) => b.status === 'pending').length, [bookings])
  const inputCls = 'bg-[#1F1D1A] border border-[#3D3936] px-3 py-2 text-[#FFF8F0] text-sm focus:outline-none focus:border-[#FF6B35]'

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BedDouble className="w-6 h-6 text-[#FF6B35]" />
          <h1 className="text-2xl font-bold text-[#FFF8F0]">Habitaciones · Estadía</h1>
        </div>
        <button onClick={load} className="flex items-center gap-2 bg-[#252320] border border-[#3D3936] hover:border-[#FF6B35]/50 text-[#B8B0A8] px-4 py-2 text-sm transition">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {toast && (
        <div className={`mb-5 px-4 py-3 text-sm border ${toast.kind === 'ok' ? 'bg-[#4CAF50]/10 border-[#4CAF50]/30 text-[#8FD694]' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>{toast.text}</div>
      )}

      {/* Bookings */}
      <h2 className="text-lg font-semibold text-[#FFF8F0] flex items-center gap-2 mb-3">
        <CalendarClock className="w-5 h-5 text-[#FF6B35]" /> Solicitudes {pendingCount > 0 && <span className="text-xs bg-[#FFB800]/15 text-[#FFB800] px-2 py-0.5 rounded-full">{pendingCount} pendiente{pendingCount === 1 ? '' : 's'}</span>}
      </h2>

      <div className="flex gap-2 mb-4 flex-wrap">
        {B_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setBookingFilter(f.id)}
            className={`px-4 py-2 text-sm font-medium border transition ${
              bookingFilter === f.id
                ? 'bg-[#FF6B35] border-[#FF6B35] text-white'
                : 'bg-[#252320] border-[#3D3936] text-[#B8B0A8] hover:border-[#FF6B35]/50'
            }`}
          >
            {f.label}
            {f.id === 'upcoming' && ` (${upcomingCount})`}
            {f.id === 'all' && ` (${bookings.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-10 text-center"><Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin mx-auto" /></div>
      ) : visibleBookings.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-8 text-center text-[#6B6560] mb-8">No hay solicitudes en esta vista.</div>
      ) : (
        <div className="space-y-3 mb-8">
          {visibleBookings.map((b) => {
            const st = B_STATUS[b.status] ?? { label: b.status, cls: 'bg-white/10 text-white/60 border-white/15' }
            const rm = linkedRoom(b)
            return (
              <div key={b.id} className="bg-[#252320] border border-[#3D3936] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[#FFF8F0] font-semibold">{b.customer_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] border ${st.cls}`}>{st.label}</span>
                      {rm && <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30">{rm.name_es}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-[#B8B0A8]">
                      <span className="flex items-center gap-1.5"><CalendarClock className="w-4 h-4" />{b.check_in} → {b.check_out} ({b.nights ?? '—'}n)</span>
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{b.guest_count}</span>
                      {typeof b.total_amount === 'number' && (
                        <span className="flex items-center gap-1.5 text-[#FFF8F0]" title="Total cotizado al huésped">
                          <DollarSign className="w-4 h-4" />
                          {b.total_amount.toFixed(2)}
                          {typeof b.price_per_night === 'number' && (
                            <span className="text-[#6B6560]">(${b.price_per_night.toFixed(2)}/noche)</span>
                          )}
                        </span>
                      )}
                      <a href={`tel:${b.customer_phone}`} className="flex items-center gap-1.5 hover:text-[#FFF8F0]"><Phone className="w-4 h-4" />{b.customer_phone}</a>
                      {b.customer_email && <a href={`mailto:${b.customer_email}`} className="flex items-center gap-1.5 hover:text-[#FFF8F0]"><Mail className="w-4 h-4" />{b.customer_email}</a>}
                    </div>
                    {b.special_requests && <p className="mt-2 text-sm text-[#6B6560] italic">“{b.special_requests}”</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {B_ACTIONS.filter((a) => a.status !== b.status).map((a) => (
                      <button key={a.status} onClick={() => updateBooking(b.id, a.status)} disabled={busyId === b.id}
                        className={`px-3 py-1.5 text-xs font-medium border transition disabled:opacity-40 ${a.status === 'cancelled' ? 'border-red-500/30 text-red-300 hover:bg-red-500/15' : 'border-[#3D3936] text-[#B8B0A8] hover:bg-[#3D3936] hover:text-[#FFF8F0]'}`}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Rooms catalog */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-[#FFF8F0] flex items-center gap-2"><BedDouble className="w-5 h-5 text-[#FF6B35]" /> Catálogo de habitaciones</h2>
        <button onClick={() => setRooms((prev) => [...prev, blankRoom(prev.length + 1)])} className="flex items-center gap-2 bg-[#252320] border border-[#3D3936] hover:border-[#FF6B35]/50 text-[#B8B0A8] px-4 py-2 text-sm transition">
          <Plus className="w-4 h-4" /> Agregar habitación
        </button>
      </div>

      {rooms.length === 0 && !loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-8 text-center text-[#6B6560]">No hay habitaciones. Agrega la primera.</div>
      ) : (
        <div className="space-y-3">
          {rooms.map((r, idx) => {
            const busy = busyId === (r.id ?? `new-${idx}`)
            return (
              <div key={r.id ?? `new-${idx}`} className={`bg-[#252320] border p-4 ${r.is_active ? 'border-[#3D3936]' : 'border-[#3D3936] opacity-60'}`}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Código</label>
                    <input value={r.code} onChange={(e) => patchLocal(idx, { code: e.target.value })} className={`${inputCls} w-full`} placeholder="H1" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Nombre (ES)</label>
                    <input value={r.name_es} onChange={(e) => patchLocal(idx, { name_es: e.target.value })} className={`${inputCls} w-full`} placeholder="Habitación Vista al Lago" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Nombre (EN)</label>
                    <input value={r.name} onChange={(e) => patchLocal(idx, { name: e.target.value })} className={`${inputCls} w-full`} placeholder="Lake View Room" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Capacidad</label>
                    <input type="number" min={1} value={r.capacity} onChange={(e) => patchLocal(idx, { capacity: Math.max(1, parseInt(e.target.value) || 1) })} className={`${inputCls} w-full`} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">$ / noche</label>
                    <input type="number" min={0} step="0.01" value={r.price_per_night ?? ''} onChange={(e) => patchLocal(idx, { price_per_night: e.target.value === '' ? null : parseFloat(e.target.value) })} className={`${inputCls} w-full`} />
                  </div>
                  <div className="md:col-span-6">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Descripción (ES)</label>
                    <input value={r.description_es ?? ''} onChange={(e) => patchLocal(idx, { description_es: e.target.value })} className={`${inputCls} w-full`} placeholder="Habitación doble con balcón sobre el lago." />
                  </div>
                  <div className="md:col-span-6">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Descripción (EN)</label>
                    <input value={r.description ?? ''} onChange={(e) => patchLocal(idx, { description: e.target.value })} className={`${inputCls} w-full`} placeholder="Double room with a private balcony over the lake." />
                  </div>
                  <div className="md:col-span-6">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Amenidades ES (separadas por coma)</label>
                    <input value={r.amenities.join(', ')} onChange={(e) => patchLocal(idx, { amenities: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className={`${inputCls} w-full`} placeholder="WiFi, A/C, Vista al lago" />
                  </div>
                  <div className="md:col-span-6">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Amenities EN (separadas por coma)</label>
                    <input value={r.amenities_en.join(', ')} onChange={(e) => patchLocal(idx, { amenities_en: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className={`${inputCls} w-full`} placeholder="WiFi, A/C, Lake view" />
                    <p className="text-[10px] text-[#6B6560] mt-1">Vacío = la página en inglés muestra las de español.</p>
                  </div>
                  <div className="md:col-span-12">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Foto de la habitación</label>
                    <ImageUpload value={r.image_url} onChange={(url) => patchLocal(idx, { image_url: url })} folder="rooms" />
                    <p className="text-[10px] text-[#6B6560] mt-1">Sube el archivo (se guarda en Supabase). Los enlaces de otros sitios los bloquea el navegador — solo images.unsplash.com se permite.</p>
                  </div>
                  <div className="md:col-span-12 flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 text-sm text-[#B8B0A8] cursor-pointer">
                      <input type="checkbox" checked={r.is_active} onChange={(e) => patchLocal(idx, { is_active: e.target.checked })} className="accent-[#FF6B35] w-4 h-4" />
                      {r.is_active ? 'Visible al público' : 'Oculta'}
                    </label>
                    <div className="ml-auto flex items-center gap-2">
                      <button onClick={() => saveRoom(idx)} disabled={busy} className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E85D04] text-white px-4 py-2 text-sm font-semibold transition disabled:opacity-50">
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {r.id ? 'Guardar' : 'Crear'}
                      </button>
                      <button onClick={() => deleteRoom(idx)} disabled={busy} className="flex items-center gap-2 border border-red-500/30 text-red-300 hover:bg-red-500/15 px-3 py-2 text-sm transition disabled:opacity-50">
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
