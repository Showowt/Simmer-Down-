'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, ChefHat, Package, Truck, Search, Phone, MapPin, ArrowLeft, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/lib/types'
import Link from 'next/link'

const statusSteps = [
  { id: 'pending', label: 'Placed', icon: Clock },
  { id: 'in_progress', label: 'Preparing', icon: ChefHat },
  { id: 'ready', label: 'Ready', icon: Package },
  { id: 'delivered', label: 'Delivered', icon: Truck },
]

function OrderTracker() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id')
  const orderNumber = searchParams.get('number')
  const isDemo = searchParams.get('demo')

  const [order, setOrder] = useState<Order | null>(null)
  const [searchId, setSearchId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId)
    }
  }, [orderId])

  const fetchOrder = async (id: string) => {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (err) {
      setError('Order not found')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchId.trim()) {
      fetchOrder(searchId.trim())
    }
  }

  const currentStepIndex = order
    ? statusSteps.findIndex((s) => s.id === order.status)
    : -1

  // Get items from either items_json or items
  const getOrderItems = (order: Order) => {
    if (order.items_json && Array.isArray(order.items_json)) {
      return order.items_json
    }
    if (order.items && Array.isArray(order.items)) {
      return order.items
    }
    return []
  }

  // Demo success state
  if (isDemo && !order) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-32">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Order Placed!</h1>
            <p className="text-zinc-400 mb-8">
              Thank you for your order. We&apos;ll start preparing your pizza right away!
            </p>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 text-left mb-8">
              <p className="text-sm text-orange-300">
                <strong>Demo Mode:</strong> This is a demo order. Your order has been recorded in the system.
              </p>
            </div>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-full font-semibold transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Menu
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-32">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Track Your Order</h1>
          <p className="text-zinc-500 mb-8">Enter your order ID or number to see the status</p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter your order ID"
                  className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition"
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                Track
              </button>
            </div>
          </form>
        </motion.div>

        {loading && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-zinc-500 mt-4">Loading order...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Success Header */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Order Confirmed!</h2>
                <p className="text-zinc-400 text-sm">Order #{order.order_number || order.id.slice(0, 8)}</p>
              </div>
            </div>

            {/* Order Status */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-zinc-500">Status</p>
                  <p className="font-medium text-white capitalize">{order.status.replace('_', ' ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-500">Estimated</p>
                  <p className="font-medium text-white">30-45 min</p>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="relative">
                <div className="absolute top-5 left-0 right-0 h-1 bg-zinc-800 rounded">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded transition-all duration-500"
                    style={{
                      width: `${Math.max(0, (currentStepIndex / (statusSteps.length - 1)) * 100)}%`,
                    }}
                  />
                </div>

                <div className="relative flex justify-between">
                  {statusSteps.map((step, index) => {
                    const Icon = step.icon
                    const isActive = index <= currentStepIndex
                    const isCurrent = index === currentStepIndex

                    return (
                      <div key={step.id} className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                            isActive
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                              : 'bg-zinc-800 text-zinc-500'
                          } ${isCurrent ? 'ring-4 ring-orange-500/20' : ''}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-xs mt-2 ${
                            isActive ? 'text-white font-medium' : 'text-zinc-600'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="font-semibold text-white mb-4">Order Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Customer</span>
                  <span className="text-white">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Phone</span>
                  <a href={`tel:${order.customer_phone}`} className="text-orange-400 hover:underline">
                    {order.customer_phone}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Type</span>
                  <span className="text-white">{order.is_delivery ? 'Delivery' : 'Pickup'}</span>
                </div>
                {order.delivery_address && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Address</span>
                    <span className="text-white text-right max-w-[200px]">{order.delivery_address}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-800 mt-4 pt-4">
                <h3 className="font-medium text-white mb-3">Items</h3>
                {getOrderItems(order).length > 0 ? (
                  getOrderItems(order).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-zinc-400">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-white">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))
                ) : order.items_description ? (
                  <p className="text-zinc-400 text-sm">{order.items_description}</p>
                ) : (
                  <p className="text-zinc-500 text-sm">No items data</p>
                )}
                <div className="border-t border-zinc-800 mt-3 pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="text-white">${(order.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Delivery</span>
                    <span className="text-white">${(order.delivery_fee || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span className="text-white">Total</span>
                    <span className="text-orange-400">${(order.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <Link
                  href="/menu"
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium text-center transition"
                >
                  Back to Menu
                </Link>
                <a
                  href="tel:+50322637890"
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium text-center transition flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Call
                </a>
              </div>
              <a
                href={`https://wa.me/50378901234?text=${encodeURIComponent(`Hola! Quisiera información sobre mi orden #${order.order_number || order.id.slice(0, 8)}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium text-center transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Chat via WhatsApp
              </a>
            </div>
          </motion.div>
        )}

        {!order && !loading && !error && !isDemo && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <Search className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">Enter your order ID to track your order</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 pt-32">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-zinc-800 rounded w-1/3" />
            <div className="h-12 bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    }>
      <OrderTracker />
    </Suspense>
  )
}
