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
import { MapPin, Plus, Trash2, Check, Loader2, Crown, Lock, Unlock, RefreshCw, Layers, Eye, EyeOff, AlertTriangle } from 'lucide-react'

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
  description_en: string | null
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
  return { id: null, location_id: loc, code: '', name_es: '', name_en: '', description_es: '', description_en: '', floor: '', view: '', is_vip: false, image_url: '', min_party: null, is_active: true, sort_order: order }
}
// spread new tables across the area canvas
function nextPos(count: number): { x: number; y: number } {
  const cols = 5
  const x = Math.round(((count % cols) + 0.5) / cols * 100)
  const y = Math.round((Math.floor(count / cols) % 3 + 0.5) / 3 * 100)
  return { x, y }
}

const CODE_SUFFIX = /^(.*?)(\d+)$/

/**
 * Next table code for an area. Derived from the HIGHEST numeric suffix already
 * used by the area (inactive tables included) — never from the table count,
 * which silently reuses a code after any non-last table is deleted. The prefix
 * follows the area's existing naming (Barra tables are B1…B12, not BARRA1).
 * Codes are unique per venue, so the loop checks every table of the location.
 */
function nextTableCode(areaCode: string, areaTables: Table[], venueTables: Table[]): string {
  let highest = 0
  const prefixes = new Map<string, number>()
  for (const t of areaTables) {
    const parts = CODE_SUFFIX.exec(t.code.trim())
    if (!parts) continue
    highest = Math.max(highest, parseInt(parts[2], 10))
    if (parts[1]) prefixes.set(parts[1], (prefixes.get(parts[1]) ?? 0) + 1)
  }
  let prefix = areaCode.trim().toUpperCase()
  let best = 0
  for (const [candidate, count] of prefixes) {
    if (count > best) { best = count; prefix = candidate }
  }
  const taken = new Set(venueTables.map((t) => t.code.trim().toUpperCase()))
  let n = highest + 1
  while (taken.has(`${prefix}${n}`.toUpperCase())) n += 1
  return `${prefix}${n}`
}

export default function AdminSalonPage() {
  const [venue, setVenue] = useState('santa-ana')
  const [areas, setAreas] = useState<Area[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  // Seats commit on blur, not on every keystroke (an empty field used to write seats=1).
  const [seatDraft, setSeatDraft] = useState<Record<string, string>>({})

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
        location_id: venue, code: a.code, name_es: a.name_es, name_en: a.name_en,
        description_es: a.description_es, description_en: a.description_en,
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
    const pos = nextPos(areaTables.length)
    const code = nextTableCode(area.code, areaTables, tables)
    const sortOrder = tables.reduce((max, t) => Math.max(max, t.sort_order), 0) + 1
    setBusy(`addT-${area.id}`)
    try {
      const res = await fetch('/api/admin/tables', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_id: venue, area_id: area.id, zone: area.code, code, label: code, seats: 4, shape: 'square', pos_x: pos.x, pos_y: pos.y, sort_order: sortOrder }),
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

  /** Commit a seats edit: refuse empty / 0 / out-of-range and restore the stored value. */
  const commitSeats = (t: Table) => {
    const raw = seatDraft[t.id]
    setSeatDraft((prev) => { const next = { ...prev }; delete next[t.id]; return next })
    if (raw === undefined) return
    const n = parseInt(raw, 10)
    if (!Number.isFinite(n) || n < 1 || n > 30) {
      setToast({ kind: 'err', text: 'Personas debe ser un número entre 1 y 30 / Seats must be a number between 1 and 30' })
      return
    }
    if (n === t.seats) return
    patchTable(t, { seats: n })
  }

  /** Turn every hidden table of an area back on — the switch that un-darkens a venue. */
  const activateAllTables = async (area: Area, areaTables: Table[]) => {
    if (!area.id) return
    const hidden = areaTables.filter((t) => !t.is_active)
    if (hidden.length === 0) return
    const label = area.name_es || area.code
    if (!confirm(`¿Activar ${hidden.length} mesa(s) de "${label}"? Quedarán visibles al público. / Activate ${hidden.length} table(s) in "${label}"? They will become visible to the public.`)) return
    setBusy(`bulkT-${area.id}`)
    let failed = 0
    try {
      for (const t of hidden) {
        try {
          const res = await fetch('/api/admin/tables', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: t.id, is_active: true }),
          })
          if (!res.ok) failed += 1
        } catch { failed += 1 }
      }
      setToast(failed === 0
        ? {
            kind: 'ok',
            // The public map also filters venue_areas.is_active — activating the
            // tables of a hidden area changes nothing until the area is published.
            text: area.is_active
              ? `${hidden.length} mesas activadas / ${hidden.length} tables activated`
              : `${hidden.length} mesas activadas, pero el área sigue oculta: marca "Visible" y guarda el área. / ${hidden.length} tables activated, but the area is still hidden — tick "Visible" and save it.`,
          }
        : { kind: 'err', text: `${hidden.length - failed} activadas, ${failed} fallaron — intenta de nuevo / ${failed} failed, try again` })
    } finally {
      setBusy(null)
      load()
    }
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
        Define las áreas del restaurante (planta, vista, VIP) y sus mesas. El cliente las verá en el mapa de reservas. Marca un área como &quot;Visible&quot; para publicarla — y recuerda que un área sólo aparece si tiene al menos una mesa visible.
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
            const activeTables = areaTables.filter((t) => t.is_active).length
            const hiddenTables = areaTables.length - activeTables
            const busyA = busy === (a.id ?? `newA-${idx}`)
            const busyBulk = busy === `bulkT-${a.id}`
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
                  <div className="md:col-span-6"><label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Descripción (EN)</label><input value={a.description_en ?? ''} onChange={(e) => patchArea(idx, { description_en: e.target.value })} className={`${input} w-full`} placeholder="Upstairs tables overlooking the Cathedral." /></div>
                  <div className="md:col-span-10"><label className="block text-[10px] text-[#6B6560] mb-1 uppercase">URL de foto</label><input value={a.image_url ?? ''} onChange={(e) => patchArea(idx, { image_url: e.target.value })} className={`${input} w-full`} placeholder="https://images.unsplash.com/… o tu Supabase Storage" /></div>
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
                    <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                      <span className="text-xs uppercase tracking-wider text-[#6B6560] flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {activeTables} de {areaTables.length} mesas visibles</span>
                      <div className="flex items-center gap-4">
                        {hiddenTables > 0 && (
                          <button onClick={() => activateAllTables(a, areaTables)} disabled={busyBulk} className="flex items-center gap-1 text-xs text-[#8FD694] hover:text-[#4CAF50] disabled:opacity-50">
                            {busyBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />} Activar todas las mesas / Activate all tables ({hiddenTables})
                          </button>
                        )}
                        <button onClick={() => addTable(a)} disabled={busy === `addT-${a.id}`} className="flex items-center gap-1 text-xs text-[#FF6B35] hover:text-[#E85D04] disabled:opacity-50"><Plus className="w-3.5 h-3.5" /> Agregar mesa</button>
                      </div>
                    </div>

                    {a.is_active && activeTables === 0 && (
                      <div className="flex items-start gap-2 mb-3 border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-3 py-2 text-xs text-[#E8C96F]">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                        <span>Esta área está visible pero no tiene mesas activas, así que desaparece del mapa público. Activa al menos una mesa. / This area is live but has no active tables, so it never shows on the public map.</span>
                      </div>
                    )}

                    {!a.is_active && areaTables.length > 0 && (
                      <div className="flex items-start gap-2 mb-3 border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-3 py-2 text-xs text-[#E8C96F]">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                        <span>Esta área está oculta: sus mesas no salen en el mapa público aunque las actives. Marca &quot;Visible&quot; arriba y guarda el área. / This area is hidden: activating its tables changes nothing publicly until you tick &quot;Visible&quot; above and save the area.</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {areaTables.map((t) => (
                        <div key={t.id} className={`flex items-center gap-1.5 border px-2 py-1.5 text-sm ${!t.is_active ? 'bg-[#1F1D1A] border-dashed border-[#3D3936] text-[#6B6560] opacity-70' : t.is_blocked ? 'bg-[#C73E1D]/15 border-[#C73E1D]/40 text-[#F0A090]' : 'bg-[#1F1D1A] border-[#3D3936] text-[#FFF8F0]'}`}>
                          <span className="font-medium">{t.label}</span>
                          {!t.is_active && <span className="text-[9px] uppercase tracking-wider border border-[#3D3936] px-1 py-px text-[#6B6560]">Oculta</span>}
                          <input
                            type="number" min={1} max={30}
                            value={seatDraft[t.id] ?? String(t.seats)}
                            onChange={(e) => setSeatDraft((prev) => ({ ...prev, [t.id]: e.target.value }))}
                            onBlur={() => commitSeats(t)}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                            className="w-12 bg-transparent border border-[#3D3936] px-1 text-xs text-[#B8B0A8]"
                            title="Personas"
                          />
                          <button onClick={() => patchTable(t, { is_active: !t.is_active })} title={t.is_active ? 'Visible — ocultar del público / Hide' : 'Oculta — mostrar al público / Show'} className="text-[#6B6560] hover:text-[#FFF8F0]">{t.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</button>
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
