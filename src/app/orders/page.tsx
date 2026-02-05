'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Clock, ChefHat, Package, Truck, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/lib/types'

const statusSteps = [
  { id: 'pending', label: 'Order Placed', icon: Clock },
  { id: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { id: 'preparing', label: 'Preparing', icon: ChefHat },
  { id: 'ready', label: 'Ready', icon: Package },
  { id: 'delivered', label: 'Delivered', icon: Truck },
]

function OrderTracker() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id')
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

  // Demo success state
  if (isDemo && !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Placed!</h1>
        <p className="text-gray-500 mb-8">
          Thank you for your order. We&apos;ll start preparing your pizza right away!
        </p>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-left">
          <p className="text-sm text-orange-800">
            <strong>Demo Mode:</strong> This is a demo order. Connect Supabase to enable real order tracking.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Track Your Order</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter your order ID"
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition"
          >
            Track
          </button>
        </div>
      </form>

      {loading && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">Loading order...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {order && (
        <div className="space-y-6">
          {/* Order Status */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-mono font-medium">{order.id.slice(0, 8)}...</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Estimated</p>
                <p className="font-medium">30-45 min</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="relative">
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded">
                <div
                  className="h-full bg-orange-500 rounded transition-all duration-500"
                  style={{
                    width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`,
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
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-orange-200' : ''}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-xs mt-2 ${
                          isActive ? 'text-gray-900 font-medium' : 'text-gray-400'
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
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold mb-4">Order Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer</span>
                <span>{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span>{order.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="capitalize">{order.order_type}</span>
              </div>
              {order.delivery_address && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Address</span>
                  <span className="text-right max-w-[200px]">{order.delivery_address}</span>
                </div>
              )}
            </div>

            <div className="border-t mt-4 pt-4">
              <h3 className="font-medium mb-2">Items</h3>
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-orange-500">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!order && !loading && !error && !isDemo && (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Enter your order ID to track your order</p>
        </div>
      )}
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-12 bg-gray-200 rounded" />
        </div>
      </div>
    }>
      <OrderTracker />
    </Suspense>
  )
}
