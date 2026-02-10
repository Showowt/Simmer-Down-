'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, X, Save, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MenuItem } from '@/lib/types'
import ImageUpload from '@/components/admin/ImageUpload'

const categories = ['pizza', 'sides', 'drinks', 'desserts'] as const

const categoryLabels: Record<string, string> = {
  pizza: 'Pizzas',
  sides: 'Acompañamientos',
  drinks: 'Bebidas',
  desserts: 'Postres',
}

const emptyItem: Partial<MenuItem> = {
  name: '',
  description: '',
  price: 0,
  image_url: null,
  category: 'pizza',
  available: true,
}

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (err) {
      console.log('Demo mode')
    } finally {
      setLoading(false)
    }
  }

  const saveItem = async () => {
    if (!editingItem?.name || !editingItem?.price) return

    setSaving(true)
    try {
      const supabase = createClient()

      if (isNew) {
        const { data, error } = await supabase
          .from('menu_items')
          .insert([editingItem])
          .select()
          .single()

        if (error) throw error
        setItems([...items, data])
      } else {
        const { error } = await supabase
          .from('menu_items')
          .update(editingItem)
          .eq('id', editingItem.id)

        if (error) throw error
        setItems(items.map((i) => (i.id === editingItem.id ? { ...i, ...editingItem } as MenuItem : i)))
      }

      setEditingItem(null)
      setIsNew(false)
    } catch (err) {
      console.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('¿Eliminar este item?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from('menu_items').delete().eq('id', id)

      if (error) throw error
      setItems(items.filter((i) => i.id !== id))
    } catch (err) {
      console.error('Failed to delete')
    }
  }

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('menu_items')
        .update({ available: !item.available })
        .eq('id', item.id)

      if (error) throw error
      setItems(items.map((i) => (i.id === item.id ? { ...i, available: !i.available } : i)))
    } catch (err) {
      console.error('Failed to update')
    }
  }

  const groupedItems = categories.reduce((acc, cat) => {
    acc[cat] = items.filter((i) => i.category === cat)
    return acc
  }, {} as Record<string, MenuItem[]>)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#FFF8F0]">Menú</h1>
          <p className="text-[#6B6560]">Administra los items del menú</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(emptyItem)
            setIsNew(true)
          }}
          className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-4 py-2 font-medium flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          Nuevo Item
        </button>
      </div>

      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent mx-auto" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <p className="text-[#B8B0A8] mb-4">No hay items en el menú aún</p>
          <button
            onClick={() => {
              setEditingItem(emptyItem)
              setIsNew(true)
            }}
            className="text-[#FF6B35] hover:underline"
          >
            Agregar tu primer item
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => {
            const categoryItems = groupedItems[category]
            if (categoryItems.length === 0) return null

            return (
              <div key={category}>
                <h2 className="text-lg font-semibold text-[#FFF8F0] mb-4">
                  {categoryLabels[category]}
                </h2>
                <div className="bg-[#252320] border border-[#3D3936] overflow-hidden">
                  <div className="divide-y divide-[#3D3936]">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 flex items-center gap-4 ${
                          !item.available ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="w-16 h-16 bg-[#1F1D1A] flex-shrink-0 overflow-hidden">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-[#3D3936]" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[#FFF8F0]">{item.name}</h3>
                          <p className="text-sm text-[#6B6560] truncate">{item.description}</p>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-white">${item.price.toFixed(2)}</p>
                          <button
                            onClick={() => toggleAvailability(item)}
                            className={`text-xs font-medium ${
                              item.available ? 'text-[#4CAF50]' : 'text-red-400'
                            }`}
                          >
                            {item.available ? 'Disponible' : 'Agotado'}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(item)
                              setIsNew(false)
                            }}
                            className="p-2 hover:bg-[#3D3936] transition"
                          >
                            <Edit2 className="w-4 h-4 text-[#6B6560]" />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-2 hover:bg-red-500/10 transition"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252320] border border-[#3D3936] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#3D3936] flex items-center justify-between sticky top-0 bg-[#252320]">
              <h2 className="text-lg font-semibold text-[#FFF8F0]">
                {isNew ? 'Nuevo Item' : 'Editar Item'}
              </h2>
              <button
                onClick={() => {
                  setEditingItem(null)
                  setIsNew(false)
                }}
                className="p-2 hover:bg-[#3D3936]"
              >
                <X className="w-5 h-5 text-[#6B6560]" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="Margherita DOP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Descripción
                </label>
                <textarea
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none resize-none"
                  rows={2}
                  placeholder="Tomate San Marzano, mozzarella di bufala..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                    Precio *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.price || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                    placeholder="16.99"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                    Categoría
                  </label>
                  <select
                    value={editingItem.category || 'pizza'}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        category: e.target.value as MenuItem['category'],
                      })
                    }
                    className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Imagen
                </label>
                <ImageUpload
                  value={editingItem.image_url || null}
                  onChange={(url) => setEditingItem({ ...editingItem, image_url: url })}
                  folder="menu"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={editingItem.available ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, available: e.target.checked })}
                  className="w-4 h-4 accent-[#FF6B35]"
                />
                <label htmlFor="available" className="text-sm text-[#B8B0A8]">
                  Disponible para ordenar
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-[#3D3936] flex justify-end gap-3 sticky bottom-0 bg-[#252320]">
              <button
                onClick={() => {
                  setEditingItem(null)
                  setIsNew(false)
                }}
                className="px-4 py-2 text-[#B8B0A8] hover:bg-[#3D3936] transition"
              >
                Cancelar
              </button>
              <button
                onClick={saveItem}
                disabled={saving || !editingItem.name || !editingItem.price}
                className="bg-[#FF6B35] hover:bg-[#E55A2B] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 font-medium flex items-center gap-2 transition"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
