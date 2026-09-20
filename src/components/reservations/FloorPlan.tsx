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
// Availability (green / red) is computed server-side; the party-size and
// min_party rules below MIRROR the server guard — they never gate business:
// when nothing is selectable the parent drops the table requirement.
// ═══════════════════════════════════════════════════════════════

/** What the parent form needs to know to decide whether a table is required. */
export interface FloorPlanState {
  /** The venue has at least one active area with tables. */
  hasMap: boolean
  /** Tables free at the requested time, ignoring party size. */
  availableCount: number
  /** Tables free AND able to host this party (seats + area min_party). */
  selectableCount: number
  /** Largest seat count among the free tables (0 when none are free). */
  maxSeats: number
  /** The availability read failed — the parent keeps the section visible. */
  loadError: boolean
}

const EMPTY_STATE: FloorPlanState = {
  hasMap: false, availableCount: 0, selectableCount: 0, maxSeats: 0, loadError: false,
}

interface FloorPlanProps {
  locationId: string
  date: string | null
  time: string | null
  guestCount: number
  selectedTableId: string | null
  onSelectTable: (table: TableAvailability | null, areaName: string | null) => void
  onStateChange?: (state: FloorPlanState) => void
  /** Bumped by the parent to force a re-read of availability (e.g. after a 409). */
  refreshToken?: number
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

/**
 * Owner-entered image URLs are injected into a CSS `background-image`, so only
 * a plain https URL with no quote/paren/backslash characters is ever emitted.
 * Anything else falls back to the gradient.
 */
function safeBackgroundImage(url: string | null): string | undefined {
  if (!url) return undefined
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return undefined
  }
  if (parsed.protocol !== 'https:') return undefined
  const href = parsed.href
  if (/["'()\\\s]/.test(href)) return undefined
  return `url("${href}")`
}

/** Why this table cannot be picked right now — null when it can. */
function blockedReason(
  table: TableAvailability,
  minParty: number | null,
  guestCount: number,
  locale: string,
): string | null {
  if (!table.available) {
    return locale === 'es' ? 'Mesa ocupada a esa hora' : 'Taken at that time'
  }
  if (table.seats < guestCount) {
    return locale === 'es' ? `Para hasta ${table.seats} personas` : `Seats up to ${table.seats}`
  }
  if (minParty && guestCount < minParty) {
    return locale === 'es' ? `Mínimo ${minParty} personas` : `Minimum ${minParty} guests`
  }
  return null
}

function isSelectable(table: TableAvailability, minParty: number | null, guestCount: number): boolean {
  return table.available && table.seats >= guestCount && !(minParty && guestCount < minParty)
}

export default function FloorPlan({
  locationId, date, time, guestCount, selectedTableId, onSelectTable, onStateChange,
  refreshToken = 0, locale, t,
}: FloorPlanProps) {
  const [areas, setAreas] = useState<AreaWithTables[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [openAreaId, setOpenAreaId] = useState<string | null>(null)
  const [blockedNotice, setBlockedNotice] = useState('')

  // A venue change invalidates the whole map: drop the previous restaurant's
  // areas before the new read lands, so neither the render nor the upward
  // state report can ever describe another venue's tables.
  useEffect(() => {
    setAreas([])
    setLoaded(false)
    setOpenAreaId(null)
  }, [locationId])

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
          return
        }
        setAreas((json.areas ?? []) as AreaWithTables[])
      } catch (err) {
        if (cancelled || (err instanceof Error && err.name === 'AbortError')) return
        console.error('[FloorPlan] Availability read failed:', err)
        setError(locale === 'es' ? 'Error de conexión.' : 'Connection error.')
      } finally {
        if (!cancelled) {
          setLoading(false)
          setLoaded(true)
        }
      }
    }
    load()
    return () => { cancelled = true; controller.abort() }
  }, [locationId, date, time, locale, refreshToken])

  // Clear any "why not" notice when the inputs change.
  useEffect(() => { setBlockedNotice('') }, [guestCount, date, time, openAreaId])

  const openArea = useMemo(() => areas.find((a) => a.id === openAreaId) || null, [areas, openAreaId])

  const selectedEntry = useMemo(() => {
    for (const area of areas) {
      const table = area.tables.find((tb) => tb.id === selectedTableId)
      if (table) return { table, area }
    }
    return null
  }, [areas, selectedTableId])

  // Roll the whole map up into the state the form needs.
  const state = useMemo<FloorPlanState>(() => {
    if (areas.length === 0) return { ...EMPTY_STATE, loadError: error !== '' }
    let availableCount = 0
    let selectableCount = 0
    let maxSeats = 0
    for (const area of areas) {
      for (const table of area.tables) {
        if (!table.available) continue
        availableCount += 1
        if (table.seats > maxSeats) maxSeats = table.seats
        if (isSelectable(table, area.min_party, guestCount)) selectableCount += 1
      }
    }
    return { hasMap: true, availableCount, selectableCount, maxSeats, loadError: false }
  }, [areas, guestCount, error])

  // Report upward only once the first read has resolved, so the parent never
  // shows (then hides) the section on venues without a map.
  useEffect(() => {
    if (!loaded) return
    onStateChange?.(state)
  }, [loaded, state, onStateChange])

  // Drop the selection if the chosen table stops being selectable (refetch made
  // it unavailable, or the party grew past its capacity).
  useEffect(() => {
    if (!selectedTableId || areas.length === 0) return
    const entry = (() => {
      for (const area of areas) {
        const table = area.tables.find((tb) => tb.id === selectedTableId)
        if (table) return { table, area }
      }
      return null
    })()
    if (!entry || !isSelectable(entry.table, entry.area.min_party, guestCount)) {
      onSelectTable(null, null)
    }
  }, [areas, selectedTableId, guestCount, onSelectTable])

  const handleTableClick = useCallback((table: TableAvailability, area: AreaWithTables) => {
    const reason = blockedReason(table, area.min_party, guestCount, locale)
    if (reason) {
      setBlockedNotice(`${table.label} · ${reason}`)
      return
    }
    setBlockedNotice('')
    if (table.id === selectedTableId) {
      onSelectTable(null, null)
    } else {
      onSelectTable(table, localizedAreaName(area, locale))
    }
  }, [selectedTableId, onSelectTable, guestCount, locale])

  // Nothing is rendered until we know whether this venue has a map at all.
  if (!loaded) {
    return loading
      ? <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 text-[#E85D04] animate-spin" /></div>
      : null
  }
  if (areas.length === 0) {
    return (
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-center">
        <Info className="w-5 h-5 text-white/30 mx-auto mb-2" />
        <p className="text-white/40 text-sm">
          {error || t({ es: 'Este restaurante aún no tiene mapa de mesas.', en: 'This restaurant has no table map yet.' })}
        </p>
      </div>
    )
  }

  const partyTooLarge = state.availableCount > 0 && state.selectableCount === 0 && guestCount > state.maxSeats
  const fullHouse = state.availableCount === 0

  return (
    <div className="space-y-4">
      {(!date || !time) && (
        <p className="text-white/40 text-xs flex items-center gap-2">
          <Info className="w-3.5 h-3.5" />
          {t({ es: 'Elige fecha y hora para ver la disponibilidad exacta.', en: 'Pick a date and time for exact availability.' })}
        </p>
      )}

      {/* No table can be picked — say so, and never block the reservation. */}
      {(fullHouse || state.selectableCount === 0) && (
        <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-[#F5D47A] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-white/80">
            {fullHouse
              ? t({
                  es: 'No quedan mesas para esa hora — reserva y te asignamos mesa al llegar.',
                  en: "No tables are left for that time — book anyway and we'll assign your table on arrival.",
                })
              : partyTooLarge
                ? t({
                    es: `Ninguna mesa individual acomoda ${guestCount} personas — reserva y unimos mesas para tu grupo.`,
                    en: `No single table seats ${guestCount} — book anyway and we'll join tables for your group.`,
                  })
                : t({
                    es: 'Ninguna mesa libre aplica para tu grupo a esa hora — reserva y te asignamos mesa al llegar.',
                    en: "No free table fits your party at that time — book anyway and we'll assign your table on arrival.",
                  })}
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!openArea ? (
          <motion.div key="areas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {areas.map((area) => {
              const ViewIcon = viewIcon(area.view)
              const fitCount = area.tables.filter((tb) => isSelectable(tb, area.min_party, guestCount)).length
              const soldOut = area.availableCount === 0
              const bgImage = safeBackgroundImage(area.image_url)
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
                    style={bgImage ? { backgroundImage: bgImage, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
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
                      <span className={`text-xs font-medium ${fitCount === 0 ? 'text-red-400' : 'text-[#4CAF50]'}`}>
                        {soldOut
                          ? t({ es: 'Sin mesas libres', en: 'No tables free' })
                          : fitCount === 0
                            ? t({
                                es: `Sin mesas para ${guestCount} personas`,
                                en: `No tables for ${guestCount} guests`,
                              })
                            : `${fitCount} ${t({ es: 'mesas para tu grupo', en: 'tables for your party' })}`}
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
                  const reason = blockedReason(table, openArea.min_party, guestCount, locale)
                  const unfit = table.available && reason !== null
                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => handleTableClick(table, openArea)}
                      aria-pressed={selected}
                      aria-disabled={reason !== null}
                      aria-label={`${table.label} — ${table.seats} ${locale === 'es' ? 'personas' : 'seats'}${reason ? ` — ${reason}` : ''}`}
                      title={reason ?? undefined}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center font-bold transition-all duration-150 ${
                        table.shape === 'rect' ? 'w-16 h-11 sm:w-20 sm:h-12' : 'w-12 h-12 sm:w-14 sm:h-14'
                      } ${
                        selected
                          ? 'bg-[#E85D04] text-white ring-2 ring-[#F5D47A] ring-offset-2 ring-offset-[#1A1A1A] z-10 scale-110'
                          : unfit
                            ? 'bg-[#2E7D32]/25 text-white/50 border border-[#4CAF50]/25 cursor-not-allowed'
                            : table.available
                              ? 'bg-[#2E7D32] text-white border border-[#4CAF50]/60 hover:bg-[#388E3C] hover:scale-105'
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

            {blockedNotice && (
              <p className="text-xs text-[#F5D47A] mt-3">{blockedNotice}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50 mt-3">
              <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-[#2E7D32] border border-[#4CAF50]/60 inline-block" />{t({ es: 'Disponible', en: 'Available' })}</span>
              <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-[#2E7D32]/25 border border-[#4CAF50]/25 inline-block" />{t({ es: 'No aplica para tu grupo', en: 'Not for your party' })}</span>
              <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-[#3a1414] border border-red-900/50 inline-block" />{t({ es: 'Ocupada', en: 'Taken' })}</span>
              <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-[#E85D04] inline-block" />{t({ es: 'Tu mesa', en: 'Your table' })}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {selectedEntry && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-[#E85D04]/10 border border-[#E85D04]/30 rounded-xl p-4">
          <div className="w-9 h-9 bg-[#E85D04] flex items-center justify-center flex-shrink-0"><Check className="w-5 h-5 text-white" /></div>
          <p className="text-sm text-white">
            {t({
              es: `Mesa ${selectedEntry.table.label} · ${localizedAreaName(selectedEntry.area, 'es')} · ${selectedEntry.table.seats} personas`,
              en: `Table ${selectedEntry.table.label} · ${localizedAreaName(selectedEntry.area, 'en')} · seats ${selectedEntry.table.seats}`,
            })}
          </p>
        </motion.div>
      )}
    </div>
  )
}
