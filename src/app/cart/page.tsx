'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { useCartStore } from '@/store/cart'

export default function CartPage() {
  const [mounted, setMounted] = useState(false)
  const { items, updateQuantity, removeItem, getSubtotal } = useCartStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-32">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-zinc-800 w-1/4" />
            <div className="h-32 bg-zinc-800" />
          </div>
        </div>
      </div>
    )
  }

  const subtotal = getSubtotal()
  const deliveryFee = subtotal > 0 ? 3.99 : 0
  const total = subtotal + deliveryFee

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-32">
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-24 h-24 bg-zinc-900 flex items-center justify-center mx-auto mb-8">
              <ShoppingBag className="w-12 h-12 text-zinc-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Tu carrito está vacío</h1>
            <p className="text-zinc-500 mb-8 max-w-md mx-auto">
              Parece que aún no has agregado ninguna pizza deliciosa. ¡Vamos a arreglar eso!
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 font-semibold transition-colors min-h-[56px]"
            >
              Ver Menú <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-32 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Seguir Comprando
          </Link>
          <h1 className="text-3xl font-black text-white">Tu Carrito</h1>
          <p className="text-zinc-500">{items.length} producto{items.length !== 1 ? 's' : ''}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-900 border border-zinc-800 p-4 flex items-center gap-4"
              >
                <div className="w-24 h-24 bg-zinc-800 flex-shrink-0 overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      🍕
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{item.name}</h3>
                  <p className="text-orange-400 font-bold">${item.price.toFixed(2)}</p>
                </div>

                <div className="flex items-center gap-2" role="group" aria-label={`Quantity for ${item.name}`}>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition text-white focus:outline-none focus:ring-2 focus:ring-orange-500 active:scale-95"
                    aria-label={`Reducir cantidad de ${item.name}`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold text-white" aria-live="polite">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition text-white focus:outline-none focus:ring-2 focus:ring-orange-500 active:scale-95"
                    aria-label={`Aumentar cantidad de ${item.name}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="font-bold text-white">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-zinc-500 hover:text-red-400 mt-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-900 border border-zinc-800 p-6 sticky top-32"
            >
              <h2 className="text-lg font-bold text-white mb-6">Resumen del Pedido</h2>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Subtotal</span>
                  <span className="text-white font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Envío</span>
                  <span className="text-white font-medium">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-zinc-800 pt-4 flex justify-between text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-orange-400">${total.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white py-4 font-semibold flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-900 active:scale-[0.98] min-h-[56px]"
              >
                Proceder al Pago <ArrowRight className="w-5 h-5" />
              </Link>

              {/* SimmerLovers upsell */}
              <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center gap-2 text-orange-400 text-sm font-medium mb-1">
                  <Sparkles className="w-4 h-4" />
                  SimmerLovers
                </div>
                <p className="text-zinc-400 text-xs">
                  ¡Gana {Math.floor(total)} puntos con este pedido!
                  <Link href="/simmerlovers" className="text-orange-400 hover:underline ml-1">
                    Únete gratis
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
