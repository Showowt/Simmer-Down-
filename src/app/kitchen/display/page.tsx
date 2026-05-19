'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { orderStatusLabel } from '@/lib/order-status'
import { PrintButton } from '@/components/receipt'

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

const KITCHEN_SESSION_KEY = 'simmerdown-kitchen-session'

interface KitchenSession {
  token: string
  locationId: string
  locationName: string
  exp: number
}

function getSession(): KitchenSession | null {
  try {
    const raw = localStorage.getItem(KITCHEN_SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as KitchenSession
    if (session.exp < Date.now()) {
      localStorage.removeItem(KITCHEN_SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrderItem {
  id: string
  order_id: string
  item_name: string
  unit_price: number
  quantity: number
  line_total: number
}

interface KitchenOrder {
  id: string
  order_number: string
  status: string
  order_type: string
  customer_name: string | null
  customer_phone: string | null
  customer_notes: string | null
  location_id: string
  subtotal: number
  delivery_fee: number | null
  total_amount: number
  created_at: string
  order_items: OrderItem[]
}

const ACTIVE_STATUSES = ['pending', 'confirmed', 'in_progress', 'preparing', 'ready'] as const

const STATUS_ACTIONS: Record<string, { next: string; label: string; bg: string; hover: string }> = {
  pending:   { next: 'confirmed', label: 'Confirmar',  bg: 'bg-blue-600',   hover: 'hover:bg-blue-700' },
  confirmed: { next: 'preparing', label: 'Preparar',   bg: 'bg-orange-600', hover: 'hover:bg-orange-700' },
  preparing: { next: 'ready',     label: 'Listo',      bg: 'bg-green-600',  hover: 'hover:bg-green-700' },
  ready:     { next: 'delivered', label: 'Entregado',  bg: 'bg-gray-600',   hover: 'hover:bg-gray-700' },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'hace un momento'
  if (mins === 1) return 'hace 1 min'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours === 1) return 'hace 1 hora'
  return `hace ${hours} horas`
}

function minutesElapsed(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000)
}

function borderColorClass(createdAt: string): string {
  const mins = minutesElapsed(createdAt)
  if (mins > 20) return 'border-red-500 animate-urgent-pulse'
  if (mins >= 10) return 'border-yellow-500'
  return 'border-green-500'
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// ---------------------------------------------------------------------------
// Sound
// ---------------------------------------------------------------------------

function playNotificationBeep() {
  try {
    const ctx = new AudioContext()
    const playTone = (startTime: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.3, startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
      osc.start(startTime)
      osc.stop(startTime + duration)
    }
    const now = ctx.currentTime
    playTone(now, 880, 0.15)
    playTone(now + 0.2, 1100, 0.2)
  } catch {
    // Web Audio not available
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function KitchenDisplayPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [session, setSession] = useState<KitchenSession | null>(null)
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [, setTick] = useState(0)

  const knownOrderIdsRef = useRef<Set<string>>(new Set())
  const isInitialLoadRef = useRef(true)

  // ── Auth check ──
  useEffect(() => {
    const s = getSession()
    if (!s) {
      router.replace('/kitchen/login')
      return
    }
    queueMicrotask(() => setSession(s))
  }, [router])

  const locationId = session?.locationId ?? ''

  // ── Fetch orders ──
  const fetchOrders = useCallback(async () => {
    if (!locationId) return

    const { data } = await supabase
      .from('orders')
      .select('id, order_number, status, order_type, customer_name, customer_phone, customer_notes, location_id, subtotal, delivery_fee, total_amount, created_at, order_items(id, order_id, item_name, unit_price, quantity, line_total)')
      .eq('location_id', locationId)
      .in('status', [...ACTIVE_STATUSES])
      .order('created_at', { ascending: false })

    if (data) {
      const typed = data as unknown as KitchenOrder[]

      if (!isInitialLoadRef.current && soundEnabled) {
        const newIds = typed.filter((o) => !knownOrderIdsRef.current.has(o.id))
        if (newIds.length > 0) playNotificationBeep()
      }

      knownOrderIdsRef.current = new Set(typed.map((o) => o.id))
      isInitialLoadRef.current = false
      setOrders(typed)
    }

    setLoading(false)
  }, [locationId, supabase, soundEnabled])

  useEffect(() => {
    if (!locationId) return
    queueMicrotask(() => {
      setLoading(true)
      isInitialLoadRef.current = true
      knownOrderIdsRef.current = new Set()
      fetchOrders()
    })
  }, [locationId, fetchOrders])

  // ── Realtime subscription ──
  useEffect(() => {
    if (!locationId) return

    const channel = supabase
      .channel(`kitchen-orders-${locationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `location_id=eq.${locationId}`,
      }, () => fetchOrders())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [locationId, supabase, fetchOrders])

  // ── Clock + time-ago ticker ──
  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 60_000)
    const tickInterval = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => { clearInterval(clockInterval); clearInterval(tickInterval) }
  }, [])

  // ── Status update ──
  async function handleStatusUpdate(orderId: string, newStatus: string) {
    setUpdatingOrderId(orderId)

    const updatePayload: Record<string, string> = { status: newStatus }
    if (newStatus === 'confirmed') updatePayload.confirmed_at = new Date().toISOString()
    if (newStatus === 'ready') updatePayload.ready_at = new Date().toISOString()
    if (newStatus === 'delivered') updatePayload.completed_at = new Date().toISOString()

    await supabase.from('orders').update(updatePayload).eq('id', orderId)

    if (newStatus === 'delivered') {
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
    } else {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
    }

    setUpdatingOrderId(null)
  }

  // ── Logout ──
  function handleLogout() {
    localStorage.removeItem(KITCHEN_SESSION_KEY)
    router.replace('/kitchen/login')
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-[#1F1D1A] flex flex-col">
      <style>{`
        @keyframes urgent-pulse {
          0%, 100% { border-color: #ef4444; box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { border-color: #f87171; box-shadow: 0 0 12px 4px rgba(239,68,68,0.25); }
        }
        .animate-urgent-pulse { animation: urgent-pulse 1.5s ease-in-out infinite; }
        @keyframes empty-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        .animate-empty-pulse { animation: empty-pulse 3s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1a1816] border-b border-[#3D3936] px-4 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <h1 className="text-xl font-bold text-[#FFF8F0] font-display">Cocina</h1>
            <span className="text-sm text-[#FF6B35] font-medium ml-1">
              {session.locationName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#2D2A26] border border-[#3D3936] px-3 py-1.5 text-sm">
              <span className="text-[#B8B0A8]">Pedidos:</span>
              <span className="font-bold text-[#FF6B35] text-lg">{orders.length}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 bg-[#2D2A26] border border-[#3D3936] px-3 py-1.5 text-sm text-[#B8B0A8]">
              {formatTime(currentTime)}
            </div>

            <button
              onClick={() => setSoundEnabled((s) => !s)}
              className={`px-3 py-1.5 text-sm border transition-colors ${
                soundEnabled
                  ? 'bg-[#2D2A26] border-green-600 text-green-400'
                  : 'bg-[#2D2A26] border-[#3D3936] text-[#666]'
              }`}
              title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm border border-[#3D3936] bg-[#2D2A26] text-[#6B6560] hover:text-red-400 hover:border-red-500/30 transition-colors"
              title="Cerrar sesión"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-[#B8B0A8] text-lg">Cargando pedidos...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <span className="text-6xl animate-empty-pulse">🍕</span>
            <p className="text-2xl text-[#B8B0A8] font-display">No hay pedidos activos</p>
            <p className="text-sm text-[#666]">{session.locationName}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => {
              const action = STATUS_ACTIONS[order.status]
              const items = Array.isArray(order.order_items) ? order.order_items : []
              const isDelivery = order.order_type === 'delivery'
              const isUpdating = updatingOrderId === order.id

              return (
                <div
                  key={order.id}
                  className={`bg-[#252320] border-l-4 ${borderColorClass(order.created_at)} flex flex-col`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between p-4 pb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-2xl font-bold text-[#FFF8F0] font-display">
                          #{order.order_number}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 uppercase tracking-wider ${
                          isDelivery ? 'bg-orange-600/20 text-orange-400' : 'bg-green-600/20 text-green-400'
                        }`}>
                          {isDelivery ? 'Delivery' : 'Pickup'}
                        </span>
                      </div>
                      <div className="text-xs text-[#B8B0A8] mt-0.5">
                        {orderStatusLabel(order.status)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-semibold ${
                        minutesElapsed(order.created_at) > 20 ? 'text-red-400'
                          : minutesElapsed(order.created_at) >= 10 ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}>
                        {timeAgo(order.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="px-4 pb-2 text-sm">
                    <div className="text-[#FFF8F0]">{order.customer_name || 'Cliente'}</div>
                    {order.customer_phone && (
                      <div className="text-[#B8B0A8] text-xs">{order.customer_phone}</div>
                    )}
                  </div>

                  {/* Items */}
                  <div className="px-4 pb-2 flex-1">
                    <div className="border-t border-[#3D3936] pt-2 space-y-1">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-[#FFF8F0]">
                            {item.item_name}
                            {item.quantity > 1 && (
                              <span className="text-[#FF6B35] font-semibold ml-1">x{item.quantity}</span>
                            )}
                          </span>
                          <span className="text-[#B8B0A8] shrink-0 ml-2">
                            ${item.line_total.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {order.customer_notes && (
                    <div className="mx-4 mb-2 px-3 py-2 bg-yellow-600/15 border border-yellow-600/30 text-yellow-300 text-xs">
                      <span className="font-semibold">Nota:</span> {order.customer_notes}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="border-t border-[#3D3936] p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-[#FFF8F0]">
                        ${order.total_amount.toFixed(2)}
                      </span>
                      <PrintButton
                        order={{
                          order_number: order.order_number,
                          created_at: order.created_at,
                          customer_name: order.customer_name || 'Cliente',
                          customer_phone: order.customer_phone || '',
                          order_type: order.order_type,
                          subtotal: order.subtotal,
                          delivery_fee: order.delivery_fee || 0,
                          total_amount: order.total_amount,
                        }}
                        items={items.map((i) => ({
                          item_name: i.item_name,
                          quantity: i.quantity,
                          unit_price: i.unit_price,
                          line_total: i.line_total,
                        }))}
                        locationName={session.locationName}
                        iconOnly
                      />
                    </div>

                    {action && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, action.next)}
                        disabled={isUpdating}
                        className={`px-5 py-2.5 text-sm font-bold text-white uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${action.bg} ${action.hover}`}
                      >
                        {isUpdating ? 'Actualizando...' : action.label}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
