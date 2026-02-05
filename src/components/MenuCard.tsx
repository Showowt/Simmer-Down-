'use client'

import { Plus } from 'lucide-react'
import { MenuItem } from '@/lib/types'
import { useCartStore } from '@/store/cart'

interface MenuCardProps {
  item: MenuItem
}

export default function MenuCard({ item }: MenuCardProps) {
  const addItem = useCartStore((state) => state.addItem)

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group">
      <div className="aspect-square relative bg-gray-100">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            🍕
          </div>
        )}
        {!item.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-full font-semibold">
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.description}</p>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-bold text-orange-500">
            ${item.price.toFixed(2)}
          </span>

          <button
            onClick={() => addItem(item)}
            disabled={!item.available}
            className="bg-black text-white p-2 rounded-full hover:bg-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
