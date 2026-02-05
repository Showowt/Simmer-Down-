'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, X, Save, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MenuItem } from '@/lib/types'

const categories = ['pizza', 'sides', 'drinks', 'desserts'] as const

const emptyItem: Partial<MenuItem> = {
  name: '',
  description: '',
  price: 0,
  image_url: '',
  category: 'pizza',
  available: true,
}

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null)
  const [isNew, setIsNew] = useState(false)

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
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return

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
        <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
        <button
          onClick={() => {
            setEditingItem(emptyItem)
            setIsNew(true)
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500 mb-4">No menu items yet</p>
          <button
            onClick={() => {
              setEditingItem(emptyItem)
              setIsNew(true)
            }}
            className="text-orange-500 hover:underline"
          >
            Add your first item
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => {
            const categoryItems = groupedItems[category]
            if (categoryItems.length === 0) return null

            return (
              <div key={category}>
                <h2 className="text-lg font-semibold text-gray-900 capitalize mb-4">
                  {category}
                </h2>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="divide-y">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 flex items-center gap-4 ${
                          !item.available ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-500 truncate">{item.description}</p>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-orange-500">${item.price.toFixed(2)}</p>
                          <button
                            onClick={() => toggleAvailability(item)}
                            className={`text-xs ${
                              item.available ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {item.available ? 'Available' : 'Sold Out'}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(item)
                              setIsNew(false)
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {isNew ? 'Add Menu Item' : 'Edit Menu Item'}
              </h2>
              <button
                onClick={() => {
                  setEditingItem(null)
                  setIsNew(false)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={2}
                  placeholder="Item description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.price || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={editingItem.category || 'pizza'}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        category: e.target.value as MenuItem['category'],
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="capitalize">
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={editingItem.image_url || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={editingItem.available ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, available: e.target.checked })}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <label htmlFor="available" className="text-sm text-gray-700">
                  Available for ordering
                </label>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingItem(null)
                  setIsNew(false)
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={saveItem}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
