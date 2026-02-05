'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Eye, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/lib/types'

const statusOptions = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']

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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Orders</option>
            {statusOptions.map((status) => (
              <option key={status} value={status} className="capitalize">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={fetchOrders}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500">No orders yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
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
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm">{order.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-sm text-gray-500">{order.customer_phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize">{order.order_type}</td>
                    <td className="px-6 py-4 font-medium">${order.total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`text-sm font-medium rounded-lg px-3 py-1.5 border-0 cursor-pointer ${
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
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <Eye className="w-5 h-5 text-gray-500" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Order ID</p>
                  <p className="font-mono">{selectedOrder.id.slice(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="capitalize">{selectedOrder.order_type}</p>
                </div>
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p>{selectedOrder.customer_phone}</p>
                </div>
                {selectedOrder.customer_email && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Email</p>
                    <p>{selectedOrder.customer_email}</p>
                  </div>
                )}
                {selectedOrder.delivery_address && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Delivery Address</p>
                    <p>{selectedOrder.delivery_address}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-gray-500 text-sm mb-2">Items</p>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Delivery</span>
                      <span>${selectedOrder.delivery_fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-1">
                      <span>Total</span>
                      <span className="text-orange-500">${selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <p className="text-gray-500 text-sm mb-1">Notes</p>
                  <p className="bg-yellow-50 p-3 rounded-lg text-sm">{selectedOrder.notes}</p>
                </div>
              )}

              <div>
                <p className="text-gray-500 text-sm mb-2">Update Status</p>
                <div className="grid grid-cols-3 gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={() => updateStatus(selectedOrder.id, status)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition ${
                        selectedOrder.status === status
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
