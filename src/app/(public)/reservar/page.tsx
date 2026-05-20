'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Calendar, Clock, Users, User, Phone, MessageCircle, Check, ChevronRight } from 'lucide-react'
import { LOCATIONS, generateReservationUrl, isLocationOpen, type Location } from '@/lib/data'
import { useTranslation } from '@/lib/store'

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20]

function getTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 11; h <= 21; h++) {
    for (const m of ['00', '30']) {
      const displayH = h > 12 ? h - 12 : h
      const period = h >= 12 ? 'PM' : 'AM'
      slots.push(`${displayH}:${m} ${period}`)
    }
  }
  return slots
}

function getNextDays(count: number): { date: Date; label: string; day: string }[] {
  const days: { date: Date; label: string; day: string }[] = []
  const dayNamesEs = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
  const monthNamesEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  for (let i = 0; i < count; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    days.push({ date: d, day: dayNamesEs[d.getDay()], label: `${d.getDate()} ${monthNamesEs[d.getMonth()]}` })
  }
  return days
}

export default function ReservationsPage() {
  const { t, language } = useTranslation()
  const [step, setStep] = useState(0)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [partySize, setPartySize] = useState(2)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [sent, setSent] = useState(false)

  const dates = getNextDays(14)
  const timeSlots = getTimeSlots()

  const handleConfirm = () => {
    if (!selectedLocation || !selectedDate || !selectedTime || !name.trim() || !phone.trim()) return
    const url = generateReservationUrl({
      location: selectedLocation, date: selectedDate, time: selectedTime,
      partySize, customerName: name.trim(), customerPhone: phone.trim(),
      specialRequests: notes.trim() || undefined,
    })
    window.open(url, '_blank')
    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-36 pb-32 px-4">
        <div className="max-w-lg mx-auto text-center py-20">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="w-20 h-20 bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-[#25D366]" />
            </div>
            <h1 className="font-display text-3xl text-white uppercase">{language === 'es' ? '!Reservacion Enviada!' : 'Reservation Sent!'}</h1>
            <p className="text-white/50 mt-3">{language === 'es' ? 'Tu reservacion fue enviada por WhatsApp. Te confirmaremos pronto.' : 'Your reservation was sent via WhatsApp. We\'ll confirm shortly.'}</p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-36 pb-32 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] text-white uppercase leading-none">{t('reserve.title')}</h1>
          <p className="text-white/50 mt-2">{t('reserve.subtitle')}</p>
        </motion.div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[0, 1, 2].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${step >= s ? 'bg-[#E85D04]' : 'bg-white/10'}`} />
          ))}
        </div>

        {/* Step 0: Location */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
            <h2 className="font-display text-xl text-white uppercase mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#E85D04]" />{t('reserve.selectLocation')}
            </h2>
            {LOCATIONS.map((loc) => (
              <button key={loc.id} onClick={() => { setSelectedLocation(loc); setStep(1) }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition ${
                  selectedLocation?.id === loc.id ? 'bg-[#E85D04]/10 border-[#E85D04]' : 'bg-[#1A1A1A] border-white/10 hover:border-white/30'
                }`}>
                <div className="flex items-center gap-3 text-left">
                  <MapPin className="w-5 h-5 text-white/40 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">{loc.shortName}</p>
                    <p className="text-white/40 text-sm">{loc.city}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30" />
              </button>
            ))}
          </motion.div>
        )}

        {/* Step 1: Date, Time, Party Size */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="font-display text-xl text-white uppercase flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#E85D04]" />{t('reserve.date')}
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {dates.map((d) => (
                <button key={d.label} onClick={() => setSelectedDate(d.label)}
                  className={`flex-shrink-0 w-16 py-3 rounded-xl text-center transition ${
                    selectedDate === d.label ? 'bg-[#E85D04] text-white' : 'bg-[#1A1A1A] text-white/50 border border-white/10'
                  }`}>
                  <div className="text-xs font-medium">{d.day}</div>
                  <div className="text-sm font-bold mt-1">{d.label.split(' ')[0]}</div>
                </button>
              ))}
            </div>

            <h2 className="font-display text-xl text-white uppercase flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#E85D04]" />{t('reserve.time')}
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((slot) => (
                <button key={slot} onClick={() => setSelectedTime(slot)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition ${
                    selectedTime === slot ? 'bg-[#E85D04] text-white' : 'bg-[#1A1A1A] text-white/50 border border-white/10'
                  }`}>
                  {slot}
                </button>
              ))}
            </div>

            <h2 className="font-display text-xl text-white uppercase flex items-center gap-2">
              <Users className="w-5 h-5 text-[#E85D04]" />{t('reserve.partySize')}
            </h2>
            <div className="flex gap-2">
              {PARTY_SIZES.map((size) => (
                <button key={size} onClick={() => setPartySize(size)}
                  className={`w-11 h-11 rounded-xl text-sm font-bold transition ${
                    partySize === size ? 'bg-[#E85D04] text-white' : 'bg-[#1A1A1A] text-white/50 border border-white/10'
                  }`}>
                  {size}
                </button>
              ))}
            </div>

            <button onClick={() => { if (selectedDate && selectedTime) setStep(2) }}
              disabled={!selectedDate || !selectedTime}
              className="w-full py-3.5 rounded-xl bg-[#E85D04] hover:bg-[#C2410C] disabled:bg-[#1A1A1A] disabled:text-white/30 text-white font-semibold transition">
              {language === 'es' ? 'Siguiente' : 'Next'}
            </button>
          </motion.div>
        )}

        {/* Step 2: Customer Info + Confirm */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <h2 className="font-display text-xl text-white uppercase flex items-center gap-2">
              <User className="w-5 h-5 text-[#E85D04]" />{language === 'es' ? 'Tus Datos' : 'Your Info'}
            </h2>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('reserve.name')}
              className="w-full h-12 px-4 bg-[#1A1A1A] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#E85D04] focus:outline-none" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('reserve.phone')}
              className="w-full h-12 px-4 bg-[#1A1A1A] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#E85D04] focus:outline-none" />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'es' ? 'Peticiones especiales (opcional)' : 'Special requests (optional)'}
              className="w-full h-20 px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#E85D04] focus:outline-none resize-none" />

            {/* Summary */}
            <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-white/50">{language === 'es' ? 'Ubicacion' : 'Location'}</span><span className="text-white">{selectedLocation?.shortName}</span></div>
              <div className="flex justify-between"><span className="text-white/50">{language === 'es' ? 'Fecha' : 'Date'}</span><span className="text-white">{selectedDate}</span></div>
              <div className="flex justify-between"><span className="text-white/50">{language === 'es' ? 'Hora' : 'Time'}</span><span className="text-white">{selectedTime}</span></div>
              <div className="flex justify-between"><span className="text-white/50">{language === 'es' ? 'Personas' : 'Guests'}</span><span className="text-white">{partySize}</span></div>
            </div>

            <button onClick={handleConfirm} disabled={!name.trim() || !phone.trim()}
              className="w-full py-4 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] disabled:bg-[#1A1A1A] disabled:text-white/30 text-white font-bold text-lg flex items-center justify-center gap-3 transition">
              <MessageCircle className="w-6 h-6" />
              {t('reserve.submit')}
            </button>
          </motion.div>
        )}

        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="mt-4 text-white/40 hover:text-white text-sm transition">
            &larr; {language === 'es' ? 'Atras' : 'Back'}
          </button>
        )}
      </div>
    </div>
  )
}
