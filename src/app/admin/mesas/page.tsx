'use client'

/**
 * Admin → Salón (areas + tables CMS)
 *
 * Owner-editable floor plan for every reservation venue: define areas
 * (floor / view / VIP / photo / description), add tables to each area, edit
 * seats, and block/unblock or retire tables. Everything here drives the
 * public "Elige tu área y mesa" experience.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapPin, Plus, Trash2, Check, Loader2, Crown, Lock, Unlock, RefreshCw, Layers } from 'lucide-react'

const VENUES = [
  { id: 'santa-ana', name: 'Santa Ana' },
  { id: 'lago-coatepeque', name: 'Lago de Coatepeque' },
  { id: 'san-benito', name: 'San Benito' },
  { id: 'simmer-garden', name: 'Simmer Garden' },
  { id: 'surf-city', name: 'Surf City' },
]

interface Area {
  id: string | null
  location_id: string
  code: string
  name_es: string
  name_en: string
  description_es: string | null
  floor: string | null
  view: string | null
  is_vip: boolean
  image_url: string | null
  min_party: number | null
  is_active: boolean
  sort_order: number
}
interface Table {
  id: string
  location_id: string
  zone: string
  area_id: string | null
  code: string
  label: string
  seats: number
  shape: string
  is_blocked: boolean
  is_active: boolean
  sort_order: number
}

function blankArea(loc: string, order: number): Area {
  return { id: null, location_id: loc, code: '', name_es: '', name_en: '', description_es: '', floor: '', view: '', is_vip: false, image_url: '', min_party: null, is_active: true, sort_order: order }
}
// spread new tables across the area canvas
function nextPos(count: number): { x: number; y: number } {
  const cols = 5
  const x = Math.round(((count % cols) + 0.5) / cols * 100)
  const y = Math.round((Math.floor(count / cols) % 3 + 0.5) / 3 * 100)
  return { x, y }
}

export default function AdminSalonPage() {
  const [venue, setVenue] = useState('santa-ana')
  const [areas, setAreas] = useState<Area[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [aRes, tRes] = await Promise.all([
        fetch(`/api/admin/areas?location_id=${venue}`),
        fetch(`/api/admin/tables?location_id=${venue}`),
      ])
      const a = await aRes.json()
      const t = await tRes.json()
      if (aRes.ok) setAreas((a.data as Area[]).map((x) => ({ ...x })))
      if (tRes.ok) setTables(t.data as Table[])
    } catch {
      setToast({ kind: 'err', text: 'Error al cargar' })
    } finally {
      setLoading(false)
    }
  }, [venue])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!toast) return
    const x = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(x)
  }, [toast])

  const patchArea = (idx: number, patch: Partial<Area>) => setAreas((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)))

  const saveArea = async (idx: number) => {
    const a = areas[idx]
    if (!a.code.trim() || !a.name_es.trim() || !a.name_en.trim()) { setToast({ kind: 'err', text: 'Código y nombre (ES/EN) requeridos' }); return }
    const key = a.id ?? `newA-${idx}`
    setBusy(key)
    try {
      const isNew = !a.id
      const payload = {
        location_id: venue, code: a.code, name_es: a.name_es, name_en: a.name_en, description_es: a.description_es,
        floor: a.floor || null, view: a.view || null, is_vip: a.is_vip, image_url: a.image_url || null,
        min_party: a.min_party, is_active: a.is_active, sort_order: a.sort_order,
      }
      const res = await fetch('/api/admin/areas', {
        method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isNew ? payload : { id: a.id, ...payload }),
      })
      const json = await res.json()
      if (!res.ok) setToast({ kind: 'err', text: json.message || 'Error al guardar' })
      else { setToast({ kind: 'ok', text: 'Área guardada' }); if (isNew) load() }
    } catch { setToast({ kind: 'err', text: 'Error de conexión' }) } finally { setBusy(null) }
  }

  const deleteArea = async (idx: number) => {
    const a = areas[idx]
    if (!a.id) { setAreas((prev) => prev.filter((_, i) => i !== idx)); return }
    setBusy(a.id)
    try {
      const res = await fetch(`/api/admin/areas?id=${a.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) setToast({ kind: 'err', text: json.message || 'Error' })
      else { setToast({ kind: json.data?.softDeleted ? 'err' : 'ok', text: json.message }); load() }
    } catch { setToast({ kind: 'err', text: 'Error de conexión' }) } finally { setBusy(null) }
  }

  const addTable = async (area: Area) => {
    if (!area.id) { setToast({ kind: 'err', text: 'Guarda el área primero' }); return }
    const areaTables = tables.filter((t) => t.area_id === area.id)
    const n = areaTables.length + 1
    const pos = nextPos(areaTables.length)
    const code = `${area.code}${n}`
    setBusy(`addT-${area.id}`)
    try {
      const res = await fetch('/api/admin/tables', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_id: venue, area_id: area.id, zone: area.code, code, label: code, seats: 4, shape: 'square', pos_x: pos.x, pos_y: pos.y, sort_order: (tables.length + 1) }),
      })
      const json = await res.json()
      if (!res.ok) setToast({ kind: 'err', text: json.message || 'Error al crear' })
      else load()
    } catch { setToast({ kind: 'err', text: 'Error de conexión' }) } finally { setBusy(null) }
  }

  const patchTable = async (t: Table, patch: Partial<Table>) => {
    setTables((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...patch } : x)))
    try {
      const res = await fetch('/api/admin/tables', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id, ...patch }),
      })
      if (!res.ok) { setToast({ kind: 'err', text: 'No se pudo actualizar la mesa' }); load() }
    } catch { setToast({ kind: 'err', text: 'Error de conexión' }); load() }
  }

  const deleteTable = async (t: Table) => {
    setBusy(t.id)
    try {
      const res = await fetch(`/api/admin/tables?id=${t.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) setToast({ kind: 'err', text: json.message || 'Error' })
      else { setToast({ kind: 'ok', text: json.message }); load() }
    } catch { setToast({ kind: 'err', text: 'Error de conexión' }) } finally { setBusy(null) }
  }

  const tablesByArea = useMemo(() => {
    const m = new Map<string, Table[]>()
    for (const t of tables) { const k = t.area_id ?? 'none'; const arr = m.get(k) ?? []; arr.push(t); m.set(k, arr) }
    return m
  }, [tables])

  const input = 'bg-[#1F1D1A] border border-[#3D3936] px-3 py-2 text-[#FFF8F0] text-sm focus:outline-none focus:border-[#FF6B35]'

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6 text-[#FF6B35]" />
          <h1 className="text-2xl font-bold text-[#FFF8F0]">Salón · Áreas y Mesas</h1>
        </div>
        <div className="flex items-center gap-3">
          <select value={venue} onChange={(e) => setVenue(e.target.value)} className={input}>
            {VENUES.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <button onClick={load} className="flex items-center gap-2 bg-[#252320] border border-[#3D3936] hover:border-[#FF6B35]/50 text-[#B8B0A8] px-4 py-2 text-sm transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>
      </div>

      <p className="text-[#6B6560] text-sm mb-4">
        Define las áreas del restaurante (planta, vista, VIP) y sus mesas. El cliente las verá en el mapa de reservas. Marca un área como &quot;Visible&quot; para publicarla.
      </p>

      {toast && (
        <div className={`mb-5 px-4 py-3 text-sm border ${toast.kind === 'ok' ? 'bg-[#4CAF50]/10 border-[#4CAF50]/30 text-[#8FD694]' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>{toast.text}</div>
      )}

      <div className="flex justify-end mb-3">
        <button onClick={() => setAreas((prev) => [...prev, blankArea(venue, prev.length + 1)])} className="flex items-center gap-2 bg-[#252320] border border-[#3D3936] hover:border-[#FF6B35]/50 text-[#B8B0A8] px-4 py-2 text-sm transition">
          <Plus className="w-4 h-4" /> Agregar área
        </button>
      </div>

      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center"><Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin mx-auto" /></div>
      ) : areas.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-8 text-center text-[#6B6560]">Sin áreas. Agrega la primera.</div>
      ) : (
        <div className="space-y-4">
          {areas.map((a, idx) => {
            const areaTables = a.id ? (tablesByArea.get(a.id) ?? []) : []
            const busyA = busy === (a.id ?? `newA-${idx}`)
            return (
              <div key={a.id ?? `newA-${idx}`} className={`bg-[#252320] border p-4 ${a.is_active ? (a.is_vip ? 'border-[#C9A84C]/40' : 'border-[#3D3936]') : 'border-[#3D3936] opacity-60'}`}>
                {/* Area fields */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-2"><label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Código</label><input value={a.code} onChange={(e) => patchArea(idx, { code: e.target.value.toUpperCase() })} className={`${input} w-full`} placeholder="VIP" /></div>
                  <div className="md:col-span-3"><label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Nombre (ES)</label><input value={a.name_es} onChange={(e) => patchArea(idx, { name_es: e.target.value })} className={`${input} w-full`} placeholder="Salas VIP" /></div>
                  <div className="md:col-span-3"><label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Nombre (EN)</label><input value={a.name_en} onChange={(e) => patchArea(idx, { name_en: e.target.value })} className={`${input} w-full`} placeholder="VIP Lounges" /></div>
                  <div className="md:col-span-2"><label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Planta</label><input value={a.floor ?? ''} onChange={(e) => patchArea(idx, { floor: e.target.value })} className={`${input} w-full`} placeholder="Planta Alta" /></div>
                  <div className="md:col-span-2"><label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Vista</label><input value={a.view ?? ''} onChange={(e) => patchArea(idx, { view: e.target.value })} className={`${input} w-full`} placeholder="Iglesia" /></div>
                  <div className="md:col-span-6"><label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Descripción (ES)</label><input value={a.description_es ?? ''} onChange={(e) => patchArea(idx, { description_es: e.target.value })} className={`${input} w-full`} placeholder="Mesas con vista a la catedral." /></div>
                  <div className="md:col-span-4"><label className="block text-[10px] text-[#6B6560] mb-1 uppercase">URL de foto</label><input value={a.image_url ?? ''} onChange={(e) => patchArea(idx, { image_url: e.target.value })} className={`${input} w-full`} placeholder="https://…" /></div>
                  <div className="md:col-span-2"><label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Mín. personas</label><input type="number" min={0} value={a.min_party ?? ''} onChange={(e) => patchArea(idx, { min_party: e.target.value === '' ? null : parseInt(e.target.value) })} className={`${input} w-full`} /></div>
                  <div className="md:col-span-12 flex flex-wrap items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 text-sm text-[#B8B0A8] cursor-pointer"><input type="checkbox" checked={a.is_vip} onChange={(e) => patchArea(idx, { is_vip: e.target.checked })} className="accent-[#C9A84C] w-4 h-4" /><Crown className="w-4 h-4 text-[#C9A84C]" /> VIP</label>
                    <label className="flex items-center gap-2 text-sm text-[#B8B0A8] cursor-pointer"><input type="checkbox" checked={a.is_active} onChange={(e) => patchArea(idx, { is_active: e.target.checked })} className="accent-[#FF6B35] w-4 h-4" /> {a.is_active ? 'Visible al público' : 'Oculta'}</label>
                    <div className="ml-auto flex items-center gap-2">
                      <button onClick={() => saveArea(idx)} disabled={busyA} className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E85D04] text-white px-4 py-2 text-sm font-semibold transition disabled:opacity-50">{busyA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {a.id ? 'Guardar' : 'Crear'}</button>
                      <button onClick={() => deleteArea(idx)} disabled={busyA} className="flex items-center gap-2 border border-red-500/30 text-red-300 hover:bg-red-500/15 px-3 py-2 text-sm transition disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>

                {/* Tables in this area */}
                {a.id && (
                  <div className="mt-4 pt-4 border-t border-[#3D3936]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase tracking-wider text-[#6B6560] flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {areaTables.length} mesas</span>
                      <button onClick={() => addTable(a)} disabled={busy === `addT-${a.id}`} className="flex items-center gap-1 text-xs text-[#FF6B35] hover:text-[#E85D04] disabled:opacity-50"><Plus className="w-3.5 h-3.5" /> Agregar mesa</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {areaTables.map((t) => (
                        <div key={t.id} className={`flex items-center gap-1.5 border px-2 py-1.5 text-sm ${t.is_blocked ? 'bg-[#C73E1D]/15 border-[#C73E1D]/40 text-[#F0A090]' : 'bg-[#1F1D1A] border-[#3D3936] text-[#FFF8F0]'}`}>
                          <span className="font-medium">{t.label}</span>
                          <input type="number" min={1} value={t.seats} onChange={(e) => patchTable(t, { seats: Math.max(1, parseInt(e.target.value) || 1) })} className="w-12 bg-transparent border border-[#3D3936] px-1 text-xs text-[#B8B0A8]" title="Personas" />
                          <button onClick={() => patchTable(t, { is_blocked: !t.is_blocked })} title={t.is_blocked ? 'Liberar' : 'Bloquear'} className="text-[#6B6560] hover:text-[#FFF8F0]">{t.is_blocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}</button>
                          <button onClick={() => deleteTable(t)} disabled={busy === t.id} className="text-red-400/70 hover:text-red-400 disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                      {areaTables.length === 0 && <span className="text-[#6B6560] text-xs">Sin mesas — agrega la primera.</span>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
