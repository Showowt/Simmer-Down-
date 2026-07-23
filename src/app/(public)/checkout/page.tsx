'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingBag, MapPin, CreditCard } from 'lucide-react'
import { useCartStore, useTranslation } from '@/lib/store'
import { formatPrice } from '@/lib/data'
import CardPaymentForm from '@/components/checkout/CardPaymentForm'
import ThreeDSecureModal from '@/components/checkout/ThreeDSecureModal'
import PaymentResult from '@/components/checkout/PaymentResult'
import type { CardFormData } from '@/components/checkout/CardPaymentForm'

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

type CheckoutStep = 'review' | 'payment' | '3ds' | 'result'

interface OrderData {
  id: string
  orderNumber: string
  subtotal: number
  deliveryFee: number
  total: number
}

interface PaymentData {
  spiToken: string
  redirectData: string
  paymentId: string
}

interface PaymentResultData {
  status: 'paid' | 'failed'
  message?: string
  authorizationCode?: string | null
}

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export default function CheckoutPage() {
  const router = useRouter()
  const { t, language } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<CheckoutStep>('review')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [resultData, setResultData] = useState<PaymentResultData | null>(null)

  const {
    items,
    selectedLocation: location,
    orderType,
    customerName,
    customerPhone,
    customerEmail,
    orderNotes,
    subtotal: cartSubtotal,
    tax: cartTax,
    total: cartTotal,
    setCustomerInfo,
    setOrderNotes,
    clearCart,
  } = useCartStore()

  // Customer details captured on the review step. Pre-filled from the store
  // (set on the cart page) but ALWAYS editable + required here, so a card order
  // can never be created as "Cliente Web" — even when /checkout is reached directly.
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true)
      if (customerName) setName(customerName)
      if (customerPhone) setPhone(customerPhone)
      if (orderNotes) setNotes(orderNotes)
    })
  }, [customerName, customerPhone, orderNotes])

  // El Salvador phone format — mirrors createOrderSchema so we fail fast with a
  // friendly message instead of a generic 400 from the API.
  const phoneIsValid = /^(\+?503)?[\s-]?\d{4}[\s-]?\d{4}$/.test(phone.trim())
  const detailsValid = name.trim().length >= 2 && phoneIsValid

  // ─── Step 1: Create Order ───────────────────────────────────
  const handleCreateOrder = useCallback(async () => {
    // Guard: never create a card order without real customer details.
    if (!detailsValid) {
      setError(
        language === 'es'
          ? 'Ingresa tu nombre y un teléfono válido (formato XXXX-XXXX).'
          : 'Enter your name and a valid phone (format XXXX-XXXX).',
      )
      return
    }

    const cleanName = name.trim()
    const cleanPhone = phone.trim()
    const cleanNotes = notes.trim()

    // Persist so staff notifications, admin, and a page reload all keep the data.
    setCustomerInfo(cleanName, cleanPhone, customerEmail)
    setOrderNotes(cleanNotes)

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: location?.id || items[0]?.categoryId || 'santa-ana',
          orderType: orderType || 'takeout',
          customerName: cleanName,
          customerPhone: cleanPhone,
          customerEmail: customerEmail || '',
          notes: cleanNotes || undefined,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.basePrice || item.totalPrice || 0,
            description: item.description || '',
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al crear el pedido')
      }

      setOrderData({
        id: data.order.id,
        orderNumber: data.order.orderNumber,
        subtotal: data.order.subtotal,
        deliveryFee: data.order.deliveryFee,
        total: data.order.total,
      })
      setStep('payment')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }, [items, location, orderType, name, phone, notes, detailsValid, customerEmail, setCustomerInfo, setOrderNotes, language])

  // ─── Step 2: Initiate Payment ───────────────────────────────
  const handleCardSubmit = useCallback(async (formData: CardFormData) => {
    if (!orderData) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.id,
          card: formData.card,
          billing: formData.billing,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al iniciar el pago')
      }

      setPaymentData({
        spiToken: data.spiToken,
        redirectData: data.redirectData,
        paymentId: data.paymentId,
      })
      setStep('3ds')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de pago')
    } finally {
      setLoading(false)
    }
  }, [orderData])

  // ─── Step 3: 3DS Complete ───────────────────────────────────
  const handle3DSComplete = useCallback((result: {
    status: 'paid' | 'failed'
    message?: string
    authorizationCode?: string | null
  }) => {
    setResultData(result)
    setStep('result')
    if (result.status === 'paid') {
      clearCart()
    }
  }, [clearCart])

  const handle3DSClose = useCallback(() => {
    // User closed the 3DS modal — go back to payment form
    setPaymentData(null)
    setStep('payment')
    setError(language === 'es' ? 'Verificación cancelada. Puedes intentar de nuevo.' : 'Verification cancelled. You can try again.')
  }, [])

  // ─── Retry ──────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setPaymentData(null)
    setResultData(null)
    setError(null)
    setOrderData(null)
    setStep('review')
  }, [])

  // ─── Loading / empty states ─────────────────────────────────
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-36">
        <div className="max-w-2xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#1A1A1A] rounded-xl w-1/3" />
            <div className="h-64 bg-[#1A1A1A] rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0 && step !== 'result') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-36 pb-32 px-4">
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="w-20 h-20 bg-[#1A1A1A] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-white/30" />
          </div>
          <h1 className="font-display text-3xl text-white uppercase">
            {language === 'es' ? 'Carrito vacío' : 'Cart is empty'}
          </h1>
          <p className="text-white/50 mt-2">
            {language === 'es' ? 'Agrega productos antes de pagar' : 'Add items before checkout'}
          </p>
          <Link
            href="/carta"
            className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-[#E85D04] text-white rounded-xl font-semibold hover:bg-[#C2410C] transition"
          >
            {language === 'es' ? 'Ver Menú' : 'View Menu'}
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = cartSubtotal
  const deliveryFee = orderType === 'delivery' ? (cartSubtotal >= 25 ? 0 : 3.99) : 0
  const tax = cartTax
  const total = cartTotal + deliveryFee

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-36 pb-32 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        {step !== 'result' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Link
              href="/carrito"
              className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-3 transition"
            >
              <ArrowLeft className="w-4 h-4" /> {language === 'es' ? 'Volver al carrito' : 'Back to cart'}
            </Link>
            <div className="flex items-center justify-between">
              <h1 className="font-display text-3xl text-white uppercase">
                {step === 'review' && (language === 'es' ? 'Confirmar Pedido' : 'Confirm Order')}
                {step === 'payment' && (language === 'es' ? 'Pagar' : 'Payment')}
                {step === '3ds' && (language === 'es' ? 'Verificación' : 'Verification')}
              </h1>
              {/* Step indicator */}
              <div className="flex items-center gap-1.5">
                {['review', 'payment', '3ds'].map((s, i) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all ${
                      s === step
                        ? 'w-8 bg-[#E85D04]'
                        : ['review', 'payment', '3ds'].indexOf(step) > i
                          ? 'w-4 bg-[#E85D04]/40'
                          : 'w-4 bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Step: Review ─── */}
        {step === 'review' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Order Items Summary */}
            <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-5">
              <h3 className="font-display text-lg text-white uppercase mb-4">
                {language === 'es' ? 'Tu Pedido' : 'Your Order'}
              </h3>
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-white/40 w-6 text-right">
                        {item.quantity}x
                      </span>
                      <span className="text-white text-sm">{item.name}</span>
                    </div>
                    <span className="text-white/60 text-sm">
                      ${((item.totalPrice || item.basePrice * item.quantity)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location & Order Type */}
            {location && (
              <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-5">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#E85D04]" />
                  <div>
                    <p className="text-white font-medium text-sm">{location.name}</p>
                    <p className="text-white/40 text-xs capitalize">{orderType}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Info — required so staff know who the order is for */}
            <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-5 space-y-3">
              <h3 className="font-display text-lg text-white uppercase">
                {language === 'es' ? 'Tus Datos' : 'Your Info'}
              </h3>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={language === 'es' ? 'Tu nombre *' : 'Your name *'}
                className="w-full h-12 px-4 bg-[#0A0A0A] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#E85D04] focus:outline-none transition"
              />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder={language === 'es' ? 'Teléfono * (XXXX-XXXX)' : 'Phone * (XXXX-XXXX)'}
                className={`w-full h-12 px-4 bg-[#0A0A0A] border rounded-xl text-white placeholder:text-white/30 focus:outline-none transition ${
                  phone.trim().length > 0 && !phoneIsValid
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-white/10 focus:border-[#E85D04]'
                }`}
              />
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={language === 'es' ? 'Notas especiales (opcional)' : 'Special notes (optional)'}
                rows={2}
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#E85D04] focus:outline-none transition resize-none"
              />
            </div>

            {/* Totals */}
            <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">{language === 'es' ? 'Subtotal' : 'Subtotal'}</span>
                  <span className="text-white">${subtotal.toFixed(2)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-white/50">{language === 'es' ? 'Envío' : 'Delivery'}</span>
                    <span className="text-white">${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/50">{language === 'es' ? 'IVA (13%)' : 'Tax (13%)'}</span>
                  <span className="text-white">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-[#E85D04]">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleCreateOrder}
              disabled={loading || items.length === 0 || !detailsValid}
              className="w-full py-4 bg-[#E85D04] hover:bg-[#C2410C] disabled:bg-[#1A1A1A] disabled:text-white/30 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-3 transition shadow-lg disabled:shadow-none"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {language === 'es' ? 'Creando pedido...' : 'Creating order...'}
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  {language === 'es' ? 'Continuar al Pago' : 'Continue to Payment'} &middot; ${total.toFixed(2)}
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* ─── Step: Payment ─── */}
        {step === 'payment' && orderData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Order confirmation bar */}
            <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4 mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40">Pedido</p>
                <p className="text-white font-bold">#{orderData.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40">Total</p>
                <p className="text-[#E85D04] font-bold text-lg">
                  ${orderData.total.toFixed(2)}
                </p>
              </div>
            </div>

            <CardPaymentForm
              onSubmit={handleCardSubmit}
              loading={loading}
              error={error}
              defaultBilling={{
                email: customerEmail || undefined,
                phone: customerPhone || undefined,
              }}
            />
          </motion.div>
        )}

        {/* ─── Step: 3DS ─── */}
        {step === '3ds' && paymentData && orderData && (
          <ThreeDSecureModal
            redirectData={paymentData.redirectData}
            orderId={orderData.id}
            onComplete={handle3DSComplete}
            onClose={handle3DSClose}
          />
        )}

        {/* ─── Step: Result ─── */}
        {step === 'result' && resultData && (
          <PaymentResult
            status={resultData.status}
            orderNumber={orderData?.orderNumber}
            orderId={orderData?.id}
            authorizationCode={resultData.authorizationCode}
            message={resultData.message}
            onRetry={resultData.status === 'failed' ? handleRetry : undefined}
          />
        )}
      </div>
    </div>
  )
}
