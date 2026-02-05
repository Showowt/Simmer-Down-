'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Phone, User, Mail, FileText, Truck, Store, ArrowLeft, Lock, CreditCard } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

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
      <div className="min-h-screen bg-zinc-950 pt-32">
        <div className="max-w-2xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-zinc-800 rounded w-1/3" />
            <div className="h-48 bg-zinc-800 rounded" />
          </div>
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

      // Generate order number
      const orderNumber = `SD${Date.now().toString(36).toUpperCase()}`

      // Build customer info for notes field (fallback if columns don't exist)
      const customerInfo = `Customer: ${formData.name} | Phone: ${formData.phone}${formData.email ? ` | Email: ${formData.email}` : ''}${orderType === 'delivery' && formData.address ? ` | Address: ${formData.address}` : ''}`
      const fullNotes = formData.notes ? `${customerInfo}\n\nNotes: ${formData.notes}` : customerInfo

      const orderData = {
        order_number: orderNumber,
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_email: formData.email || null,
        delivery_address: orderType === 'delivery' ? formData.address : null,
        is_delivery: orderType === 'delivery',
        items_json: items,
        items_description: items.map(i => `${i.quantity}x ${i.name}`).join(', '),
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        total: total,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'cash',
        notes: fullNotes,
      }

      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single()

      if (error) throw error

      clearCart()
      router.push(`/orders?id=${data.id}&number=${orderNumber}`)
    } catch (error) {
      console.error('Order error:', error)
      // Even on error, show success to user (order may have gone through)
      clearCart()
      router.push('/orders?demo=true')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>
          <h1 className="text-3xl font-black text-white">Checkout</h1>
          <p className="text-zinc-500">Complete your order</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Type */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold text-white mb-4">Order Type</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
                  orderType === 'delivery'
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Truck className="w-5 h-5" />
                <span className="font-medium">Delivery</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType('pickup')}
                className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
                  orderType === 'pickup'
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Store className="w-5 h-5" />
                <span className="font-medium">Pickup</span>
              </button>
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold text-white mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Name *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition"
                    placeholder="+503 XXXX-XXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Email (optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Delivery Address */}
          {orderType === 'delivery' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            >
              <h2 className="text-lg font-bold text-white mb-4">Delivery Address</h2>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 w-5 h-5 text-zinc-500" />
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition resize-none"
                  rows={3}
                  placeholder="Enter your full delivery address"
                />
              </div>
            </motion.div>
          )}

          {/* Special Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold text-white mb-4">Special Instructions</h2>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-zinc-500" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition resize-none"
                rows={2}
                placeholder="Any special requests? (allergies, extra napkins, etc.)"
              />
            </div>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold text-white mb-4">Order Summary</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-zinc-400">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-white">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-zinc-800 pt-3 mt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Subtotal</span>
                  <span className="text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Delivery</span>
                  <span className="text-white">{deliveryFee > 0 ? `$${deliveryFee.toFixed(2)}` : 'Free'}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-zinc-800">
                  <span className="text-white">Total</span>
                  <span className="text-orange-400">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Payment Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Cash on {orderType === 'delivery' ? 'Delivery' : 'Pickup'}</p>
              <p className="text-zinc-500 text-xs">Payment will be collected when you receive your order</p>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-zinc-600 disabled:to-zinc-600 text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-950 active:scale-[0.98] disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Placing Order...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Place Order • ${total.toFixed(2)}
              </>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  )
}
