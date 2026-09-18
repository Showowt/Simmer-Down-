'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Loader2, Check, Info, ChevronLeft, Crown, Church, Trees, Waves, Eye, Layers,
} from 'lucide-react'
import { localizedAreaName, type AreaWithTables, type TableAvailability } from '@/lib/tables'

// ═══════════════════════════════════════════════════════════════
// Experience-first floor plan: browse named areas (floor / view / VIP,
// with a photo + description) → open an area → pick a table inside it.
// Availability (green / red) is computed server-side.
// ═══════════════════════════════════════════════════════════════

interface FloorPlanProps {
  locationId: string
  date: string | null
  time: string | null
  guestCount: number
  selectedTableId: string | null
  onSelectTable: (table: TableAvailability | null) => void
  onHasTables?: (has: boolean) => void
  locale: string
  t: (obj: { es: string; en: string }) => string
}

function viewIcon(view: string | null) {
  const v = (view || '').toLowerCase()
  if (v.includes('igles') || v.includes('church')) return Church
  if (v.includes('parque') || v.includes('park')) return Trees
  if (v.includes('lago') || v.includes('lake') || v.includes('mar') || v.includes('sea')) return Waves
  return Eye
}

export default function FloorPlan({
  locationId, date, time, guestCount, selectedTableId, onSelectTable, onHasTables, locale, t,
}: FloorPlanProps) {
  const [areas, setAreas] = useState<AreaWithTables[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openAreaId, setOpenAreaId] = useState<string | null>(null)

  // Fetch areas + availability whenever venue / date / time changes.
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams({ location_id: locationId })
        if (date) params.set('date', date)
        if (time) params.set('time', time)
        const res = await fetch(`/api/tables?${params.toString()}`, { signal: controller.signal })
        const json = await res.json()
        if (cancelled) return
        if (!res.ok || !json.success) {
          setError(locale === 'es' ? 'No se pudieron cargar las mesas.' : 'Could not load tables.')
          setAreas([])
          onHasTables?.(false)
          return
        }
        const list = (json.areas ?? []) as AreaWithTables[]
        setAreas(list)
        onHasTables?.(list.length > 0)
      } catch (err) {
        if (cancelled || (err instanceof Error && err.name === 'AbortError')) return
        setError(locale === 'es' ? 'Error de conexión.' : 'Connection error.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true; controller.abort() }
  }, [locationId, date, time, locale, onHasTables])

  // Drop selection if the selected table becomes unavailable after a refetch.
  useEffect(() => {
    if (!selectedTableId) return
    const all = areas.flatMap((a) => a.tables)
    if (all.length > 0 && !all.find((tb) => tb.id === selectedTableId && tb.available)) {
      onSelectTable(null)
    }
  }, [areas, selectedTableId, onSelectTable])

  const openArea = useMemo(() => areas.find((a) => a.id === openAreaId) || null, [areas, openAreaId])
  const selectedTable = useMemo(
    () => areas.flatMap((a) => a.tables).find((tb) => tb.id === selectedTableId) || null,
    [areas, selectedTableId],
  )
  const selectedArea = useMemo(
    () => (selectedTable ? areas.find((a) => a.tables.some((tb) => tb.id === selectedTable.id)) || null : null),
    [areas, selectedTable],
  )

  const handleTableClick = useCallback((table: TableAvailability) => {
    if (!table.available) return
    onSelectTable(table.id === selectedTableId ? null : table)
  }, [selectedTableId, onSelectTable])

  if (loading && areas.length === 0) {
    return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 text-[#E85D04] animate-spin" /></div>
  }
  if (!loading && areas.length === 0) {
    return (
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-center">
        <Info className="w-5 h-5 text-white/30 mx-auto mb-2" />
        <p className="text-white/40 text-sm">
          {t({ es: 'Este restaurante aún no tiene mapa de mesas.', en: 'This restaurant has no table map yet.' })}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {(!date || !time) && (
        <p className="text-white/40 text-xs flex items-center gap-2">
          <Info className="w-3.5 h-3.5" />
          {t({ es: 'Elige fecha y hora para ver la disponibilidad exacta.', en: 'Pick a date and time for exact availability.' })}
        </p>
      )}

      <AnimatePresence mode="wait">
        {!openArea ? (
          <motion.div key="areas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {areas.map((area) => {
              const ViewIcon = viewIcon(area.view)
              const soldOut = area.availableCount === 0
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => setOpenAreaId(area.id)}
                  className={`group text-left border rounded-2xl overflow-hidden transition-all bg-[#111] ${
                    area.is_vip ? 'border-[#C9A84C]/40 hover:border-[#C9A84C]' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div
                    className={`relative h-28 ${area.is_vip ? 'bg-gradient-to-br from-[#C9A84C]/25 to-[#111]' : 'bg-gradient-to-br from-[#E85D04]/20 to-[#111]'}`}
                    style={area.image_url ? { backgroundImage: `url(${area.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                  >
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {area.floor && (
                        <span className="flex items-center gap-1 bg-black/50 backdrop-blur text-white/90 text-[10px] uppercase tracking-wide px-2 py-1 rounded">
                          <Layers className="w-3 h-3" /> {area.floor}
                        </span>
                      )}
                      {area.view && (
                        <span className="flex items-center gap-1 bg-black/50 backdrop-blur text-white/90 text-[10px] uppercase tracking-wide px-2 py-1 rounded">
                          <ViewIcon className="w-3 h-3" /> {area.view}
                        </span>
                      )}
                      {area.is_vip && (
                        <span className="flex items-center gap-1 bg-[#C9A84C] text-black text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded">
                          <Crown className="w-3 h-3" /> VIP
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold">{localizedAreaName(area, locale)}</h3>
                    {(locale === 'es' ? area.description_es : area.description_en) && (
                      <p className="text-white/50 text-sm mt-1 line-clamp-2">
                        {locale === 'es' ? area.description_es : area.description_en}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs font-medium ${soldOut ? 'text-red-400' : 'text-[#4CAF50]'}`}>
                        {soldOut
                          ? t({ es: 'Sin mesas libres', en: 'No tables free' })
                          : `${area.availableCount} ${t({ es: 'mesas libres', en: 'tables free' })}`}
                      </span>
                      <span className="text-[#E85D04] text-xs font-semibold group-hover:translate-x-0.5 transition-transform">
                        {t({ es: 'Ver mesas →', en: 'View tables →' })}
                      </span>
                    </div>
                    {area.min_party ? (
                      <p className="text-white/30 text-[11px] mt-2">
                        {t({ es: `Mínimo ${area.min_party} personas`, en: `Minimum ${area.min_party} guests` })}
                      </p>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </motion.div>
        ) : (
          <motion.div key="tables" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
            <button type="button" onClick={() => setOpenAreaId(null)}
              className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-3">
              <ChevronLeft className="w-4 h-4" /> {t({ es: 'Cambiar área', en: 'Change area' })}
            </button>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <h3 className="text-white font-semibold">{localizedAreaName(openArea, locale)}</h3>
              {openArea.floor && <span className="text-white/40 text-xs">· {openArea.floor}</span>}
              {openArea.view && <span className="text-white/40 text-xs">· {openArea.view}</span>}
              {openArea.is_vip && <Crown className="w-4 h-4 text-[#C9A84C]" />}
            </div>

            <div className="relative bg-[#1A1A1A] border border-white/10 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 opacity-[0.45] pointer-events-none" aria-hidden="true"
                style={{ background: 'repeating-linear-gradient(90deg, #2a1c10 0px, #2a1c10 2px, #241609 2px, #241609 46px)' }} />
              {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#1A1A1A]/70">
                  <Loader2 className="w-6 h-6 text-[#E85D04] animate-spin" />
                </div>
              )}
              <div className="relative w-full aspect-[16/10] min-h-[300px]">
                {openArea.tables.map((table) => {
                  const selected = table.id === selectedTableId
                  const tooSmall = table.available && table.seats < guestCount
                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => handleTableClick(table)}
                      disabled={!table.available}
                      aria-pressed={selected}
                      aria-label={`${table.label} — ${table.seats} ${locale === 'es' ? 'personas' : 'seats'}`}
                      title={tooSmall ? (locale === 'es' ? `Capacidad ${table.seats}` : `Seats ${table.seats}`) : undefined}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center font-bold transition-all duration-150 ${
                        table.shape === 'rect' ? 'w-16 h-11 sm:w-20 sm:h-12' : 'w-12 h-12 sm:w-14 sm:h-14'
                      } ${
                        selected
                          ? 'bg-[#E85D04] text-white ring-2 ring-[#F5D47A] ring-offset-2 ring-offset-[#1A1A1A] z-10 scale-110'
                          : table.available
                            ? tooSmall
                              ? 'bg-[#4CAF50]/40 text-white/90 border border-[#4CAF50]/50 hover:bg-[#4CAF50]/60'
                              : 'bg-[#2E7D32] text-white border border-[#4CAF50]/60 hover:bg-[#388E3C] hover:scale-105'
                            : 'bg-[#3a1414] text-white/40 border border-red-900/50 cursor-not-allowed'
                      }`}
                      style={{ left: `${table.pos_x}%`, top: `${table.pos_y}%` }}
                    >
                      <span className="text-[11px] sm:text-xs leading-none">{table.label}</span>
                      <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] font-medium opacity-80 mt-0.5">
                        <Users className="w-2.5 h-2.5" />{table.seats}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50 mt-3">
              <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-[#2E7D32] border border-[#4CAF50]/60 inline-block" />{t({ es: 'Disponible', en: 'Available' })}</span>
              <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-[#3a1414] border border-red-900/50 inline-block" />{t({ es: 'Ocupada', en: 'Taken' })}</span>
              <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-[#E85D04] inline-block" />{t({ es: 'Tu mesa', en: 'Your table' })}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {selectedTable && selectedArea && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-[#E85D04]/10 border border-[#E85D04]/30 rounded-xl p-4">
          <div className="w-9 h-9 bg-[#E85D04] flex items-center justify-center flex-shrink-0"><Check className="w-5 h-5 text-white" /></div>
          <p className="text-sm text-white">
            {t({
              es: `Mesa ${selectedTable.label} · ${localizedAreaName(selectedArea, 'es')} · ${selectedTable.seats} personas`,
              en: `Table ${selectedTable.label} · ${localizedAreaName(selectedArea, 'en')} · seats ${selectedTable.seats}`,
            })}
          </p>
        </motion.div>
      )}
    </div>
  )
}
