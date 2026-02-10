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
      <div className="min-h-screen bg-[#2D2A26] pt-32">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#3D3936] w-1/4" />
            <div className="h-32 bg-[#3D3936]" />
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
      <div className="min-h-screen bg-[#2D2A26] pt-32">
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-24 h-24 bg-[#252320] flex items-center justify-center mx-auto mb-8">
              <ShoppingBag className="w-12 h-12 text-[#6B6560]" />
            </div>
            <h1 className="font-display text-3xl text-[#FFF8F0] mb-4">Tu carrito está vacío</h1>
            <p className="text-[#B8B0A8] mb-8 max-w-md mx-auto">
              Parece que aún no has agregado ninguna pizza deliciosa. ¡Vamos a arreglar eso!
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-8 py-4 font-semibold transition-colors min-h-[56px]"
            >
              Ver Menú <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#2D2A26] pt-32 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-[#B8B0A8] hover:text-[#FFF8F0] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Seguir Comprando
          </Link>
          <h1 className="font-display text-3xl text-[#FFF8F0]">Tu Carrito</h1>
          <p className="text-[#6B6560]">{items.length} producto{items.length !== 1 ? 's' : ''}</p>
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
                className="bg-[#252320] border border-[#3D3936] p-4 flex items-center gap-4"
              >
                <div className="w-24 h-24 bg-[#3D3936] flex-shrink-0 overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl" aria-hidden="true">
                      🍕
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#FFF8F0] truncate">{item.name}</h3>
                  <p className="text-[#FF6B35] font-bold">${item.price.toFixed(2)}</p>
                </div>

                <div className="flex items-center gap-2" role="group" aria-label={`Cantidad de ${item.name}`}>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-10 h-10 bg-[#3D3936] hover:bg-[#4A4642] flex items-center justify-center transition text-[#FFF8F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] active:scale-95"
                    aria-label={`Reducir cantidad de ${item.name}`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold text-[#FFF8F0]" aria-live="polite">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-10 h-10 bg-[#3D3936] hover:bg-[#4A4642] flex items-center justify-center transition text-[#FFF8F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] active:scale-95"
                    aria-label={`Aumentar cantidad de ${item.name}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="font-bold text-[#FFF8F0]">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-[#6B6560] hover:text-[#C73E1D] mt-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
                    aria-label={`Eliminar ${item.name} del carrito`}
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
              className="bg-[#252320] border border-[#3D3936] p-6 sticky top-32"
            >
              <h2 className="font-display text-lg text-[#FFF8F0] mb-6">Resumen del Pedido</h2>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#B8B0A8]">Subtotal</span>
                  <span className="text-[#FFF8F0] font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#B8B0A8]">Envío</span>
                  <span className="text-[#FFF8F0] font-medium">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-[#3D3936] pt-4 flex justify-between text-lg font-bold">
                  <span className="text-[#FFF8F0]">Total</span>
                  <span className="text-white">${total.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-6 w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white py-4 font-semibold flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#252320] active:scale-[0.98] min-h-[56px]"
              >
                Proceder al Pago <ArrowRight className="w-5 h-5" />
              </Link>

              {/* SimmerLovers upsell */}
              <div className="mt-6 p-4 bg-[#FF6B35]/10 border border-[#FF6B35]/20">
                <div className="flex items-center gap-2 text-[#FF6B35] text-sm font-medium mb-1">
                  <Sparkles className="w-4 h-4" />
                  SimmerLovers
                </div>
                <p className="text-[#B8B0A8] text-xs">
                  ¡Gana {Math.floor(total)} puntos con este pedido!
                  <Link href="/simmerlovers" className="text-[#FF6B35] hover:underline ml-1">
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
