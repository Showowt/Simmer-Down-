'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, MessageCircle, MapPin } from 'lucide-react'
import { useCartStore, useUIStore, useTranslation } from '@/lib/store'
import { LOCATIONS, formatPrice, generateWhatsAppOrderUrl } from '@/lib/data'

export default function CartPage() {
  const { t, language } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const {
    items, itemCount, subtotal, tax, total,
    updateQuantity, removeItem, clearCart,
    selectedLocation, setSelectedLocation,
    customerName, customerPhone, orderType,
    setOrderType,
  } = useCartStore()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (customerName) setName(customerName)
    if (customerPhone) setPhone(customerPhone)
  }, [customerName, customerPhone])

  if (!mounted) return <div className="min-h-screen bg-[#0A0A0A] pt-36"><div className="max-w-2xl mx-auto px-4"><div className="animate-pulse space-y-4"><div className="h-8 bg-[#1A1A1A] rounded-xl w-1/3" /><div className="h-32 bg-[#1A1A1A] rounded-xl" /></div></div></div>

  const handleWhatsAppOrder = () => {
    if (!selectedLocation) { setShowLocationPicker(true); return }
    if (!name.trim() || !phone.trim()) return

    useCartStore.getState().setCustomerInfo(name, phone)
    useCartStore.getState().setOrderNotes(notes)

    const url = generateWhatsAppOrderUrl({
      items, location: selectedLocation, customerName: name, customerPhone: phone,
      orderType, notes: notes || undefined, subtotal, tax, total,
    })
    window.open(url, '_blank')
    clearCart()
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-36 pb-32 px-4">
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="w-20 h-20 bg-[#1A1A1A] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-white/30" />
          </div>
          <h1 className="font-display text-3xl text-white uppercase">{t('cart.empty')}</h1>
          <p className="text-white/50 mt-2">{t('cart.emptySubtitle')}</p>
          <Link href="/carta" className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-[#E85D04] text-white rounded-xl font-semibold hover:bg-[#C2410C] transition">
            {t('cart.browseMenu')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-36 pb-32 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link href="/carta" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-3 transition">
            <ArrowLeft className="w-4 h-4" /> {language === 'es' ? 'Seguir comprando' : 'Continue shopping'}
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl text-white uppercase">{t('cart.title')}</h1>
            <button onClick={clearCart} className="text-sm text-white/40 hover:text-red-400 transition">{t('cart.clear')}</button>
          </div>
        </motion.div>

        {/* Location Selector */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <button
            onClick={() => setShowLocationPicker(!showLocationPicker)}
            className="w-full flex items-center justify-between p-4 bg-[#1A1A1A] rounded-xl border border-white/10 hover:border-[#E85D04]/30 transition"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#E85D04]" />
              <span className="text-white font-medium">{selectedLocation?.shortName || t('cart.selectLocation')}</span>
            </div>
            <span className="text-white/40 text-sm">{language === 'es' ? 'Cambiar' : 'Change'}</span>
          </button>
          {showLocationPicker && (
            <div className="mt-2 bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden">
              {LOCATIONS.map((loc) => (
                <button key={loc.id} onClick={() => { setSelectedLocation(loc); setShowLocationPicker(false) }}
                  className={`w-full flex items-center gap-3 p-3.5 text-left hover:bg-white/5 transition ${selectedLocation?.id === loc.id ? 'bg-[#E85D04]/10 border-l-2 border-[#E85D04]' : ''}`}>
                  <MapPin className="w-4 h-4 text-white/40 flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">{loc.shortName}</p>
                    <p className="text-white/40 text-xs">{loc.city}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Order Type */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6 flex gap-2">
          {(['takeout', 'delivery', 'dine_in'] as const).map((type) => {
            const labels: Record<string, Record<string, string>> = {
              takeout: { es: 'Para llevar', en: 'Takeout' },
              delivery: { es: 'Domicilio', en: 'Delivery' },
              dine_in: { es: 'Comer aquí', en: 'Dine in' },
            }
            return (
              <button key={type} onClick={() => setOrderType(type)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${orderType === type ? 'bg-[#E85D04] text-white' : 'bg-[#1A1A1A] text-white/50 border border-white/10'}`}>
                {labels[type][language]}
              </button>
            )
          })}
        </motion.div>

        {/* Cart Items */}
        <div className="space-y-3 mb-6">
          {items.map((item, i) => (
            <motion.div key={item.id + (item.selectedSize?.id || '')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4 flex gap-4">
              {/* Image */}
              <div className="w-20 h-20 bg-[#0A0A0A] rounded-lg overflow-hidden flex-shrink-0">
                {item.image ? <Image src={item.image} alt={item.name} width={80} height={80} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">🍕</div>}
              </div>
              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-sm">{language === 'es' ? item.nameEs : item.name}</h3>
                    {item.selectedSize && <p className="text-white/40 text-xs mt-0.5">{language === 'es' ? item.selectedSize.nameEs : item.selectedSize.name}</p>}
                  </div>
                  <button onClick={() => removeItem(item.id)} className="p-1.5 text-white/30 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 bg-[#0A0A0A] rounded-lg">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition"><Minus className="w-4 h-4" /></button>
                    <span className="text-white font-semibold text-sm w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition"><Plus className="w-4 h-4" /></button>
                  </div>
                  <span className="text-[#E85D04] font-bold">{formatPrice(item.totalPrice)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Customer Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[#1A1A1A] rounded-xl border border-white/10 p-5 mb-6 space-y-4">
          <h3 className="font-display text-lg text-white uppercase">{language === 'es' ? 'Tus Datos' : 'Your Info'}</h3>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={language === 'es' ? 'Tu nombre *' : 'Your name *'}
            className="w-full h-12 px-4 bg-[#0A0A0A] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#E85D04] focus:outline-none transition" />
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={language === 'es' ? 'Teléfono *' : 'Phone *'}
            className="w-full h-12 px-4 bg-[#0A0A0A] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#E85D04] focus:outline-none transition" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={language === 'es' ? 'Notas especiales (opcional)' : 'Special notes (optional)'}
            className="w-full h-20 px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#E85D04] focus:outline-none transition resize-none" rows={2} />
        </motion.div>

        {/* Order Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-[#1A1A1A] rounded-xl border border-white/10 p-5 mb-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-white/50">{t('cart.subtotal')}</span><span className="text-white">{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-white/50">{t('cart.tax')}</span><span className="text-white">{formatPrice(tax)}</span></div>
            <div className="border-t border-white/10 pt-3 flex justify-between text-lg font-bold"><span className="text-white">{t('cart.total')}</span><span className="text-[#E85D04]">{formatPrice(total)}</span></div>
          </div>
        </motion.div>

        {/* WhatsApp Order Button */}
        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          onClick={handleWhatsAppOrder}
          disabled={!name.trim() || !phone.trim() || !selectedLocation}
          className="w-full py-4 bg-[#25D366] hover:bg-[#20BD5A] disabled:bg-[#1A1A1A] disabled:text-white/30 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-3 transition shadow-lg disabled:shadow-none">
          <MessageCircle className="w-6 h-6" />
          {t('cart.orderWhatsApp')} &middot; {formatPrice(total)}
        </motion.button>

        <p className="text-center text-xs text-white/30 mt-3">
          {language === 'es' ? 'Se abrirá WhatsApp con tu pedido listo para enviar' : 'WhatsApp will open with your order ready to send'}
        </p>
      </div>
    </div>
  )
}
