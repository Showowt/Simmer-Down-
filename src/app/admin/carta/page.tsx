'use client'

/**
 * Admin → Carta (precios y textos)
 *
 * Edits the live menu: price, availability, featured, ES/EN names and
 * descriptions. Changes save as overrides on top of the base catalog and
 * appear on the public site within ~1 minute. "Restaurar" reverts an item
 * to its original values.
 */

import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  UtensilsCrossed,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Star,
  Eye,
  EyeOff,
  Pencil,
} from 'lucide-react'
import { MENU_ITEMS, MENU_CATEGORIES, formatPrice } from '@/lib/data'
import type { MenuItemOverride, MenuItemOverrides } from '@/lib/menu-images'

interface EditState {
  price: string
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
}

export default function AdminCartaPage() {
  const [overrides, setOverrides] = useState<MenuItemOverrides>({})
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [edit, setEdit] = useState<EditState | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/menu/images')
      .then((r) => r.json())
      .then((d) => setOverrides(d.items || {}))
      .catch(() => setToast({ kind: 'err', text: 'No se pudieron cargar los datos actuales' }))
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return MENU_ITEMS
    return MENU_ITEMS.filter(
      (i) =>
        i.nameEs.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.id.includes(q),
    )
  }, [search])

  const byCategory = useMemo(
    () =>
      MENU_CATEGORIES.map((cat) => ({
        cat,
        items: filtered.filter((i) => i.categoryId === cat.id),
      })).filter((g) => g.items.length > 0),
    [filtered],
  )

  const save = useCallback(
    async (itemId: string, body: Partial<MenuItemOverride> & Record<string, unknown>) => {
      setSavingId(itemId)
      try {
        const res = await fetch('/api/admin/menu-item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, ...body }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Error')
        setOverrides((prev) => {
          const cur = { ...(prev[itemId] || {}) }
          if ('price' in body) cur.price = body.price as number | null
          if ('isAvailable' in body) cur.is_available = body.isAvailable as boolean | null
          if ('isFeatured' in body) cur.is_featured = body.isFeatured as boolean | null
          if ('nameEs' in body) cur.name_es = body.nameEs as string | null
          if ('nameEn' in body) cur.name_en = body.nameEn as string | null
          if ('descriptionEs' in body) cur.description_es = body.descriptionEs as string | null
          if ('descriptionEn' in body) cur.description_en = body.descriptionEn as string | null
          return { ...prev, [itemId]: cur }
        })
        setToast({ kind: 'ok', text: 'Guardado — visible en ~1 min' })
        return true
      } catch (err) {
        console.error('[AdminCarta]', err)
        setToast({ kind: 'err', text: 'Error al guardar' })
        return false
      } finally {
        setSavingId(null)
      }
    },
    [],
  )

  const reset = useCallback(async (itemId: string) => {
    setSavingId(itemId)
    try {
      const res = await fetch('/api/admin/menu-item', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      })
      if (!res.ok) throw new Error('Error')
      setOverrides((prev) => {
        const next = { ...prev }
        delete next[itemId]
        return next
      })
      setToast({ kind: 'ok', text: 'Valores originales restaurados' })
    } catch (err) {
      console.error('[AdminCarta]', err)
      setToast({ kind: 'err', text: 'Error al restaurar' })
    } finally {
      setSavingId(null)
    }
  }, [])

  function openEditor(itemId: string) {
    const item = MENU_ITEMS.find((i) => i.id === itemId)
    if (!item) return
    const o = overrides[itemId] || {}
    setEditingId(itemId)
    setEdit({
      price: String(o.price ?? item.basePrice),
      nameEs: o.name_es ?? item.nameEs ?? '',
      nameEn: o.name_en ?? item.name ?? '',
      descriptionEs: o.description_es ?? item.descriptionEs ?? '',
      descriptionEn: o.description_en ?? item.description ?? '',
    })
  }

  async function saveEditor() {
    if (!editingId || !edit) return
    const item = MENU_ITEMS.find((i) => i.id === editingId)
    if (!item) return
    const price = parseFloat(edit.price)
    if (!Number.isFinite(price) || price <= 0 || price >= 1000) {
      setToast({ kind: 'err', text: 'Precio inválido' })
      return
    }
    const ok = await save(editingId, {
      price: price === item.basePrice ? null : price,
      nameEs: edit.nameEs.trim() === item.nameEs ? null : edit.nameEs.trim(),
      nameEn: edit.nameEn.trim() === item.name ? null : edit.nameEn.trim(),
      descriptionEs:
        edit.descriptionEs.trim() === (item.descriptionEs ?? '') ? null : edit.descriptionEs.trim(),
      descriptionEn:
        edit.descriptionEn.trim() === (item.description ?? '') ? null : edit.descriptionEn.trim(),
    })
    if (ok) {
      setEditingId(null)
      setEdit(null)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-[#E85D04]" /> Carta — Precios y Textos
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Los cambios se ven en la carta pública en ~1 minuto · Para fotos usa la sección Fotos
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar platillo…"
            className="bg-[#111] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E85D04]/60 w-full sm:w-64"
          />
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${
            toast.kind === 'ok'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/90 border-red-500/40 text-red-200'
          }`}
        >
          {toast.kind === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      <div className="space-y-8">
        {byCategory.map(({ cat, items }) => (
          <section key={cat.id}>
            <h2 className="text-white/80 font-medium mb-3 flex items-center gap-2">
              <span aria-hidden>{cat.icon}</span> {cat.nameEs}
              <span className="text-white/30 text-sm">({items.length})</span>
            </h2>
            <div className="bg-[#111] border border-white/10 rounded-xl divide-y divide-white/5">
              {items.map((item) => {
                const o = overrides[item.id] || {}
                const price = o.price ?? item.basePrice
                const available = o.is_available ?? item.isAvailable
                const featured = o.is_featured ?? item.isFeatured
                const nameEs = o.name_es ?? item.nameEs
                const modified = Boolean(overrides[item.id] && Object.values(overrides[item.id]).some((v) => v != null))
                const busy = savingId === item.id
                return (
                  <div key={item.id} className={`p-4 ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex-1 min-w-[180px]">
                        <p className={`font-medium leading-tight ${available ? 'text-white' : 'text-white/35 line-through'}`}>
                          {nameEs}
                          {modified && (
                            <span className="ml-2 text-[10px] font-semibold text-[#E85D04] bg-[#E85D04]/10 border border-[#E85D04]/30 rounded-full px-2 py-0.5 align-middle">
                              MODIFICADO
                            </span>
                          )}
                        </p>
                        <p className="text-white/30 text-xs font-mono mt-0.5">{item.id}</p>
                      </div>

                      <span className="text-white font-semibold w-20 text-right">{formatPrice(price)}</span>

                      <button
                        onClick={() => save(item.id, { isAvailable: available ? false : null })}
                        title={available ? 'Ocultar de la carta' : 'Mostrar en la carta'}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          available
                            ? 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'
                            : 'border-white/15 text-white/40 hover:bg-white/5'
                        }`}
                      >
                        {available ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {available ? 'Visible' : 'Oculto'}
                      </button>

                      <button
                        onClick={() => save(item.id, { isFeatured: featured ? false : true })}
                        title="Destacado en la página principal"
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          featured
                            ? 'border-amber-400/40 text-amber-300 hover:bg-amber-400/10'
                            : 'border-white/15 text-white/40 hover:bg-white/5'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${featured ? 'fill-amber-300' : ''}`} />
                        {featured ? 'Destacado' : 'Normal'}
                      </button>

                      <button
                        onClick={() => openEditor(item.id)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/15 text-white/70 hover:border-[#E85D04]/50 hover:text-white transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>

                      {modified && (
                        <button
                          onClick={() => reset(item.id)}
                          title="Volver a los valores originales"
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-400/25 text-red-300/80 hover:bg-red-500/10 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Edit modal */}
      {editingId && edit && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setEditingId(null)}>
          <div
            className="bg-[#151515] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-semibold text-lg">
              Editar — {MENU_ITEMS.find((i) => i.id === editingId)?.nameEs}
            </h3>

            <label className="block">
              <span className="text-white/60 text-xs uppercase tracking-wide">Precio (USD)</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={edit.price}
                onChange={(e) => setEdit({ ...edit, price: e.target.value })}
                className="mt-1 w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E85D04]/60"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-white/60 text-xs uppercase tracking-wide">Nombre (ES)</span>
                <input
                  value={edit.nameEs}
                  onChange={(e) => setEdit({ ...edit, nameEs: e.target.value })}
                  className="mt-1 w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E85D04]/60"
                />
              </label>
              <label className="block">
                <span className="text-white/60 text-xs uppercase tracking-wide">Nombre (EN)</span>
                <input
                  value={edit.nameEn}
                  onChange={(e) => setEdit({ ...edit, nameEn: e.target.value })}
                  className="mt-1 w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E85D04]/60"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-white/60 text-xs uppercase tracking-wide">Descripción (ES)</span>
              <textarea
                rows={2}
                value={edit.descriptionEs}
                onChange={(e) => setEdit({ ...edit, descriptionEs: e.target.value })}
                className="mt-1 w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E85D04]/60"
              />
            </label>
            <label className="block">
              <span className="text-white/60 text-xs uppercase tracking-wide">Descripción (EN)</span>
              <textarea
                rows={2}
                value={edit.descriptionEn}
                onChange={(e) => setEdit({ ...edit, descriptionEn: e.target.value })}
                className="mt-1 w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E85D04]/60"
              />
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveEditor}
                disabled={savingId === editingId}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-[#E85D04] text-white hover:bg-[#E85D04]/85 transition-colors disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
