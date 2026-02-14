'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Gift,
  Flame,
  Clock,
  ShoppingBag,
  LogOut,
  Crown,
  Star,
  Edit2,
  Check,
  X,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Profile {
  id: string
  full_name: string
  phone: string | null
  address: string | null
  loyalty_points: number
  loyalty_tier: string
  total_orders: number
  total_spent: number
  birthday: string | null
  created_at: string
}

interface Order {
  id: string
  order_number: string
  total: number
  status: string
  created_at: string
}

const tierColors = {
  starter: 'bg-[#6B6560]',
  flame: 'bg-[#FF6B35]',
  inferno: 'bg-[#E55A2B]',
}

const tierIcons = {
  starter: Star,
  flame: Flame,
  inferno: Crown,
}

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', address: '' })
  const [saving, setSaving] = useState(false)

  const loadUserData = useCallback(async () => {
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    setUser({ id: user.id, email: user.email || '' })

    // Get profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
      setEditForm({
        full_name: profileData.full_name || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
      })
    }

    // Get recent orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, order_number, total, status, created_at')
      .eq('customer_email', user.email)
      .order('created_at', { ascending: false })
      .limit(5)

    if (ordersData) {
      setOrders(ordersData)
    }

    setLoading(false)
  }, [router])

  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editForm.full_name,
        phone: editForm.phone,
        address: editForm.address,
      })
      .eq('id', user.id)

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...editForm } : null)
      setEditing(false)
    }

    setSaving(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const getNextTierPoints = () => {
    if (!profile) return 0
    if (profile.loyalty_tier === 'starter') return 500 - profile.loyalty_points
    if (profile.loyalty_tier === 'flame') return 1500 - profile.loyalty_points
    return 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2D2A26] pt-32">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-40 bg-[#3D3936]" />
            <div className="h-64 bg-[#3D3936]" />
          </div>
        </div>
      </div>
    )
  }

  const TierIcon = profile ? tierIcons[profile.loyalty_tier as keyof typeof tierIcons] || Star : Star

  return (
    <div className="min-h-screen bg-[#2D2A26] pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl text-[#FFF8F0]">Mi Cuenta</h1>
          <p className="text-[#6B6560]">Gestiona tu perfil y revisa tu historial</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#252320] border border-[#3D3936] p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl text-[#FFF8F0]">Información Personal</h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 text-[#FF6B35] hover:text-[#E55A2B] text-sm font-medium transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-1 text-[#4CAF50] hover:text-[#45a049] text-sm font-medium transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex items-center gap-1 text-[#6B6560] hover:text-[#B8B0A8] text-sm font-medium transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#6B6560] mb-1">Nombre</label>
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      className="w-full px-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] focus:outline-none focus:border-[#FF6B35] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#6B6560] mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] focus:outline-none focus:border-[#FF6B35] transition"
                      placeholder="+503 XXXX-XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#6B6560] mb-1">Dirección</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full px-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] focus:outline-none focus:border-[#FF6B35] transition"
                      placeholder="Tu dirección de entrega"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-[#6B6560]" />
                    <div>
                      <p className="text-xs text-[#6B6560]">Nombre</p>
                      <p className="text-[#FFF8F0]">{profile?.full_name || 'No especificado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#6B6560]" />
                    <div>
                      <p className="text-xs text-[#6B6560]">Correo</p>
                      <p className="text-[#FFF8F0]">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-[#6B6560]" />
                    <div>
                      <p className="text-xs text-[#6B6560]">Teléfono</p>
                      <p className="text-[#FFF8F0]">{profile?.phone || 'No especificado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[#6B6560]" />
                    <div>
                      <p className="text-xs text-[#6B6560]">Dirección</p>
                      <p className="text-[#FFF8F0]">{profile?.address || 'No especificado'}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#252320] border border-[#3D3936] p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl text-[#FFF8F0]">Pedidos Recientes</h2>
                <Link
                  href="/orders"
                  className="text-[#FF6B35] hover:text-[#E55A2B] text-sm font-medium transition-colors"
                >
                  Ver todos
                </Link>
              </div>

              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders?id=${order.id}`}
                      className="flex items-center justify-between p-4 bg-[#2D2A26] border border-[#3D3936] hover:border-[#FF6B35]/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#FF6B35]/10 flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-[#FF6B35]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#FFF8F0]">#{order.order_number}</p>
                          <p className="text-xs text-[#6B6560]">
                            {new Date(order.created_at).toLocaleDateString('es-SV')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-[#FFF8F0]">${order.total.toFixed(2)}</p>
                          <p className="text-xs text-[#FF6B35] capitalize">{order.status.replace('_', ' ')}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#6B6560]" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 text-[#3D3936] mx-auto mb-3" />
                  <p className="text-[#6B6560]">Aún no tienes pedidos</p>
                  <Link
                    href="/menu"
                    className="inline-block mt-4 text-[#FF6B35] hover:underline font-medium"
                  >
                    Ver Menú
                  </Link>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Loyalty Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`relative overflow-hidden ${tierColors[profile?.loyalty_tier as keyof typeof tierColors] || 'bg-[#6B6560]'}`}
            >
              <div className="p-6">
                <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
                  <TierIcon className="w-4 h-4" />
                  <span className="uppercase tracking-wider">{profile?.loyalty_tier || 'Starter'}</span>
                </div>
                <p className="text-white/60 text-sm">Puntos disponibles</p>
                <p className="text-4xl font-bold text-white mb-4">
                  {profile?.loyalty_points || 0}
                </p>

                {profile?.loyalty_tier !== 'inferno' && (
                  <div>
                    <div className="flex justify-between text-sm text-white/80 mb-1">
                      <span>Próximo nivel</span>
                      <span>{getNextTierPoints()} pts restantes</span>
                    </div>
                    <div className="h-2 bg-white/20">
                      <div
                        className="h-full bg-white transition-all"
                        style={{
                          width: `${Math.min(100, ((profile?.loyalty_points || 0) / (profile?.loyalty_tier === 'starter' ? 500 : 1500)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#252320] border border-[#3D3936] p-6"
            >
              <h3 className="font-display text-lg text-[#FFF8F0] mb-4">Estadísticas</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B6560] flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Total pedidos
                  </span>
                  <span className="text-[#FFF8F0] font-medium">{profile?.total_orders || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B6560] flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Total gastado
                  </span>
                  <span className="text-[#FFF8F0] font-medium">${(profile?.total_spent || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B6560] flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Miembro desde
                  </span>
                  <span className="text-[#FFF8F0] font-medium">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString('es-SV', { month: 'short', year: 'numeric' })
                      : '-'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <Link
                href="/simmerlovers"
                className="flex items-center justify-between p-4 bg-[#252320] border border-[#3D3936] hover:border-[#FF6B35]/30 transition-colors"
              >
                <span className="flex items-center gap-3 text-[#FFF8F0]">
                  <Gift className="w-5 h-5 text-[#FF6B35]" />
                  Ver Recompensas
                </span>
                <ChevronRight className="w-4 h-4 text-[#6B6560]" />
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 bg-[#252320] border border-[#3D3936] hover:border-[#C73E1D]/30 transition-colors"
              >
                <span className="flex items-center gap-3 text-[#C73E1D]">
                  <LogOut className="w-5 h-5" />
                  Cerrar Sesión
                </span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
