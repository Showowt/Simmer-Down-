'use client'

import { useState } from 'react'
import { Plus, Check, Flame } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MenuItem } from '@/lib/types'
import { useCartStore } from '@/store/cart'

interface MenuCardProps {
  item: MenuItem
}

const categoryEmoji: Record<string, string> = {
  pizza: '🍕',
  sides: '🍟',
  drinks: '🥤',
  desserts: '🍰',
}

export default function MenuCard({ item }: MenuCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addItem(item)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all duration-300">
      {/* Image */}
      <div className="aspect-square relative bg-zinc-800 overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={`${item.name} - ${item.description}`}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <span className="text-6xl opacity-50">
              {categoryEmoji[item.category] || '🍽️'}
            </span>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Sold out overlay */}
        {!item.available && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
            <span className="bg-red-500/90 text-white px-4 py-2 rounded-full font-semibold text-sm">
              Sold Out
            </span>
          </div>
        )}

        {/* Quick add button - visible on mobile, hover on desktop */}
        {item.available && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ scale: 1.05 }}
            className="absolute bottom-4 right-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 shadow-lg shadow-orange-500/25 focus:outline-none focus:ring-2 focus:ring-orange-500 active:scale-95"
            onClick={handleAdd}
            aria-label={`Add ${item.name} to cart`}
          >
            <Plus className="w-4 h-4" />
            Add
          </motion.button>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-white truncate">{item.name}</h3>
            <p className="text-zinc-500 text-sm mt-1 line-clamp-2">{item.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-black text-orange-400">
            ${item.price.toFixed(2)}
          </span>

          <AnimatePresence mode="wait">
            {added ? (
              <motion.div
                key="added"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center"
              >
                <Check className="w-5 h-5 text-white" />
              </motion.div>
            ) : (
              <motion.button
                key="add"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={handleAdd}
                disabled={!item.available}
                className="w-10 h-10 bg-zinc-800 hover:bg-orange-500 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-900 active:scale-95"
                aria-label={`Add ${item.name} to cart`}
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
