'use client'

/**
 * Admin → Premios y Puntos (SimmerLovers loyalty control)
 *
 * Lets the owner set the welcome bonus + earn rate and fully manage the
 * rewards catalog (create / edit / activate / delete). Backed by
 * /api/admin/loyalty/config and /api/admin/loyalty/rewards.
 */

import { useCallback, useEffect, useState } from 'react'
import { Gift, Star, Plus, Trash2, Save, Loader2, Check } from 'lucide-react'

const REWARD_TYPES = [
  { value: 'free_item', label: 'Producto gratis' },
  { value: 'percent_discount', label: 'Descuento %' },
  { value: 'fixed_discount', label: 'Descuento $' },
] as const

const TIERS = [
  { value: 'bronze', label: 'Bronce' },
  { value: 'silver', label: 'Plata' },
  { value: 'gold', label: 'Oro' },
  { value: 'platinum', label: 'Platino' },
] as const

interface Reward {
  id: string
  name: string
  name_es: string
  points_required: number
  reward_type: string
  discount_percent: number | null
  discount_amount: number | null
  min_tier_required: string
  is_active: boolean
  display_order: number
}

type Draft = Omit<Reward, 'id'> & { id: string | null }

function blankDraft(order: number): Draft {
  return {
    id: null,
    name: '',
    name_es: '',
    points_required: 100,
    reward_type: 'free_item',
    discount_percent: null,
    discount_amount: null,
    min_tier_required: 'bronze',
    is_active: true,
    display_order: order,
  }
}

export default function AdminPremiosPage() {
  const [welcomePoints, setWelcomePoints] = useState<number>(50)
  const [pointsPerDollar, setPointsPerDollar] = useState<number>(1)
  const [savingConfig, setSavingConfig] = useState(false)

  const [rewards, setRewards] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cfgRes, rwRes] = await Promise.all([
        fetch('/api/admin/loyalty/config'),
        fetch('/api/admin/loyalty/rewards'),
      ])
      const cfg = await cfgRes.json()
      const rw = await rwRes.json()
      if (cfgRes.ok && cfg.data) {
        setWelcomePoints(cfg.data.welcomePoints)
        setPointsPerDollar(cfg.data.pointsPerDollar)
      }
      if (rwRes.ok) {
        setRewards((rw.data as Reward[]).map((r) => ({ ...r })))
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

  const saveConfig = async () => {
    setSavingConfig(true)
    try {
      const res = await fetch('/api/admin/loyalty/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ welcomePoints, pointsPerDollar }),
      })
      const json = await res.json()
      setToast(res.ok ? { kind: 'ok', text: 'Configuración guardada' } : { kind: 'err', text: json.message || 'Error' })
    } catch {
      setToast({ kind: 'err', text: 'Error de conexión' })
    } finally {
      setSavingConfig(false)
    }
  }

  const patchLocal = (idx: number, patch: Partial<Draft>) => {
    setRewards((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const saveReward = async (idx: number) => {
    const r = rewards[idx]
    if (!r.name_es.trim() || !r.name.trim()) {
      setToast({ kind: 'err', text: 'Nombre (ES e EN) requerido' })
      return
    }
    const key = r.id ?? `new-${idx}`
    setSavingId(key)
    try {
      const isNew = !r.id
      const res = await fetch('/api/admin/loyalty/rewards', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isNew
            ? {
                name: r.name, name_es: r.name_es, points_required: r.points_required,
                reward_type: r.reward_type, discount_percent: r.discount_percent,
                discount_amount: r.discount_amount, min_tier_required: r.min_tier_required,
                is_active: r.is_active, display_order: r.display_order,
              }
            : {
                id: r.id, name: r.name, name_es: r.name_es, points_required: r.points_required,
                reward_type: r.reward_type, discount_percent: r.discount_percent,
                discount_amount: r.discount_amount, min_tier_required: r.min_tier_required,
                is_active: r.is_active, display_order: r.display_order,
              },
        ),
      })
      const json = await res.json()
      if (!res.ok) {
        setToast({ kind: 'err', text: json.message || 'Error al guardar' })
      } else {
        if (json.data?.id && !r.id) patchLocal(idx, { id: json.data.id })
        setToast({ kind: 'ok', text: 'Premio guardado' })
      }
    } catch {
      setToast({ kind: 'err', text: 'Error de conexión' })
    } finally {
      setSavingId(null)
    }
  }

  const deleteReward = async (idx: number) => {
    const r = rewards[idx]
    if (!r.id) {
      setRewards((prev) => prev.filter((_, i) => i !== idx))
      return
    }
    setSavingId(r.id)
    try {
      const res = await fetch(`/api/admin/loyalty/rewards?id=${r.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        setToast({ kind: 'err', text: json.message || 'Error al eliminar' })
      } else {
        setToast({ kind: 'ok', text: json.message || 'Premio eliminado' })
        if (json.data?.softDeleted) {
          patchLocal(idx, { is_active: false })
        } else {
          setRewards((prev) => prev.filter((_, i) => i !== idx))
        }
      }
    } catch {
      setToast({ kind: 'err', text: 'Error de conexión' })
    } finally {
      setSavingId(null)
    }
  }

  const addReward = () => {
    setRewards((prev) => [...prev, blankDraft(prev.length + 1)])
  }

  const inputCls =
    'bg-[#1F1D1A] border border-[#3D3936] px-3 py-2 text-[#FFF8F0] text-sm focus:outline-none focus:border-[#FF6B35]'

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Gift className="w-6 h-6 text-[#FF6B35]" />
        <h1 className="text-2xl font-bold text-[#FFF8F0]">Premios y Puntos</h1>
      </div>

      {toast && (
        <div className={`mb-5 px-4 py-3 text-sm border ${toast.kind === 'ok' ? 'bg-[#4CAF50]/10 border-[#4CAF50]/30 text-[#8FD694]' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {toast.text}
        </div>
      )}

      {/* Config */}
      <div className="bg-[#252320] border border-[#3D3936] p-5 mb-6">
        <h2 className="text-lg font-semibold text-[#FFF8F0] flex items-center gap-2 mb-1">
          <Star className="w-5 h-5 text-[#FF6B35]" /> Configuración de puntos
        </h2>
        <p className="text-[#6B6560] text-sm mb-4">Estos valores aplican a todos los SimmerLovers.</p>
        <div className="flex flex-wrap gap-6 items-end">
          <div>
            <label className="block text-xs text-[#6B6560] mb-1.5 uppercase tracking-wider">Puntos de bienvenida</label>
            <input
              type="number" min={0}
              value={welcomePoints}
              onChange={(e) => setWelcomePoints(Math.max(0, parseInt(e.target.value) || 0))}
              className={`${inputCls} w-40`}
            />
            <p className="text-xs text-[#6B6560] mt-1">Al registrarse un nuevo miembro.</p>
          </div>
          <div>
            <label className="block text-xs text-[#6B6560] mb-1.5 uppercase tracking-wider">Puntos por $1 gastado</label>
            <input
              type="number" min={0} step="0.1"
              value={pointsPerDollar}
              onChange={(e) => setPointsPerDollar(Math.max(0, parseFloat(e.target.value) || 0))}
              className={`${inputCls} w-40`}
            />
            <p className="text-xs text-[#6B6560] mt-1">Tasa base de acumulación.</p>
          </div>
          <button
            onClick={saveConfig}
            disabled={savingConfig}
            className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E85D04] text-white px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50"
          >
            {savingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>

      {/* Rewards */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-[#FFF8F0] flex items-center gap-2">
          <Gift className="w-5 h-5 text-[#FF6B35]" /> Catálogo de premios
        </h2>
        <button
          onClick={addReward}
          className="flex items-center gap-2 bg-[#252320] border border-[#3D3936] hover:border-[#FF6B35]/50 text-[#B8B0A8] px-4 py-2 text-sm transition"
        >
          <Plus className="w-4 h-4" /> Agregar premio
        </button>
      </div>

      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin mx-auto" />
        </div>
      ) : rewards.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-10 text-center text-[#6B6560]">
          No hay premios. Agrega el primero.
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map((r, idx) => {
            const busy = savingId === (r.id ?? `new-${idx}`)
            return (
              <div key={r.id ?? `new-${idx}`} className={`bg-[#252320] border p-4 ${r.is_active ? 'border-[#3D3936]' : 'border-[#3D3936] opacity-60'}`}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-3">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Nombre (ES)</label>
                    <input value={r.name_es} onChange={(e) => patchLocal(idx, { name_es: e.target.value })} className={`${inputCls} w-full`} placeholder="Bebida Gratis" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Nombre (EN)</label>
                    <input value={r.name} onChange={(e) => patchLocal(idx, { name: e.target.value })} className={`${inputCls} w-full`} placeholder="Free Drink" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Puntos</label>
                    <input type="number" min={1} value={r.points_required} onChange={(e) => patchLocal(idx, { points_required: Math.max(1, parseInt(e.target.value) || 1) })} className={`${inputCls} w-full`} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Tipo</label>
                    <select value={r.reward_type} onChange={(e) => patchLocal(idx, { reward_type: e.target.value })} className={`${inputCls} w-full`}>
                      {REWARD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Nivel mínimo</label>
                    <select value={r.min_tier_required} onChange={(e) => patchLocal(idx, { min_tier_required: e.target.value })} className={`${inputCls} w-full`}>
                      {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  {r.reward_type === 'percent_discount' && (
                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Descuento %</label>
                      <input type="number" min={0} max={100} value={r.discount_percent ?? ''} onChange={(e) => patchLocal(idx, { discount_percent: e.target.value === '' ? null : parseInt(e.target.value) })} className={`${inputCls} w-full`} />
                    </div>
                  )}
                  {r.reward_type === 'fixed_discount' && (
                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Descuento $</label>
                      <input type="number" min={0} step="0.01" value={r.discount_amount ?? ''} onChange={(e) => patchLocal(idx, { discount_amount: e.target.value === '' ? null : parseFloat(e.target.value) })} className={`${inputCls} w-full`} />
                    </div>
                  )}

                  <div className="md:col-span-12 flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 text-sm text-[#B8B0A8] cursor-pointer">
                      <input type="checkbox" checked={r.is_active} onChange={(e) => patchLocal(idx, { is_active: e.target.checked })} className="accent-[#FF6B35] w-4 h-4" />
                      {r.is_active ? 'Activo' : 'Inactivo'}
                    </label>
                    <div className="ml-auto flex items-center gap-2">
                      <button onClick={() => saveReward(idx)} disabled={busy} className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E85D04] text-white px-4 py-2 text-sm font-semibold transition disabled:opacity-50">
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {r.id ? 'Guardar' : 'Crear'}
                      </button>
                      <button onClick={() => deleteReward(idx)} disabled={busy} className="flex items-center gap-2 border border-red-500/30 text-red-300 hover:bg-red-500/15 px-3 py-2 text-sm transition disabled:opacity-50">
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
