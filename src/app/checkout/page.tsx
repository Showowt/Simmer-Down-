'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Phone, User, Mail, FileText, Truck, Store, ArrowLeft, Lock, CreditCard, AlertCircle } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getSubtotal, clearCart } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
      <div className="min-h-screen bg-[#2D2A26] pt-32">
        <div className="max-w-2xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#3D3936] w-1/3" />
            <div className="h-48 bg-[#3D3936]" />
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
    setError('')

    try {
      const supabase = createClient()

      // Generate order number
      const orderNumber = `SD${Date.now().toString(36).toUpperCase()}`

      // Build customer info for notes field (fallback if columns don't exist)
      const customerInfo = `Cliente: ${formData.name} | Tel: ${formData.phone}${formData.email ? ` | Email: ${formData.email}` : ''}${orderType === 'delivery' && formData.address ? ` | Dirección: ${formData.address}` : ''}`
      const fullNotes = formData.notes ? `${customerInfo}\n\nNotas: ${formData.notes}` : customerInfo

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

      const { data, error: dbError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single()

      if (dbError) throw dbError

      // Only clear cart on successful order
      clearCart()
      router.push(`/orders?id=${data.id}&number=${orderNumber}`)
    } catch (err) {
      console.error('Error al procesar pedido:', err)
      // Don't clear cart on error - keep items for retry
      setError('Hubo un problema al procesar tu pedido. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#2D2A26] pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-[#B8B0A8] hover:text-[#FFF8F0] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Carrito
          </Link>
          <h1 className="font-display text-3xl text-[#FFF8F0]">Finalizar Pedido</h1>
          <p className="text-[#6B6560]">Completa tu orden</p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-[#C73E1D]/10 border border-[#C73E1D]/30 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-[#C73E1D] flex-shrink-0" />
            <p className="text-[#FFF8F0] text-sm">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Type */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#252320] border border-[#3D3936] p-6"
          >
            <h2 className="font-display text-lg text-[#FFF8F0] mb-4">Tipo de Pedido</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`p-4 border-2 flex items-center justify-center gap-3 transition-all min-h-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] ${
                  orderType === 'delivery'
                    ? 'border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]'
                    : 'border-[#3D3936] text-[#B8B0A8] hover:border-[#6B6560]'
                }`}
              >
                <Truck className="w-5 h-5" />
                <span className="font-medium">Delivery</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType('pickup')}
                className={`p-4 border-2 flex items-center justify-center gap-3 transition-all min-h-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] ${
                  orderType === 'pickup'
                    ? 'border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]'
                    : 'border-[#3D3936] text-[#B8B0A8] hover:border-[#6B6560]'
                }`}
              >
                <Store className="w-5 h-5" />
                <span className="font-medium">Recoger</span>
              </button>
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#252320] border border-[#3D3936] p-6"
          >
            <h2 className="font-display text-lg text-[#FFF8F0] mb-4">Información de Contacto</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Nombre *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Teléfono *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition"
                    placeholder="+503 XXXX-XXXX"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Correo (opcional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition"
                    placeholder="tu@email.com"
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
              className="bg-[#252320] border border-[#3D3936] p-6"
            >
              <h2 className="font-display text-lg text-[#FFF8F0] mb-4">Dirección de Envío</h2>
              <div className="relative">
                <label htmlFor="address" className="sr-only">Dirección completa</label>
                <MapPin className="absolute left-4 top-4 w-5 h-5 text-[#6B6560]" />
                <textarea
                  id="address"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition resize-none"
                  rows={3}
                  placeholder="Ingresa tu dirección completa"
                />
              </div>
            </motion.div>
          )}

          {/* Special Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#252320] border border-[#3D3936] p-6"
          >
            <h2 className="font-display text-lg text-[#FFF8F0] mb-4">Instrucciones Especiales</h2>
            <div className="relative">
              <label htmlFor="notes" className="sr-only">Notas adicionales</label>
              <FileText className="absolute left-4 top-4 w-5 h-5 text-[#6B6560]" />
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition resize-none"
                rows={2}
                placeholder="¿Alguna solicitud especial? (alergias, servilletas extra, etc.)"
              />
            </div>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#252320] border border-[#3D3936] p-6"
          >
            <h2 className="font-display text-lg text-[#FFF8F0] mb-4">Resumen del Pedido</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-[#B8B0A8]">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-[#FFF8F0]">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-[#3D3936] pt-3 mt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6560]">Subtotal</span>
                  <span className="text-[#FFF8F0]">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6560]">Envío</span>
                  <span className="text-[#FFF8F0]">{deliveryFee > 0 ? `$${deliveryFee.toFixed(2)}` : 'Gratis'}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-[#3D3936]">
                  <span className="text-[#FFF8F0]">Total</span>
                  <span className="text-white">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Payment Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#252320]/50 border border-[#3D3936] p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-[#FF6B35]" />
            </div>
            <div>
              <p className="text-[#FFF8F0] text-sm font-medium">Pago en {orderType === 'delivery' ? 'Entrega' : 'Recogida'}</p>
              <p className="text-[#6B6560] text-xs">El pago se realizará cuando recibas tu pedido</p>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] disabled:bg-[#3D3936] text-white py-4 font-bold text-lg transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D2A26] active:scale-[0.98] disabled:cursor-not-allowed min-h-[56px]"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Confirmar Pedido • ${total.toFixed(2)}
              </>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  )
}
