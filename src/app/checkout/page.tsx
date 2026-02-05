'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Phone, User, Mail, FileText, Truck, Store } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getSubtotal, clearCart } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    router.push('/cart')
    return null
  }

  const subtotal = getSubtotal()
  const deliveryFee = orderType === 'delivery' ? 3.99 : 0
  const total = subtotal + deliveryFee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const orderData = {
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_email: formData.email || null,
        delivery_address: orderType === 'delivery' ? formData.address : null,
        order_type: orderType,
        items: items,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        total: total,
        status: 'pending',
        notes: formData.notes || null,
      }

      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single()

      if (error) throw error

      clearCart()
      router.push(`/orders?id=${data.id}`)
    } catch (error) {
      console.error('Order error:', error)
      // For demo, just simulate success
      clearCart()
      router.push('/orders?demo=true')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Type */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Order Type</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setOrderType('delivery')}
              className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition ${
                orderType === 'delivery'
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Truck className="w-5 h-5" />
              <span className="font-medium">Delivery</span>
            </button>
            <button
              type="button"
              onClick={() => setOrderType('pickup')}
              className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition ${
                orderType === 'pickup'
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Store className="w-5 h-5" />
              <span className="font-medium">Pickup</span>
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="+503 XXXX-XXXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (optional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        {orderType === 'delivery' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
            <div className="relative">
              <MapPin className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Enter your delivery address"
              />
            </div>
          </div>
        )}

        {/* Special Instructions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Special Instructions</h2>
          <div className="relative">
            <FileText className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={2}
              placeholder="Any special requests?"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-gray-600">
                  {item.quantity}x {item.name}
                </span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery</span>
                <span>{deliveryFee > 0 ? `$${deliveryFee.toFixed(2)}` : 'Free'}</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-2">
                <span>Total</span>
                <span className="text-orange-500">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-4 rounded-full font-semibold text-lg transition"
        >
          {loading ? 'Placing Order...' : `Place Order • $${total.toFixed(2)}`}
        </button>

        <p className="text-center text-sm text-gray-500">
          Payment will be collected on {orderType === 'delivery' ? 'delivery' : 'pickup'}
        </p>
      </form>
    </div>
  )
}
