'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, Sparkles, MessageCircle } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useI18n, translations } from '@/lib/i18n'

export default function CartPage() {
  const { t } = useI18n()
  const [mounted, setMounted] = useState(false)
  const { items, updateQuantity, removeItem, getSubtotal } = useCartStore()

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
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
  const deliveryFee = subtotal >= 25 ? 0 : subtotal > 0 ? 3.99 : 0
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
            <h1 className="font-display text-3xl text-[#FFF8F0] mb-4">{t(translations.cart.empty)}</h1>
            <p className="text-[#B8B0A8] mb-8 max-w-md mx-auto">
              {t(translations.cart.emptyDesc)}
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-8 py-4 font-semibold transition-colors min-h-[56px]"
            >
              {t(translations.cart.viewMenu)} <ArrowRight className="w-5 h-5" />
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
            {t(translations.cart.continueShopping)}
          </Link>
          <h1 className="font-display text-3xl text-[#FFF8F0]">{t(translations.cart.yourCart)}</h1>
          <p className="text-[#6B6560]">{items.length} {items.length !== 1 ? t(translations.cart.products) : t(translations.cart.product)}</p>
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
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <ShoppingBag className="w-6 h-6 text-[#6B6560]" />
                      <span className="text-[10px] text-[#6B6560] uppercase tracking-wider leading-tight text-center px-1">
                        {item.category}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#FFF8F0] truncate">{item.name}</h3>
                  <p className="text-[#FF6B35] font-bold">${item.price.toFixed(2)}</p>
                </div>

                <div className="flex items-center gap-2" role="group" aria-label={`${item.name}`}>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-10 h-10 bg-[#3D3936] hover:bg-[#4A4642] flex items-center justify-center transition text-[#FFF8F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] active:scale-95"
                    aria-label={`${t(translations.cart.reduce)} ${item.name}`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold text-[#FFF8F0]" aria-live="polite">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-10 h-10 bg-[#3D3936] hover:bg-[#4A4642] flex items-center justify-center transition text-[#FFF8F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] active:scale-95"
                    aria-label={`${t(translations.cart.increase)} ${item.name}`}
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
                    aria-label={`${t(translations.cart.remove)} ${item.name} ${t(translations.cart.removeFromCart)}`}
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
              <h2 className="font-display text-lg text-[#FFF8F0] mb-6">{t(translations.cart.orderSummary)}</h2>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#B8B0A8]">{t(translations.cart.subtotal)}</span>
                  <span className="text-[#FFF8F0] font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#B8B0A8]">{t(translations.cart.delivery)}</span>
                  <span className="text-[#FFF8F0] font-medium">
                    {deliveryFee > 0 ? `$${deliveryFee.toFixed(2)}` : '$0.00'}
                  </span>
                </div>
                {deliveryFee === 0 && subtotal >= 25 ? (
                  <p className="text-xs text-green-400">
                    Envio gratis en pedidos mayores a $25 / Free delivery on orders over $25
                  </p>
                ) : subtotal > 0 && subtotal < 25 ? (
                  <p className="text-xs text-[#6B6560]">
                    Envio gratis en pedidos mayores a $25 / Free delivery on orders over $25
                  </p>
                ) : null}
                <div className="border-t border-[#3D3936] pt-4 flex justify-between text-lg font-bold">
                  <span className="text-[#FFF8F0]">{t(translations.cart.total)}</span>
                  <span className="text-white">${total.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-6 w-full bg-[#25D366] hover:bg-[#20BD5A] text-white py-4 font-semibold flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-[#252320] active:scale-[0.98] min-h-[56px]"
              >
                <MessageCircle className="w-5 h-5" />
                {t(translations.cart.proceedToPayment)}
              </Link>

              {/* SimmerLovers upsell */}
              <div className="mt-6 p-4 bg-[#C9A84C]/10 border border-[#C9A84C]/20">
                <div className="flex items-center gap-2 text-[#C9A84C] text-sm font-medium mb-1">
                  <Sparkles className="w-4 h-4" />
                  SimmerLovers
                </div>
                <p className="text-[#B8B0A8] text-xs">
                  {t(translations.cart.earnPoints)} {Math.floor(total)} {t(translations.cart.pointsWithOrder)}
                  <Link href="/simmerlovers" className="text-[#C9A84C] hover:underline ml-1">
                    {t(translations.loyalty.joinFree)}
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
