'use client'

/**
 * Admin → Fotos del Menú
 *
 * Every item from the live menu (src/lib/data.ts) with its effective photo.
 * Upload a new photo per item → stored in Supabase storage → override saved
 * → live on /carta within a minute. "Quitar" removes the override and falls
 * back to the static photo (or no photo).
 */

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Camera, Search, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { MENU_ITEMS, MENU_CATEGORIES } from '@/lib/data'
import ImageUpload from '@/components/admin/ImageUpload'

type Overrides = Record<string, string>

export default function AdminFotosPage() {
  const [overrides, setOverrides] = useState<Overrides>({})
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/menu/images')
      .then((r) => r.json())
      .then((d) => setOverrides(d.overrides || {}))
      .catch(() => setToast({ kind: 'err', text: 'No se pudieron cargar las fotos actuales' }))
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

  const byCategory = useMemo(() => {
    return MENU_CATEGORIES.map((cat) => ({
      cat,
      items: filtered.filter((i) => i.categoryId === cat.id),
    })).filter((g) => g.items.length > 0)
  }, [filtered])

  const missingCount = MENU_ITEMS.filter((i) => !i.image && !overrides[i.id]).length

  async function assign(itemId: string, url: string | null) {
    setSavingId(itemId)
    try {
      const res = url
        ? await fetch('/api/admin/menu-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId, imageUrl: url }),
          })
        : await fetch('/api/admin/menu-image', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId }),
          })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error')
      setOverrides((prev) => {
        const next = { ...prev }
        if (url) next[itemId] = url
        else delete next[itemId]
        return next
      })
      setToast({ kind: 'ok', text: url ? 'Foto asignada — visible en ~1 min' : 'Override eliminado' })
    } catch (err) {
      console.error('[AdminFotos]', err)
      setToast({ kind: 'err', text: 'Error al guardar la foto' })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Camera className="w-6 h-6 text-[#E85D04]" /> Fotos del Menú
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {missingCount > 0
              ? `${missingCount} platillos sin foto`
              : 'Todos los platillos tienen foto'}
            {' · '}Los cambios se ven en la carta en ~1 minuto
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

      <div className="space-y-10">
        {byCategory.map(({ cat, items }) => (
          <section key={cat.id}>
            <h2 className="text-white/80 font-medium mb-4 flex items-center gap-2">
              <span aria-hidden>{cat.icon}</span> {cat.nameEs}
              <span className="text-white/30 text-sm">({items.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => {
                const effective = overrides[item.id] || item.image
                const hasOverride = Boolean(overrides[item.id])
                return (
                  <div
                    key={item.id}
                    className="bg-[#111] border border-white/10 rounded-xl overflow-hidden"
                  >
                    <div className="relative aspect-[4/3] bg-[#0A0A0A]">
                      {effective ? (
                        <Image
                          src={effective}
                          alt={item.nameEs}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/25 text-sm gap-2">
                          <Camera className="w-8 h-8" />
                          Sin foto
                        </div>
                      )}
                      {hasOverride && (
                        <span className="absolute top-2 left-2 bg-[#E85D04] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          SUBIDA
                        </span>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-white font-medium leading-tight">{item.nameEs}</p>
                        <p className="text-white/30 text-xs font-mono mt-0.5">{item.id}</p>
                      </div>
                      <div className={savingId === item.id ? 'opacity-50 pointer-events-none' : ''}>
                        <ImageUpload
                          value={null}
                          folder={`menu-overrides/${item.id}`}
                          onChange={(url) => {
                            if (url) assign(item.id, url)
                          }}
                        />
                      </div>
                      {hasOverride && (
                        <button
                          onClick={() => assign(item.id, null)}
                          disabled={savingId === item.id}
                          className="flex items-center gap-1.5 text-xs text-red-400/80 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Quitar foto subida
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
    </div>
  )
}
