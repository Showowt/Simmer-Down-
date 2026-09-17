'use client'

/**
 * Admin → Mesas (floor-plan table management)
 *
 * Block/unblock individual tables for venues that have a floor plan
 * (Simmer Garden). A blocked table renders red on the public booking map
 * and is rejected server-side at booking time — used for maintenance,
 * walk-ins or VIP holds.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapPin, Lock, Unlock, RefreshCw, Loader2 } from 'lucide-react'
import { ZONE_ORDER, ZONE_LABELS, type TableZone } from '@/lib/tables'

// Venues that have an interactive floor plan (reservation location ids).
const FLOORPLAN_VENUES = [{ id: 'simmer-garden', name: 'Simmer Garden (Juayúa)' }]

interface AdminTable {
  id: string
  zone: TableZone
  code: string
  label: string
  seats: number
  is_blocked: boolean
  is_active: boolean
}

export default function AdminMesasPage() {
  const [venue, setVenue] = useState(FLOORPLAN_VENUES[0].id)
  const [tables, setTables] = useState<AdminTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/tables?location_id=${venue}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.message || 'No se pudieron cargar las mesas')
        setTables([])
      } else {
        setTables(json.data as AdminTable[])
        setError(null)
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [venue])

  useEffect(() => {
    load()
  }, [load])

  const toggleBlock = useCallback(async (table: AdminTable) => {
    const next = !table.is_blocked
    setTables((prev) =>
      prev.map((t) => (t.id === table.id ? { ...t, is_blocked: next } : t)),
    )
    try {
      const res = await fetch('/api/admin/tables', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: table.id, is_blocked: next }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setTables((prev) =>
        prev.map((t) => (t.id === table.id ? { ...t, is_blocked: !next } : t)),
      )
      setError('No se pudo actualizar la mesa')
    }
  }, [])

  const tablesByZone = useMemo(() => {
    const map = new Map<TableZone, AdminTable[]>()
    for (const t of tables) {
      const arr = map.get(t.zone) ?? []
      arr.push(t)
      map.set(t.zone, arr)
    }
    return map
  }, [tables])

  const blockedCount = useMemo(() => tables.filter((t) => t.is_blocked).length, [tables])

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#FFF8F0] flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#FF6B35]" /> Mesas
          </h1>
          <p className="text-[#6B6560]">Bloqueo manual del mapa de mesas</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="bg-[#252320] border border-[#3D3936] px-3 py-2.5 text-[#FFF8F0] text-sm focus:outline-none focus:border-[#FF6B35]"
          >
            {FLOORPLAN_VENUES.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <button
            onClick={load}
            className="flex items-center gap-2 bg-[#252320] border border-[#3D3936] hover:border-[#FF6B35]/50 text-[#B8B0A8] px-4 py-2.5 text-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="bg-[#252320] border border-[#3D3936] p-4 mb-5 flex items-center justify-between">
        <p className="text-sm text-[#B8B0A8]">
          Toca una mesa para bloquearla o liberarla. Las mesas bloqueadas aparecen en rojo en el mapa público y no se pueden reservar.
        </p>
        <span className="text-sm text-[#FF6B35] whitespace-nowrap ml-4">
          {blockedCount} bloqueada{blockedCount === 1 ? '' : 's'}
        </span>
      </div>

      {error && (
        <div className="bg-[#252320] border border-red-500/30 p-4 mb-5 text-red-400 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-5">
          {ZONE_ORDER.filter((z) => tablesByZone.has(z)).map((zone) => (
            <div key={zone} className="bg-[#252320] border border-[#3D3936] p-5">
              <p className="text-xs uppercase tracking-wider text-[#6B6560] mb-3">
                {ZONE_LABELS[zone].es}
              </p>
              <div className="flex flex-wrap gap-2">
                {(tablesByZone.get(zone) ?? []).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleBlock(t)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border transition ${
                      t.is_blocked
                        ? 'bg-[#C73E1D]/15 border-[#C73E1D]/50 text-[#F0A090]'
                        : 'bg-[#4CAF50]/10 border-[#4CAF50]/30 text-[#8FD694] hover:bg-[#4CAF50]/20'
                    }`}
                    title={t.is_blocked ? 'Bloqueada — clic para liberar' : 'Disponible — clic para bloquear'}
                  >
                    {t.is_blocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    {t.label}
                    <span className="opacity-60 text-xs">· {t.seats}p</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
