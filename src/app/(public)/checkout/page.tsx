'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  MapPin,
  Phone,
  User,
  FileText,
  ArrowLeft,
  AlertCircle,
  MessageCircle,
  Check,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

import { useCartStore } from '@/store/cart'
import { useI18n, translations } from '@/lib/i18n'
import {
  WHATSAPP_LOCATIONS,
  generateWhatsAppLink,
  type WhatsAppLocation,
} from '@/lib/whatsapp-order'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getSubtotal, clearCart } = useCartStore()
  const { t, locale } = useI18n()
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<WhatsAppLocation | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    notes: '',
  })

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
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

  const handleSendWhatsApp = () => {
    setError('')

    if (!selectedLocation) {
      setError(t(translations.checkout.selectLocation))
      return
    }

    if (!formData.name.trim()) {
      setError(t(translations.checkout.nameRequired))
      return
    }

    if (!formData.phone.trim()) {
      setError(t(translations.checkout.phoneRequired))
      return
    }

    const url = generateWhatsAppLink({
      items,
      location: selectedLocation,
      orderType: 'pickup',
      customerName: formData.name.trim(),
      customerPhone: formData.phone.trim(),
      notes: formData.notes.trim() || undefined,
      locale,
    })

    // Open WhatsApp in new tab
    window.open(url, '_blank')

    // Clear cart after sending
    clearCart()

    // Redirect to a confirmation state
    router.push('/orders?whatsapp=sent')
  }

  return (
    <div className="min-h-screen bg-[#2D2A26] pt-32 pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
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
            {t(translations.checkout.backToCart)}
          </Link>
          <h1 className="font-display text-3xl text-[#FFF8F0]">
            {t(translations.checkout.orderViaWhatsApp)}
          </h1>
          <p className="text-[#6B6560] mt-1">
            {t(translations.checkout.whatsAppExplainer)}
          </p>
        </motion.div>

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

        <div className="space-y-6">
          {/* ─── STEP 1: SELECT LOCATION ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#252320] border border-[#3D3936] p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-[#FF6B35] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                1
              </div>
              <h2 className="font-display text-lg text-[#FFF8F0]">
                {t(translations.checkout.selectYourLocation)}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WHATSAPP_LOCATIONS.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setSelectedLocation(loc)}
                    className={`p-4 border-2 text-left transition-all ${
                      isSelected
                        ? 'border-[#FF6B35] bg-[#FF6B35]/10'
                        : 'border-[#3D3936] hover:border-[#6B6560]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        isSelected ? 'text-[#FF6B35]' : 'text-[#6B6560]'
                      }`} />
                      <div>
                        <p className={`font-semibold ${
                          isSelected ? 'text-[#FF6B35]' : 'text-[#FFF8F0]'
                        }`}>
                          {loc.name}
                        </p>
                        <p className="text-xs text-[#6B6560] mt-0.5">{loc.city}</p>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-[#FF6B35] ml-auto flex-shrink-0" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>

          {/* ─── STEP 2: YOUR INFO ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#252320] border border-[#3D3936] p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-[#FF6B35] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                2
              </div>
              <h2 className="font-display text-lg text-[#FFF8F0]">
                {t(translations.checkout.yourInfo)}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  {t(translations.checkout.name)} *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
                  <input
                    id="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition"
                    placeholder={t(translations.checkout.yourName)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  {t(translations.checkout.phone)} *
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
                <label htmlFor="notes" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  {t(translations.checkout.specialInstructions)}
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 w-5 h-5 text-[#6B6560]" />
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition resize-none"
                    rows={2}
                    placeholder={t(translations.checkout.instructionsPlaceholder)}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* ─── ORDER SUMMARY ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#252320] border border-[#3D3936] p-6"
          >
            <h2 className="font-display text-lg text-[#FFF8F0] mb-4">
              {t(translations.cart.orderSummary)}
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-[#B8B0A8]">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-[#FFF8F0]">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-[#3D3936] pt-3 mt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-[#FFF8F0]">{t(translations.cart.total)}</span>
                  <span className="text-white">${subtotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-[#6B6560] mt-2">
                  {locale === 'es'
                    ? 'Pago en el local al recoger tu pedido'
                    : 'Pay at the store when you pick up your order'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* ─── SEND VIA WHATSAPP BUTTON ─── */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            type="button"
            onClick={handleSendWhatsApp}
            className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white py-4 font-bold text-lg transition-colors flex items-center justify-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D2A26] active:scale-[0.98] min-h-[56px]"
          >
            <MessageCircle className="w-6 h-6" />
            {t(translations.checkout.sendToWhatsApp)}
          </motion.button>

          <p className="text-center text-xs text-[#6B6560]">
            {locale === 'es'
              ? 'Se abrirá WhatsApp con tu pedido listo para enviar'
              : 'WhatsApp will open with your order ready to send'}
          </p>
        </div>
      </div>
    </div>
  )
}
