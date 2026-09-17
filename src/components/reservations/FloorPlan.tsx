'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Loader2, Check, Info } from 'lucide-react'
import {
  ZONE_ORDER,
  ZONE_LABELS,
  type TableAvailability,
  type TableZone,
} from '@/lib/tables'

// ═══════════════════════════════════════════════════════════════
// Interactive floor plan — pick a specific table from the venue map.
// Availability (green / red) is computed server-side from manual blocks
// + colliding reservations for the chosen date & time.
// ═══════════════════════════════════════════════════════════════

interface FloorPlanProps {
  locationId: string
  date: string | null // YYYY-MM-DD
  time: string | null // HH:MM
  guestCount: number
  selectedTableId: string | null
  onSelectTable: (table: TableAvailability | null) => void
  locale: string
  t: (obj: { es: string; en: string }) => string
}

export default function FloorPlan({
  locationId,
  date,
  time,
  guestCount,
  selectedTableId,
  onSelectTable,
  locale,
  t,
}: FloorPlanProps) {
  const [tables, setTables] = useState<TableAvailability[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeZone, setActiveZone] = useState<TableZone>('M')

  const ready = Boolean(date && time)

  // Fetch availability whenever the venue / date / time changes.
  useEffect(() => {
    if (!ready) {
      setTables([])
      return
    }
    let cancelled = false
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams({ location_id: locationId })
        if (date) params.set('date', date)
        if (time) params.set('time', time)
        const res = await fetch(`/api/tables?${params.toString()}`, {
          signal: controller.signal,
        })
        const json = await res.json()
        if (cancelled) return
        if (!res.ok || !json.success) {
          setError(
            locale === 'es'
              ? 'No se pudieron cargar las mesas.'
              : 'Could not load tables.',
          )
          setTables([])
          return
        }
        setTables(json.tables as TableAvailability[])
      } catch (err) {
        if (cancelled || (err instanceof Error && err.name === 'AbortError')) return
        setError(
          locale === 'es'
            ? 'Error de conexión al cargar mesas.'
            : 'Connection error loading tables.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [ready, locationId, date, time, locale])

  // If the currently-selected table becomes unavailable after a refetch, drop it.
  useEffect(() => {
    if (!selectedTableId) return
    const stillOk = tables.find((tb) => tb.id === selectedTableId && tb.available)
    if (tables.length > 0 && !stillOk) {
      onSelectTable(null)
    }
  }, [tables, selectedTableId, onSelectTable])

  const zonesPresent = useMemo(() => {
    const set = new Set(tables.map((tb) => tb.zone))
    return ZONE_ORDER.filter((z) => set.has(z))
  }, [tables])

  // Keep the active zone valid.
  useEffect(() => {
    if (zonesPresent.length > 0 && !zonesPresent.includes(activeZone)) {
      setActiveZone(zonesPresent[0])
    }
  }, [zonesPresent, activeZone])

  const zoneTables = useMemo(
    () => tables.filter((tb) => tb.zone === activeZone),
    [tables, activeZone],
  )

  const availableCount = useMemo(
    () => tables.filter((tb) => tb.available).length,
    [tables],
  )

  const handleTableClick = useCallback(
    (table: TableAvailability) => {
      if (!table.available) return
      if (table.id === selectedTableId) {
        onSelectTable(null)
      } else {
        onSelectTable(table)
      }
    },
    [selectedTableId, onSelectTable],
  )

  if (!ready) {
    return (
      <div className="bg-[#111] border border-white/10 rounded-2xl p-8 text-center">
        <Info className="w-6 h-6 text-white/30 mx-auto mb-3" />
        <p className="text-white/40 text-sm">
          {t({
            es: 'Selecciona fecha y hora para ver el mapa de mesas.',
            en: 'Pick a date and time to see the table map.',
          })}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Zone tabs */}
      <div className="flex flex-wrap gap-2">
        {zonesPresent.map((zone) => {
          const isActive = zone === activeZone
          return (
            <button
              key={zone}
              type="button"
              onClick={() => setActiveZone(zone)}
              className={`px-4 py-2.5 text-sm font-semibold uppercase tracking-wider transition-all min-h-[44px] ${
                isActive
                  ? 'bg-[#E85D04] text-white'
                  : 'bg-[#0A0A0A] border border-white/10 text-white/50 hover:text-white hover:border-white/30'
              }`}
              aria-pressed={isActive}
            >
              {locale === 'es' ? ZONE_LABELS[zone].es : ZONE_LABELS[zone].en}
            </button>
          )
        })}
      </div>

      {/* Floor canvas */}
      <div className="relative bg-[#1A1A1A] border border-white/10 rounded-2xl overflow-hidden">
        {/* Warm "wood floor" wash to evoke the venue plan without a heavy image */}
        <div
          className="absolute inset-0 opacity-[0.5] pointer-events-none"
          style={{
            background:
              'repeating-linear-gradient(90deg, #2a1c10 0px, #2a1c10 2px, #241609 2px, #241609 46px), linear-gradient(160deg, rgba(232,93,4,0.08), transparent 60%)',
          }}
          aria-hidden="true"
        />

        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#1A1A1A]/70 backdrop-blur-sm">
            <Loader2 className="w-6 h-6 text-[#E85D04] animate-spin" />
          </div>
        )}

        <div className="relative w-full aspect-[16/10] min-h-[320px] sm:min-h-[380px]">
          {zoneTables.map((table) => {
            const selected = table.id === selectedTableId
            const tooSmall = table.available && table.seats < guestCount
            return (
              <button
                key={table.id}
                type="button"
                onClick={() => handleTableClick(table)}
                disabled={!table.available}
                aria-pressed={selected}
                aria-label={`${table.label} — ${table.seats} ${
                  locale === 'es' ? 'personas' : 'seats'
                }${
                  table.available
                    ? ''
                    : table.reason === 'blocked'
                      ? locale === 'es'
                        ? ' — no disponible'
                        : ' — unavailable'
                      : locale === 'es'
                        ? ' — reservada'
                        : ' — reserved'
                }`}
                title={
                  tooSmall
                    ? locale === 'es'
                      ? `Capacidad ${table.seats} — menor a tu grupo`
                      : `Seats ${table.seats} — smaller than your party`
                    : undefined
                }
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center font-bold transition-all duration-150 ${
                  table.shape === 'rect'
                    ? 'w-16 h-11 sm:w-20 sm:h-12'
                    : 'w-12 h-12 sm:w-14 sm:h-14'
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
                  <Users className="w-2.5 h-2.5" />
                  {table.seats}
                </span>
              </button>
            )
          })}

          {!loading && zoneTables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white/30 text-sm">
                {t({ es: 'Sin mesas en esta zona.', en: 'No tables in this zone.' })}
              </p>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Legend + count */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-[#2E7D32] border border-[#4CAF50]/60 inline-block" />
          {t({ es: 'Disponible', en: 'Available' })}
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-[#3a1414] border border-red-900/50 inline-block" />
          {t({ es: 'Ocupada', en: 'Taken' })}
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-[#E85D04] inline-block" />
          {t({ es: 'Tu mesa', en: 'Your table' })}
        </span>
        <span className="ml-auto text-white/40">
          {availableCount}{' '}
          {t({ es: 'mesas libres', en: 'tables free' })}
        </span>
      </div>

      {/* Selection confirmation */}
      {selectedTableId && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-[#E85D04]/10 border border-[#E85D04]/30 rounded-xl p-4"
        >
          <div className="w-9 h-9 bg-[#E85D04] flex items-center justify-center flex-shrink-0">
            <Check className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-white">
            {(() => {
              const sel = tables.find((tb) => tb.id === selectedTableId)
              if (!sel) return null
              const zoneLabel =
                locale === 'es' ? ZONE_LABELS[sel.zone].es : ZONE_LABELS[sel.zone].en
              return t({
                es: `Mesa ${sel.label} · ${zoneLabel} · ${sel.seats} personas`,
                en: `Table ${sel.label} · ${zoneLabel} · seats ${sel.seats}`,
              })
            })()}
          </p>
        </motion.div>
      )}
    </div>
  )
}
