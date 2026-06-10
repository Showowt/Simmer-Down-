'use client'

import { useEffect, useState } from 'react'
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
import { useI18n } from '@/lib/i18n'
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
  starter: 'bg-white/40',
  flame: 'bg-[#E85D04]',
  inferno: 'bg-[#C2410C]',
}

const tierIcons = {
  starter: Star,
  flame: Flame,
  inferno: Crown,
}

export default function AccountPage() {
  const router = useRouter()
  const { locale } = useI18n()
  const isEn = locale === 'en'
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [notAuthenticated, setNotAuthenticated] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', address: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        setNotAuthenticated(true)
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
    }
    loadUserData()
  }, [router])

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

  if (notAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 pt-28">
        <div className="w-full max-w-md text-center">
          <div className="bg-[#1A1A1A] border border-white/10 p-8">
            <div className="w-16 h-16 bg-[#E85D04]/10 flex items-center justify-center mx-auto mb-6">
              <User className="w-8 h-8 text-[#E85D04]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">{isEn ? 'Sign in to continue' : 'Inicia sesión para continuar'}</h1>
            <p className="text-white/40 mb-6">
              {isEn ? 'You need an account to access your profile, points and orders.' : 'Necesitas una cuenta para acceder a tu perfil, puntos y pedidos.'}
            </p>
            <Link
              href="/auth/login"
              className="block w-full bg-[#E85D04] hover:bg-[#C2410C] text-white py-4 font-semibold transition-colors"
            >
              {isEn ? 'Sign In' : 'Iniciar Sesión'}
            </Link>
            <p className="text-white/40 mt-4 text-sm">
              {isEn ? "Don't have an account?" : '¿No tienes cuenta?'}{' '}
              <Link href="/auth/signup" className="text-[#E85D04] hover:underline font-medium">
                {isEn ? 'Sign up free' : 'Regístrate gratis'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-32">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-40 bg-white/10" />
            <div className="h-64 bg-white/10" />
          </div>
        </div>
      </div>
    )
  }

  const TierIcon = profile ? tierIcons[profile.loyalty_tier as keyof typeof tierIcons] || Star : Star

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl text-white">{isEn ? 'My Account' : 'Mi Cuenta'}</h1>
          <p className="text-white/40">{isEn ? 'Manage your profile and review your history' : 'Gestiona tu perfil y revisa tu historial'}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1A1A1A] border border-white/10 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl text-white">{isEn ? 'Personal Information' : 'Información Personal'}</h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 text-[#E85D04] hover:text-[#C2410C] text-sm font-medium transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    {isEn ? 'Edit' : 'Editar'}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-1 text-[#4CAF50] hover:text-[#45a049] text-sm font-medium transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      {saving ? (isEn ? 'Saving...' : 'Guardando...') : (isEn ? 'Save' : 'Guardar')}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex items-center gap-1 text-white/40 hover:text-white/60 text-sm font-medium transition-colors"
                    >
                      <X className="w-4 h-4" />
                      {isEn ? 'Cancel' : 'Cancelar'}
                    </button>
                  </div>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/40 mb-1">{isEn ? 'Name' : 'Nombre'}</label>
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white focus:outline-none focus:border-[#E85D04] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/40 mb-1">{isEn ? 'Phone' : 'Teléfono'}</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white focus:outline-none focus:border-[#E85D04] transition"
                      placeholder="+503 XXXX-XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/40 mb-1">{isEn ? 'Address' : 'Dirección'}</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white focus:outline-none focus:border-[#E85D04] transition"
                      placeholder={isEn ? 'Your delivery address' : 'Tu dirección de entrega'}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-white/40" />
                    <div>
                      <p className="text-xs text-white/40">{isEn ? 'Name' : 'Nombre'}</p>
                      <p className="text-white">{profile?.full_name || (isEn ? 'Not specified' : 'No especificado')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-white/40" />
                    <div>
                      <p className="text-xs text-white/40">{isEn ? 'Email' : 'Correo'}</p>
                      <p className="text-white">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-white/40" />
                    <div>
                      <p className="text-xs text-white/40">{isEn ? 'Phone' : 'Teléfono'}</p>
                      <p className="text-white">{profile?.phone || (isEn ? 'Not specified' : 'No especificado')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-white/40" />
                    <div>
                      <p className="text-xs text-white/40">{isEn ? 'Address' : 'Dirección'}</p>
                      <p className="text-white">{profile?.address || (isEn ? 'Not specified' : 'No especificado')}</p>
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
              className="bg-[#1A1A1A] border border-white/10 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl text-white">{isEn ? 'Recent Orders' : 'Pedidos Recientes'}</h2>
                <Link
                  href="/orders"
                  className="text-[#E85D04] hover:text-[#C2410C] text-sm font-medium transition-colors"
                >
                  {isEn ? 'View all' : 'Ver todos'}
                </Link>
              </div>

              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders?id=${order.id}`}
                      className="flex items-center justify-between p-4 bg-[#0A0A0A] border border-white/10 hover:border-[#E85D04]/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#E85D04]/10 flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-[#E85D04]" />
                        </div>
                        <div>
                          <p className="font-medium text-white">#{order.order_number}</p>
                          <p className="text-xs text-white/40">
                            {new Date(order.created_at).toLocaleDateString('es-SV')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-white">${order.total.toFixed(2)}</p>
                          <p className="text-xs text-[#E85D04] capitalize">{order.status.replace('_', ' ')}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/40" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 text-white/10 mx-auto mb-3" />
                  <p className="text-white/40">{isEn ? 'No orders yet' : 'Aún no tienes pedidos'}</p>
                  <Link
                    href="/carta"
                    className="inline-block mt-4 text-[#E85D04] hover:underline font-medium"
                  >
                    {isEn ? 'View Menu' : 'Ver Menú'}
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
              className={`relative overflow-hidden ${tierColors[profile?.loyalty_tier as keyof typeof tierColors] || 'bg-white/40'}`}
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
              className="bg-[#1A1A1A] border border-white/10 p-6"
            >
              <h3 className="font-display text-lg text-white mb-4">{isEn ? 'Stats' : 'Estadísticas'}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/40 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    {isEn ? 'Total orders' : 'Total pedidos'}
                  </span>
                  <span className="text-white font-medium">{profile?.total_orders || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    {isEn ? 'Total spent' : 'Total gastado'}
                  </span>
                  <span className="text-white font-medium">${(profile?.total_spent || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {isEn ? 'Member since' : 'Miembro desde'}
                  </span>
                  <span className="text-white font-medium">
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
                className="flex items-center justify-between p-4 bg-[#1A1A1A] border border-white/10 hover:border-[#E85D04]/30 transition-colors"
              >
                <span className="flex items-center gap-3 text-white">
                  <Gift className="w-5 h-5 text-[#E85D04]" />
                  {isEn ? 'View Rewards' : 'Ver Recompensas'}
                </span>
                <ChevronRight className="w-4 h-4 text-white/40" />
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 bg-[#1A1A1A] border border-white/10 hover:border-red-500/30 transition-colors"
              >
                <span className="flex items-center gap-3 text-red-500">
                  <LogOut className="w-5 h-5" />
                  {isEn ? 'Sign Out' : 'Cerrar Sesión'}
                </span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
