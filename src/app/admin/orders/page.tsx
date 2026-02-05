'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Eye, X, Phone, MapPin, FileText, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/lib/types'

const statusOptions = ['pending', 'in_progress', 'ready', 'delivered', 'cancelled']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchOrders()

    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel('orders')
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

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.log('Demo mode')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (error) throw error

      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: status as Order['status'] } : o)))
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: status as Order['status'] })
      }
    } catch (err) {
      console.error('Failed to update status')
    }
  }

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Progress'
      default: return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-zinc-500">{orders.length} total orders</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Orders</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>
          <button
            onClick={fetchOrders}
            className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition text-zinc-400"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-zinc-500">No orders yet</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
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
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition">
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
                      <span className={`text-sm font-medium ${order.is_delivery ? 'text-blue-400' : 'text-green-400'}`}>
                        {order.is_delivery ? 'Delivery' : 'Pickup'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">${(order.total || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`text-sm font-medium rounded-lg px-3 py-1.5 border cursor-pointer ${getStatusColor(order.status)} bg-transparent`}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status} className="bg-zinc-800 text-white">
                            {getStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 hover:bg-zinc-700 rounded-lg transition"
                      >
                        <Eye className="w-5 h-5 text-zinc-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Order Details</h2>
                <p className="text-sm text-zinc-500 font-mono">#{selectedOrder.order_number || selectedOrder.id.slice(0, 8)}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-400">Customer</h3>
                <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{selectedOrder.customer_name}</p>
                      <p className="text-sm text-zinc-500">{selectedOrder.is_delivery ? 'Delivery' : 'Pickup'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Phone className="w-4 h-4 text-zinc-500" />
                    <a href={`tel:${selectedOrder.customer_phone}`} className="hover:text-orange-400">
                      {selectedOrder.customer_phone}
                    </a>
                  </div>
                  {selectedOrder.delivery_address && (
                    <div className="flex items-start gap-2 text-zinc-300">
                      <MapPin className="w-4 h-4 text-zinc-500 mt-0.5" />
                      <span>{selectedOrder.delivery_address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-400">Items</h3>
                <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
                  {selectedOrder.items_json ? (
                    Array.isArray(selectedOrder.items_json) ? (
                      selectedOrder.items_json.map((item: { name: string; quantity: number; price: number }, i: number) => (
                        <div key={i} className="flex justify-between text-zinc-300">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-500">Items data format error</p>
                    )
                  ) : selectedOrder.items_description ? (
                    <p className="text-zinc-300">{selectedOrder.items_description}</p>
                  ) : (
                    <p className="text-zinc-500">No items data</p>
                  )}
                  <div className="border-t border-zinc-700 pt-3 mt-3 space-y-1">
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>Subtotal</span>
                      <span>${(selectedOrder.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>Delivery</span>
                      <span>${(selectedOrder.delivery_fee || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-white pt-2">
                      <span>Total</span>
                      <span className="text-orange-400">${(selectedOrder.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notes
                  </h3>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <p className="text-yellow-200 text-sm">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-400">Update Status</h3>
                <div className="grid grid-cols-3 gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={() => updateStatus(selectedOrder.id, status)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        selectedOrder.status === status
                          ? 'bg-orange-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                      }`}
                    >
                      {getStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <Clock className="w-3 h-3" />
                Order placed {new Date(selectedOrder.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
