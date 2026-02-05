'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/cart'

export default function CartPage() {
  const [mounted, setMounted] = useState(false)
  const { items, updateQuantity, removeItem, getSubtotal } = useCartStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  const subtotal = getSubtotal()
  const deliveryFee = subtotal > 0 ? 3.99 : 0
  const total = subtotal + deliveryFee

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
        <p className="text-gray-500 mb-8">Add some delicious pizza to get started!</p>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full font-semibold transition"
        >
          Browse Menu <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4"
            >
              <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    🍕
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                <p className="text-orange-500 font-medium">${item.price.toFixed(2)}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-600 mt-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery Fee</span>
                <span className="font-medium">${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-orange-500">${total.toFixed(2)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-full font-semibold flex items-center justify-center gap-2 transition"
            >
              Checkout <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/menu"
              className="mt-3 w-full block text-center text-gray-500 hover:text-gray-700 transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
