'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BedDouble, Calendar, Users, User, Phone, Mail, FileText, Check, ArrowRight, Loader2, Moon,
  AlertTriangle, RefreshCw, CreditCard, MessageCircle, ArrowLeft, ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useI18n } from '@/lib/i18n'
import CardPaymentForm, { type CardFormData } from '@/components/checkout/CardPaymentForm'
import ThreeDSecureModal from '@/components/checkout/ThreeDSecureModal'
import PaymentResult from '@/components/checkout/PaymentResult'
import {
  addDays,
  computeStayTotal,
  isRenderableRoomImage,
  nightsBetween,
  roomAmenities,
  todayInSV,
  type RoomAvailability,
} from '@/lib/rooms'

const LODGING_LOCATION = 'lago-coatepeque'

export default function EstadiaClient() {
  const { locale } = useI18n()
  const es = locale === 'es'
  const tr = (a: string, b: string) => (es ? a : b)

  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)
  const [rooms, setRooms] = useState<RoomAvailability[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedTotal, setSubmittedTotal] = useState<number | null>(null)
  const [error, setError] = useState('')

  // Card-payment path (pay now) — runs alongside the WhatsApp request.
  const [payStep, setPayStep] = useState<'none' | 'payment' | '3ds' | 'result'>('none')
  const [payLoading, setPayLoading] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [redirectData, setRedirectData] = useState<string | null>(null)
  const [payResult, setPayResult] = useState<{ status: 'paid' | 'failed'; message?: string } | null>(null)
  // Snapshot of the stay captured when checkout starts, so the payment/result
  // UI does not depend on the live rooms list — our own pending_payment hold
  // marks the room unavailable on the next refetch.
  const [payBooking, setPayBooking] = useState<
    { nameEs: string; nameEn: string; nights: number; total: number; checkIn: string; checkOut: string; guests: number } | null
  >(null)

  // /estadia is statically prerendered, so a render-time date is frozen at BUILD
  // time in the HTML (verified: the built estadia.html carries min="2026-09-20").
  // Reading it in an effect keeps SSR and the first client render identical and
  // still gives the visitor today's SV date.
  const [today, setToday] = useState('')
  useEffect(() => { setToday(todayInSV()) }, [])

  const validRange = Boolean(checkIn && checkOut && checkOut > checkIn)
  const nights = useMemo(() => (validRange ? nightsBetween(checkIn, checkOut) : 0), [validRange, checkIn, checkOut])
  const selectedRoom = useMemo(() => rooms.find((r) => r.id === selectedRoomId) || null, [rooms, selectedRoomId])
  const selectedTotal = useMemo(
    () => (selectedRoom ? computeStayTotal(selectedRoom.price_per_night, nights) : null),
    [selectedRoom, nights],
  )

  // Load rooms/availability whenever dates or guests change
  useEffect(() => {
    // Don't refetch (or flip loading/selection) once the guest is paying — our
    // own hold would mark the room unavailable and clear their selection.
    if (payStep !== 'none') return
    let cancelled = false
    async function load() {
      setLoadingRooms(true)
      setError('')
      try {
        const params = new URLSearchParams({ location_id: LODGING_LOCATION, guests: String(guests) })
        if (validRange) { params.set('check_in', checkIn); params.set('check_out', checkOut) }
        const res = await fetch(`/api/rooms?${params.toString()}`, { cache: 'no-store' })
        const json = await res.json()
        if (cancelled) return
        if (res.ok && json.success) {
          setRooms(json.rooms as RoomAvailability[])
          setLoadFailed(false)
        } else {
          // An outage must look like an outage, never like an empty catalogue.
          setRooms([])
          setLoadFailed(true)
        }
      } catch {
        if (!cancelled) { setRooms([]); setLoadFailed(true) }
      } finally {
        if (!cancelled) setLoadingRooms(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [checkIn, checkOut, guests, validRange, reloadKey, payStep])

  // Drop selection if the room becomes unavailable (only while browsing, not
  // once a hold is in flight — see the load effect above).
  useEffect(() => {
    if (payStep !== 'none') return
    if (selectedRoomId && rooms.length && !rooms.find((r) => r.id === selectedRoomId && r.available)) {
      setSelectedRoomId(null)
    }
  }, [rooms, selectedRoomId, payStep])

  const handleCheckIn = useCallback((v: string) => {
    setCheckIn(v)
    if (v && (!checkOut || checkOut <= v)) setCheckOut(addDays(v, 1))
  }, [checkOut])

  const canSubmit = validRange && selectedRoomId && name.trim() && phone.trim() && !submitting

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/room-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: LODGING_LOCATION,
          room_id: selectedRoomId,
          check_in: checkIn,
          check_out: checkOut,
          guest_count: guests,
          customer_name: name,
          customer_phone: phone,
          customer_email: email || null,
          special_requests: notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || json.message || tr('No se pudo enviar. Intenta de nuevo.', 'Could not submit. Try again.'))
        return
      }
      setSubmittedTotal(typeof json.data?.total_amount === 'number' ? json.data.total_amount : null)
      setSubmitted(true)
    } catch {
      setError(tr('Error de conexión. Intenta de nuevo.', 'Connection error. Try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  // Pay-now: reserve the room (pending_payment hold) + create the order, then
  // hand off to the certified PowerTranz card flow.
  const startCardCheckout = async () => {
    if (!canSubmit || selectedTotal == null || !selectedRoom) return
    setPayLoading(true)
    setError('')
    try {
      const res = await fetch('/api/room-bookings/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: LODGING_LOCATION,
          room_id: selectedRoomId,
          check_in: checkIn,
          check_out: checkOut,
          guest_count: guests,
          customer_name: name,
          customer_phone: phone,
          customer_email: email || null,
          special_requests: notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || json.message || tr('No se pudo iniciar el pago. Intenta de nuevo.', 'Could not start payment. Try again.'))
        return
      }
      setOrderId(json.orderId)
      setPayBooking({
        nameEs: selectedRoom.name_es,
        nameEn: selectedRoom.name,
        nights,
        total: selectedTotal,
        checkIn,
        checkOut,
        guests,
      })
      setPayStep('payment')
    } catch {
      setError(tr('Error de conexión. Intenta de nuevo.', 'Connection error. Try again.'))
    } finally {
      setPayLoading(false)
    }
  }

  const handleStayPayment = async (form: CardFormData) => {
    if (!orderId) return
    setPayLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, card: form.card, billing: form.billing }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.message || json.error || tr('Error al iniciar el pago.', 'Payment init error.'))
        return
      }
      setRedirectData(json.redirectData)
      setPayStep('3ds')
    } catch {
      setError(tr('Error de pago. Intenta de nuevo.', 'Payment error. Try again.'))
    } finally {
      setPayLoading(false)
    }
  }

  const handle3DSComplete = (r: { status: 'paid' | 'failed'; message?: string; authorizationCode?: string | null }) => {
    setPayResult({ status: r.status, message: r.message })
    setPayStep('result')
  }

  const inputCls =
    'w-full px-4 py-3.5 bg-[#111] border border-white/15 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#E85D04] focus:ring-1 focus:ring-[#E85D04]/30 transition'

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-32 md:pt-40 pb-28 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto bg-[#1A1A1A] border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-[#4CAF50]" />
          </div>
          <h2 className="font-display text-2xl text-white mb-3">{tr('¡Solicitud enviada!', 'Request sent!')}</h2>
          <p className="text-white/60 mb-6">
            {tr('Te contactaremos para confirmar tu estadía y el pago.', "We'll contact you to confirm your stay and payment.")}
          </p>
          <div className="bg-[#0A0A0A] border border-white/10 p-5 text-left text-sm space-y-2 mb-6">
            <p className="text-white/70"><span className="text-white/40">{tr('Habitación', 'Room')}:</span> {es ? selectedRoom?.name_es : selectedRoom?.name}</p>
            <p className="text-white/70"><span className="text-white/40">{tr('Entrada', 'Check-in')}:</span> {checkIn}</p>
            <p className="text-white/70"><span className="text-white/40">{tr('Salida', 'Check-out')}:</span> {checkOut} · {nights} {nights === 1 ? tr('noche', 'night') : tr('noches', 'nights')}</p>
            {submittedTotal != null && (
              <p className="text-white/70">
                <span className="text-white/40">{tr('Total estimado', 'Estimated total')}:</span>{' '}
                <span className="text-[#F5D47A]">${submittedTotal.toFixed(2)}</span>
              </p>
            )}
          </div>
          <Link href="/" className="inline-flex items-center gap-2 text-[#E85D04] hover:text-[#F5D47A] font-semibold">
            {tr('Volver al inicio', 'Back home')} <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    )
  }

  // Card payment result (pay-now path)
  if (payStep === 'result' && payResult) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-32 md:pt-40 pb-28 px-4">
        <div className="max-w-md mx-auto">
          {payResult.status === 'paid' ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-[#4CAF50]" />
              </div>
              <h2 className="font-display text-2xl text-white mb-3">{tr('¡Estadía confirmada!', 'Stay confirmed!')}</h2>
              <p className="text-white/60 mb-6">
                {tr('Tu pago fue recibido. Te esperamos frente al lago.', 'Your payment was received. See you by the lake.')}
              </p>
              {payBooking && (
                <div className="bg-[#0A0A0A] border border-white/10 p-5 text-left text-sm space-y-2 mb-6">
                  <p className="text-white/70"><span className="text-white/40">{tr('Habitación', 'Room')}:</span> {es ? payBooking.nameEs : payBooking.nameEn}</p>
                  <p className="text-white/70"><span className="text-white/40">{tr('Entrada', 'Check-in')}:</span> {payBooking.checkIn}</p>
                  <p className="text-white/70"><span className="text-white/40">{tr('Salida', 'Check-out')}:</span> {payBooking.checkOut} · {payBooking.nights} {payBooking.nights === 1 ? tr('noche', 'night') : tr('noches', 'nights')}</p>
                  <p className="text-white/70"><span className="text-white/40">{tr('Total pagado', 'Total paid')}:</span> <span className="text-[#F5D47A]">${payBooking.total.toFixed(2)}</span></p>
                </div>
              )}
              <Link href="/" className="inline-flex items-center gap-2 text-[#E85D04] hover:text-[#F5D47A] font-semibold">
                {tr('Volver al inicio', 'Back home')} <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <PaymentResult
              status="failed"
              message={payResult.message}
              onRetry={() => { setPayResult(null); setError(''); setRedirectData(null); setPayStep('payment') }}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-32 md:pt-40 pb-28 lg:pb-16">
      {payStep === 'none' && (
      <>
      {/* Hero */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-[#E85D04] font-semibold uppercase tracking-[0.2em] text-xs mb-4">
            <BedDouble className="w-4 h-4" /> {tr('Lago de Coatepeque', 'Lake Coatepeque')}
          </span>
          <h1 className="font-display text-4xl md:text-5xl uppercase tracking-tight text-white mb-4">
            {tr('Estadía', 'Stay')}
          </h1>
          <p className="text-lg text-white/60">
            {tr('Reserva tu habitación frente al lago. Confirmamos por WhatsApp.', 'Book your room by the lake. We confirm by WhatsApp.')}
          </p>
        </div>
      </section>

      <form onSubmit={submit} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-8">
        {/* Dates + guests */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-[#FBBF24]" />
            <h2 className="text-lg font-semibold text-white">{tr('Fechas y huéspedes', 'Dates & guests')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-white/50 mb-2">{tr('Entrada', 'Check-in')}</label>
              {/* min = today in El Salvador, so same-day check-in stays possible */}
              <input type="date" min={today} value={checkIn} onChange={(e) => handleCheckIn(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">{tr('Salida', 'Check-out')}</label>
              <input type="date" min={addDays(checkIn || today, 1)} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">{tr('Huéspedes', 'Guests')}</label>
              <select value={guests} onChange={(e) => setGuests(parseInt(e.target.value))} className={inputCls}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          {validRange && (
            <p className="text-white/40 text-sm mt-4 flex items-center gap-2">
              <Moon className="w-4 h-4" /> {nights} {nights === 1 ? tr('noche', 'night') : tr('noches', 'nights')}
            </p>
          )}
        </div>

        {/* Rooms */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <BedDouble className="w-5 h-5 text-[#FBBF24]" />
            <h2 className="text-lg font-semibold text-white">{tr('Elige tu habitación', 'Choose your room')}</h2>
          </div>

          {loadingRooms ? (
            <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 text-[#E85D04] animate-spin" /></div>
          ) : loadFailed ? (
            <div className="py-8 text-center">
              <AlertTriangle className="w-7 h-7 text-[#FBBF24] mx-auto mb-3" />
              <p className="text-white/60 text-sm mb-4">
                {tr('No pudimos cargar la disponibilidad. Es un problema nuestro, no tuyo.', "We couldn't load availability. That's on us, not you.")}
              </p>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="inline-flex items-center gap-2 border border-white/15 hover:border-white/40 text-white/80 px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> {tr('Reintentar', 'Try again')}
              </button>
            </div>
          ) : rooms.length === 0 ? (
            <p className="text-white/40 text-sm py-8 text-center">
              {tr('Aún no hay habitaciones disponibles. Vuelve pronto.', 'No rooms available yet. Check back soon.')}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map((room) => {
                const selected = room.id === selectedRoomId
                const disabled = !room.available
                const roomTotal = validRange ? computeStayTotal(room.price_per_night, nights) : null
                const amenities = roomAmenities(room, locale)
                // EN visitors see the Spanish copy rather than a blank card
                // while the owner has not filled the English description in.
                const description = es ? room.description_es : room.description || room.description_es
                return (
                  <button
                    key={room.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedRoomId(selected ? null : room.id)}
                    className={`text-left border rounded-xl p-5 transition-all ${
                      selected
                        ? 'border-[#E85D04] bg-[#E85D04]/10'
                        : disabled
                          ? 'border-white/5 bg-[#0A0A0A] opacity-50 cursor-not-allowed'
                          : 'border-white/10 bg-[#0A0A0A] hover:border-white/30'
                    }`}
                  >
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-[#141414] border border-white/5 mb-4">
                      {isRenderableRoomImage(room.image_url) ? (
                        <Image
                          src={room.image_url}
                          alt={es ? room.name_es : room.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 400px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BedDouble className="w-8 h-8 text-white/15" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-white font-semibold">{es ? room.name_es : room.name}</h3>
                      {room.price_per_night != null && (
                        <span className="text-[#F5D47A] text-sm whitespace-nowrap">${room.price_per_night}/{tr('noche', 'night')}</span>
                      )}
                    </div>
                    {description && (
                      <p className="text-white/50 text-sm mt-2">{description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-white/40">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {room.capacity}</span>
                      {amenities.slice(0, 3).map((a) => <span key={a} className="px-2 py-0.5 bg-white/5 rounded">{a}</span>)}
                    </div>
                    {roomTotal != null && (
                      <p className="text-white/40 text-xs mt-3">
                        {tr('Total estimado', 'Estimated total')}: <span className="text-[#F5D47A]">${roomTotal.toFixed(2)}</span> · {nights} {nights === 1 ? tr('noche', 'night') : tr('noches', 'nights')}
                      </p>
                    )}
                    {disabled && (
                      <p className="text-red-400/70 text-xs mt-3">
                        {room.reason === 'too_small'
                          ? tr('No admite ese número de huéspedes', 'Not enough capacity')
                          : tr('No disponible para esas fechas', 'Not available for those dates')}
                      </p>
                    )}
                    {selected && <p className="text-[#E85D04] text-xs mt-3 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> {tr('Seleccionada', 'Selected')}</p>}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Contact */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-[#FBBF24]" />
            <h2 className="text-lg font-semibold text-white">{tr('Tus datos', 'Your details')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-white/50 mb-2">{tr('Nombre', 'Name')} *</label>
              <div className="relative">
                <User className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} pl-10`} placeholder={tr('Tu nombre', 'Your name')} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">{tr('Teléfono', 'Phone')} *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputCls} pl-10`} placeholder="+503 XXXX-XXXX" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-white/50 mb-2">{tr('Correo', 'Email')}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} pl-10`} placeholder="tu@email.com" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-white/50 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> {tr('Solicitudes especiales', 'Special requests')}</label>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputCls} resize-none`} placeholder={tr('Cuna, llegada tardía, etc.', 'Crib, late arrival, etc.')} />
            </div>
          </div>
        </div>

        {selectedRoom && selectedTotal != null && (
          <div className="bg-[#111] border border-white/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-white/50">
              {es ? selectedRoom.name_es : selectedRoom.name} · {nights} {nights === 1 ? tr('noche', 'night') : tr('noches', 'nights')}
            </span>
            <span className="text-[#F5D47A] font-semibold">
              {tr('Total estimado', 'Estimated total')}: ${selectedTotal.toFixed(2)}
            </span>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center text-red-400 text-sm">{error}</div>
        )}

        <div className="space-y-3">
          {selectedTotal != null && (
            <button
              type="button"
              onClick={startCardCheckout}
              disabled={!canSubmit || payLoading}
              className="w-full flex items-center justify-center gap-3 bg-[#E85D04] hover:bg-[#C2410C] disabled:bg-white/10 disabled:text-white/30 text-white py-4 rounded-xl text-lg font-semibold transition-colors min-h-[56px]"
            >
              {payLoading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> {tr('Procesando…', 'Processing…')}</>
                : <><CreditCard className="w-5 h-5" /> {tr('Pagar y reservar', 'Pay & book')} ${selectedTotal.toFixed(2)}</>}
            </button>
          )}
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className={
              selectedTotal != null
                ? 'w-full flex items-center justify-center gap-2 border border-white/15 hover:border-white/40 text-white/80 py-3.5 rounded-xl text-base font-medium transition-colors min-h-[52px] disabled:opacity-40'
                : 'w-full flex items-center justify-center gap-3 bg-[#E85D04] hover:bg-[#C2410C] disabled:bg-white/10 disabled:text-white/30 text-white py-4 rounded-xl text-lg font-semibold transition-colors min-h-[56px]'
            }
          >
            {submitting
              ? <><Loader2 className="w-5 h-5 animate-spin" /> {tr('Enviando…', 'Sending…')}</>
              : <><MessageCircle className="w-5 h-5" /> {tr('Solicitar por WhatsApp', 'Request by WhatsApp')}</>}
          </button>
        </div>
        <p className="text-white/30 text-xs text-center flex items-center justify-center gap-1.5">
          {selectedTotal != null ? (
            <><ShieldCheck className="w-3.5 h-3.5 shrink-0" /> {tr('Pago seguro con 3-D Secure (Visa · Mastercard · Amex). O reserva por WhatsApp y coordinamos el pago.', 'Secure 3-D Secure payment (Visa · Mastercard · Amex). Or book by WhatsApp and we arrange payment.')}</>
          ) : (
            tr('Es una solicitud — confirmamos disponibilidad y pago por WhatsApp.', 'This is a request — we confirm availability and payment by WhatsApp.')
          )}
        </p>
      </form>
      </>
      )}

      {(payStep === 'payment' || payStep === '3ds') && payBooking && (
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <button
            type="button"
            onClick={() => { setPayStep('none'); setError('') }}
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {tr('Volver', 'Back')}
          </button>

          <div className="bg-[#141414] border border-white/10 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 text-[#E85D04] text-xs font-bold uppercase tracking-wider mb-2">
              <BedDouble className="w-4 h-4" /> {tr('Estadía', 'Stay')}
            </div>
            <h1 className="font-display text-xl text-white leading-tight">{es ? payBooking.nameEs : payBooking.nameEn}</h1>
            <p className="text-white/60 text-sm mt-1">
              {payBooking.checkIn} → {payBooking.checkOut} · {payBooking.nights} {payBooking.nights === 1 ? tr('noche', 'night') : tr('noches', 'nights')} · {payBooking.guests} {payBooking.guests === 1 ? tr('huésped', 'guest') : tr('huéspedes', 'guests')}
            </p>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10">
              <span className="text-white/60">{tr('Total a pagar', 'Total to pay')}</span>
              <span className="text-2xl font-bold text-white tabular-nums">${payBooking.total.toFixed(2)}</span>
            </div>
          </div>

          <CardPaymentForm onSubmit={handleStayPayment} loading={payLoading} error={error} />
        </div>
      )}

      {payStep === '3ds' && redirectData && orderId && (
        <ThreeDSecureModal
          redirectData={redirectData}
          orderId={orderId}
          onComplete={handle3DSComplete}
          onClose={() => {
            setRedirectData(null)
            setPayStep('payment')
            setError(tr('Verificación cancelada. Puedes intentar de nuevo.', 'Verification cancelled. You can try again.'))
          }}
        />
      )}
    </div>
  )
}
