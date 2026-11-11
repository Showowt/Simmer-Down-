'use client'

/**
 * Admin → Códigos Promo
 *
 * Create/edit the promo codes customers type at /checkout (card orders).
 * Percent or fixed $ discount, optional minimum order and expiry date.
 * Deactivating (never deleting) keeps printed/posted codes auditable.
 */

import { useEffect, useState } from 'react'
import {
  TicketPercent, Plus, Check, Loader2, RefreshCw, EyeOff, Trash2,
} from 'lucide-react'

interface PromoCode {
  id: string | null
  code: string
  description: string | null
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_order_amount: number | null
  expires_at: string | null
  is_active: boolean
  current_uses: number | null
  created_at?: string
}

const inputCls =
  'bg-[#1F1D1A] border border-[#3D3936] px-3 py-2 text-[#FFF8F0] text-sm focus:outline-none focus:border-[#FF6B35]'

function blankCode(): PromoCode {
  return {
    id: null,
    code: '',
    description: '',
    discount_type: 'percent',
    discount_value: 10,
    min_order_amount: null,
    expires_at: null,
    is_active: true,
    current_uses: 0,
  }
}

/** '2026-12-31' (date input) ⇄ ISO timestamp (API) */
const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '')
const toIso = (d: string) => (d ? new Date(`${d}T23:59:59-06:00`).toISOString() : null)

export default function AdminCodigosPage() {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/promo-codes', { cache: 'no-store' })
      const json = await res.json()
      if (res.ok) setCodes(json.data as PromoCode[])
      else setToast({ kind: 'err', text: json.message || 'Error al cargar' })
    } catch {
      setToast({ kind: 'err', text: 'Error de conexión' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const patch = (target: PromoCode, p: Partial<PromoCode>) =>
    setCodes((prev) => prev.map((c) => (c === target ? { ...c, ...p } : c)))

  const save = async (c: PromoCode) => {
    if (c.code.trim().length < 3) {
      setToast({ kind: 'err', text: 'El código necesita al menos 3 caracteres' })
      return
    }
    const key = c.id ?? 'new'
    setBusyKey(key)
    try {
      const payload = {
        code: c.code.trim().toUpperCase(),
        description: c.description?.trim() || null,
        discount_type: c.discount_type,
        discount_value: Number(c.discount_value),
        min_order_amount: c.min_order_amount != null ? Number(c.min_order_amount) : null,
        expires_at: c.expires_at,
        is_active: c.is_active,
      }
      const res = await fetch('/api/admin/promo-codes', {
        method: c.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c.id ? { id: c.id, ...payload } : payload),
      })
      const json = await res.json()
      if (!res.ok) setToast({ kind: 'err', text: json.message || 'Error al guardar' })
      else {
        setToast({ kind: 'ok', text: json.message || 'Guardado' })
        if (json.data && !c.id) patch(c, json.data as Partial<PromoCode>)
      }
    } catch {
      setToast({ kind: 'err', text: 'Error de conexión' })
    } finally {
      setBusyKey(null)
    }
  }

  const deactivate = async (c: PromoCode) => {
    if (!c.id) {
      setCodes((prev) => prev.filter((x) => x !== c))
      return
    }
    setBusyKey(c.id)
    try {
      const res = await fetch(`/api/admin/promo-codes?id=${c.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) setToast({ kind: 'err', text: json.message || 'Error' })
      else {
        patch(c, { is_active: false })
        setToast({ kind: 'ok', text: 'Código desactivado' })
      }
    } catch {
      setToast({ kind: 'err', text: 'Error de conexión' })
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#FFF8F0] flex items-center gap-2">
          <TicketPercent className="w-6 h-6 text-[#FF6B35]" /> Códigos Promo
        </h1>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 bg-[#252320] border border-[#3D3936] hover:border-[#FF6B35]/50 text-[#B8B0A8] px-4 py-2 text-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
          <button
            onClick={() => setCodes((prev) => [blankCode(), ...prev])}
            className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E85D04] text-white px-4 py-2 text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" /> Nuevo código
          </button>
        </div>
      </div>
      <p className="text-[#6B6560] text-sm mb-6">
        El cliente escribe el código al pagar con tarjeta en el sitio. Compártelos en WhatsApp,
        Instagram o volantes — por ejemplo <span className="text-[#FF8C42] font-mono">SIMMER10</span> para
        10% de descuento en pedidos en línea.
      </p>

      {toast && (
        <div
          className={`mb-5 px-4 py-3 text-sm border ${
            toast.kind === 'ok'
              ? 'bg-[#4CAF50]/10 border-[#4CAF50]/30 text-[#8FD694]'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {toast.text}
        </div>
      )}

      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-10 text-center">
          <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin mx-auto" />
        </div>
      ) : codes.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-10 text-center text-[#6B6560]">
          No hay códigos todavía. Crea el primero — ideas: SIMMER10 (10%), BIENVENIDO (envío con
          pedido mínimo), SIMMERLOVER (fijo $).
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map((c, idx) => {
            const key = c.id ?? `new-${idx}`
            const busy = busyKey === (c.id ?? 'new')
            return (
              <div
                key={key}
                className={`bg-[#252320] border p-4 ${c.is_active ? 'border-[#3D3936]' : 'border-[#3D3936] opacity-60'}`}
              >
                {!c.is_active && (
                  <div className="flex items-center gap-1.5 mb-3 text-[11px] font-bold uppercase tracking-wide text-[#F59E0B]">
                    <EyeOff className="w-3.5 h-3.5" /> Inactivo — los clientes no pueden usarlo
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-3">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Código</label>
                    <input
                      value={c.code}
                      onChange={(e) =>
                        patch(c, { code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })
                      }
                      placeholder="SIMMER10"
                      className={`${inputCls} w-full font-mono tracking-wider`}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Tipo</label>
                    <select
                      value={c.discount_type}
                      onChange={(e) => patch(c, { discount_type: e.target.value as 'percent' | 'fixed' })}
                      className={`${inputCls} w-full`}
                    >
                      <option value="percent">% Porcentaje</option>
                      <option value="fixed">$ Fijo</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">
                      {c.discount_type === 'percent' ? 'Descuento %' : 'Descuento $'}
                    </label>
                    <input
                      type="number"
                      min={0.01}
                      step={c.discount_type === 'percent' ? 1 : 0.01}
                      max={c.discount_type === 'percent' ? 100 : 1000}
                      value={c.discount_value}
                      onChange={(e) => patch(c, { discount_value: parseFloat(e.target.value) || 0 })}
                      className={`${inputCls} w-full`}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Pedido mínimo $</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={c.min_order_amount ?? ''}
                      onChange={(e) =>
                        patch(c, {
                          min_order_amount: e.target.value === '' ? null : parseFloat(e.target.value),
                        })
                      }
                      placeholder="Sin mínimo"
                      className={`${inputCls} w-full`}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">Vence</label>
                    <input
                      type="date"
                      value={toDateInput(c.expires_at)}
                      onChange={(e) => patch(c, { expires_at: toIso(e.target.value) })}
                      className={`${inputCls} w-full`}
                    />
                  </div>
                  <div className="md:col-span-9">
                    <label className="block text-[10px] text-[#6B6560] mb-1 uppercase">
                      Descripción (se muestra en el pedido)
                    </label>
                    <input
                      value={c.description ?? ''}
                      onChange={(e) => patch(c, { description: e.target.value })}
                      placeholder="Ej. 10% de descuento pedidos en línea"
                      className={`${inputCls} w-full`}
                    />
                  </div>
                  <div className="md:col-span-3 flex items-end">
                    <p className="text-xs text-[#6B6560] pb-2">
                      Usos: <span className="text-[#B8B0A8] tabular-nums">{c.current_uses ?? 0}</span>
                    </p>
                  </div>
                  <div className="md:col-span-12 flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={c.is_active}
                        onChange={(e) => patch(c, { is_active: e.target.checked })}
                        className="accent-[#FF6B35] w-4 h-4"
                      />
                      <span className={c.is_active ? 'text-[#8FD694] font-medium' : 'text-[#B8B0A8]'}>
                        {c.is_active ? 'Activo' : 'Activar'}
                      </span>
                    </label>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => save(c)}
                        disabled={busy}
                        className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E85D04] text-white px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
                      >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {c.id ? 'Guardar' : 'Crear'}
                      </button>
                      <button
                        onClick={() => deactivate(c)}
                        disabled={busy}
                        title={c.id ? 'Desactivar' : 'Quitar'}
                        className="flex items-center gap-2 border border-red-500/30 text-red-300 hover:bg-red-500/15 px-3 py-2 text-sm transition disabled:opacity-50"
                      >
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
