'use client'

import { useEffect, useState } from 'react'
import { DollarSign, ShoppingBag, Clock, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/lib/types'

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.log('Demo mode - no orders')
    } finally {
      setLoading(false)
    }
  }

  const todayOrders = orders.filter((o) => {
    const today = new Date().toDateString()
    return new Date(o.created_at).toDateString() === today
  })

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0)
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed')
  const avgOrderValue = orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0

  const stats = [
    {
      label: "Today's Revenue",
      value: `$${todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      label: "Today's Orders",
      value: todayOrders.length,
      icon: ShoppingBag,
      color: 'bg-blue-500',
    },
    {
      label: 'Pending Orders',
      value: pendingOrders.length,
      icon: Clock,
      color: 'bg-orange-500',
    },
    {
      label: 'Avg Order Value',
      value: `$${avgOrderValue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ]

  const recentOrders = orders.slice(0, 5)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p>No orders yet</p>
            <p className="text-sm mt-1">Orders will appear here once customers start ordering</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="px-6 py-3 font-medium">Order ID</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Items</th>
                  <th className="px-6 py-3 font-medium">Total</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-sm text-gray-500">{order.customer_phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.items.length} items
                    </td>
                    <td className="px-6 py-4 font-medium">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${
                          order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : order.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-700'
                            : order.status === 'preparing'
                            ? 'bg-purple-100 text-purple-700'
                            : order.status === 'ready'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'delivered'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
