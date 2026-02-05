'use client'

import { useEffect, useState } from 'react'
import { DollarSign, ShoppingBag, Clock, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/lib/types'
import Link from 'next/link'

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()

    // Set up realtime subscription
    const supabase = createClient()
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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

  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'in_progress')
  const avgOrderValue = orders.length > 0 ? orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length : 0

  const stats = [
    {
      label: "Today's Revenue",
      value: `$${todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: "Today's Orders",
      value: todayOrders.length,
      icon: ShoppingBag,
      color: 'from-blue-500 to-cyan-500',
      trend: '+5%',
      trendUp: true,
    },
    {
      label: 'Pending Orders',
      value: pendingOrders.length,
      icon: Clock,
      color: 'from-orange-500 to-amber-500',
      trend: pendingOrders.length > 0 ? 'Active' : 'None',
      trendUp: null,
    },
    {
      label: 'Avg Order Value',
      value: `$${avgOrderValue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      trend: '+8%',
      trendUp: true,
    },
  ]

  const recentOrders = orders.slice(0, 5)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'in_progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'ready': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'delivered': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20'
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-500">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <Link
          href="/admin/orders"
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          View All Orders
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {stat.trendUp !== null && (
                  <span className={`flex items-center text-sm ${stat.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {stat.trend}
                  </span>
                )}
                {stat.trendUp === null && (
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">{stat.trend}</span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-zinc-500">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
          <span className="text-sm text-zinc-500">{orders.length} total orders</span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-medium">No orders yet</p>
            <p className="text-sm text-zinc-600 mt-1">Orders will appear here once customers start ordering</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-zinc-500 border-b border-zinc-800">
                  <th className="px-6 py-4 font-medium">Order</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-zinc-300">
                        #{order.order_number || order.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{order.customer_name}</p>
                        <p className="text-sm text-zinc-500">{order.customer_phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${order.is_delivery ? 'text-blue-400' : 'text-green-400'}`}>
                        {order.is_delivery ? 'Delivery' : 'Pickup'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      ${(order.total || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
