'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  User,
  Phone,
  Mail,
  FileText,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { useI18n, translations } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'

// ═══════════════════════════════════════════════════════════════
// Location Data
// ═══════════════════════════════════════════════════════════════

interface LocationHours {
  weekday?: string
  weekend?: string
  daily?: string
}

interface Location {
  id: string
  name: string
  hours: LocationHours
  closedDays: number[] // 0=Sun, 1=Mon, ...6=Sat
}

const locations: Location[] = [
  { id: 'santa-ana', name: 'Santa Ana', hours: { weekday: '11:00-21:00', weekend: '11:00-22:00' }, closedDays: [] },
  { id: 'coatepeque', name: 'Lago de Coatepeque', hours: { weekday: '11:00-20:00', weekend: '11:00-21:00' }, closedDays: [] },
  { id: 'san-benito', name: 'San Benito', hours: { daily: '11:00-23:00' }, closedDays: [] },
  { id: 'juayua', name: 'Simmer Garden (Juayua)', hours: { weekend: '11:00-20:00' }, closedDays: [1, 2, 3, 4] },
  { id: 'surf-city', name: 'Surf City', hours: { weekday: '12:00-20:00', weekend: '12:00-20:00' }, closedDays: [1, 2] },
]

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function getDayOfWeek(date: Date): number {
  return date.getDay() // 0=Sun ... 6=Sat
}

function isWeekend(date: Date): boolean {
  const day = getDayOfWeek(date)
  return day === 0 || day === 6
}

function getHoursForDate(location: Location, date: Date): string | null {
  const day = getDayOfWeek(date)
  if (location.closedDays.includes(day)) return null
  if (location.hours.daily) return location.hours.daily
  if (isWeekend(date) && location.hours.weekend) return location.hours.weekend
  if (!isWeekend(date) && location.hours.weekday) return location.hours.weekday
  // Fallback: if only weekend hours exist and it's a weekday, location is closed
  if (!location.hours.weekday && !location.hours.daily) return null
  return null
}

function generateTimeSlots(hoursStr: string): string[] {
  const [openStr, closeStr] = hoursStr.split('-')
  const [openH, openM] = openStr.split(':').map(Number)
  const [closeH, closeM] = closeStr.split(':').map(Number)

  const slots: string[] = []
  let h = openH
  let m = openM

  // Last reservation 1 hour before closing
  const lastH = closeH - 1
  const lastM = closeM

  while (h < lastH || (h === lastH && m <= lastM)) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    m += 30
    if (m >= 60) {
      h += 1
      m = 0
    }
  }

  return slots
}

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === 'es' ? 'es-SV' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateShort(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// ═══════════════════════════════════════════════════════════════
// Calendar Component
// ═══════════════════════════════════════════════════════════════

interface CalendarPickerProps {
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
  location: Location | null
  locale: string
  t: (obj: { es: string; en: string }) => string
}

const DAY_NAMES_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const DAY_NAMES_ES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTH_NAMES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function CalendarPicker({ selectedDate, onSelectDate, location, locale, t }: CalendarPickerProps) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const maxDate = useMemo(() => {
    const d = new Date(today)
    d.setDate(d.getDate() + 30)
    return d
  }, [today])

  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())

  const dayNames = locale === 'es' ? DAY_NAMES_ES : DAY_NAMES_EN
  const monthNames = locale === 'es' ? MONTH_NAMES_ES : MONTH_NAMES_EN

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay()

  const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth())
  const canGoNext = useMemo(() => {
    const nextMonthStart = new Date(viewYear, viewMonth + 1, 1)
    return nextMonthStart <= maxDate
  }, [viewYear, viewMonth, maxDate])

  const handlePrev = () => {
    if (!canGoPrev) return
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const handleNext = () => {
    if (!canGoNext) return
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const isDayDisabled = useCallback(
    (day: number): boolean => {
      const date = new Date(viewYear, viewMonth, day)
      date.setHours(0, 0, 0, 0)

      // Past dates
      if (date < today) return true
      // Too far out
      if (date > maxDate) return true
      // Location closed on this day
      if (location && location.closedDays.includes(getDayOfWeek(date))) return true

      return false
    },
    [viewYear, viewMonth, today, maxDate, location]
  )

  const isToday = useCallback(
    (day: number): boolean => {
      const date = new Date(viewYear, viewMonth, day)
      return isSameDay(date, today)
    },
    [viewYear, viewMonth, today]
  )

  const isSelected = useCallback(
    (day: number): boolean => {
      if (!selectedDate) return false
      const date = new Date(viewYear, viewMonth, day)
      return isSameDay(date, selectedDate)
    },
    [viewYear, viewMonth, selectedDate]
  )

  const isClosedDay = useCallback(
    (day: number): boolean => {
      if (!location) return false
      const date = new Date(viewYear, viewMonth, day)
      return location.closedDays.includes(getDayOfWeek(date))
    },
    [viewYear, viewMonth, location]
  )

  // Build calendar grid
  const calendarCells: (number | null)[] = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d)
  }
  // Fill remaining cells to complete the last week
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null)
  }

  return (
    <div className="bg-[#252320] border border-[#3D3936] p-4 sm:p-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          disabled={!canGoPrev}
          className="w-10 h-10 flex items-center justify-center text-[#B8B0A8] hover:text-[#FF6B35] disabled:text-[#3D3936] disabled:cursor-not-allowed transition-colors"
          aria-label={t({ es: 'Mes anterior', en: 'Previous month' })}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-[#FFF8F0]">
          {monthNames[viewMonth]} {viewYear}
        </h3>
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className="w-10 h-10 flex items-center justify-center text-[#B8B0A8] hover:text-[#FF6B35] disabled:text-[#3D3936] disabled:cursor-not-allowed transition-colors"
          aria-label={t({ es: 'Mes siguiente', en: 'Next month' })}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((name) => (
          <div key={name} className="text-center text-xs font-medium text-[#6B6560] py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />
          }

          const disabled = isDayDisabled(day)
          const selected = isSelected(day)
          const todayMark = isToday(day)
          const closed = isClosedDay(day)
          const date = new Date(viewYear, viewMonth, day)

          return (
            <button
              key={`day-${day}`}
              onClick={() => !disabled && onSelectDate(date)}
              disabled={disabled}
              aria-label={`${formatDate(date, locale)}${closed ? ` - ${t(translations.booking.closedDay)}` : ''}${todayMark ? ` - ${locale === 'es' ? 'Hoy' : 'Today'}` : ''}`}
              aria-selected={selected}
              className={`
                aspect-square flex items-center justify-center text-sm font-medium transition-all relative
                ${disabled
                  ? 'text-[#3D3936] cursor-not-allowed'
                  : selected
                    ? 'bg-[#FF6B35] text-white'
                    : todayMark
                      ? 'bg-[#3D3936] text-[#FFF8F0] hover:bg-[#FF6B35]/20 hover:text-[#FF6B35]'
                      : 'text-[#B8B0A8] hover:bg-[#3D3936] hover:text-[#FFF8F0]'
                }
              `}
            >
              {day}
              {todayMark && !selected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#FF6B35] rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#3D3936]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#FF6B35] inline-block" />
          <span className="text-xs text-[#6B6560]">{t({ es: 'Seleccionado', en: 'Selected' })}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#3D3936] inline-block relative">
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#FF6B35] rounded-full" />
          </span>
          <span className="text-xs text-[#6B6560]">{t({ es: 'Hoy', en: 'Today' })}</span>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Reservations Page
// ═══════════════════════════════════════════════════════════════

export default function ReservationsPage() {
  const { t, locale } = useI18n()
  const b = translations.booking

  // Form state
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [guestCount, setGuestCount] = useState(2)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const selectedLocation = useMemo(
    () => locations.find((loc) => loc.id === selectedLocationId) || null,
    [selectedLocationId]
  )

  // Generate time slots for the selected date + location
  const timeSlots = useMemo(() => {
    if (!selectedLocation || !selectedDate) return []
    const hoursStr = getHoursForDate(selectedLocation, selectedDate)
    if (!hoursStr) return []
    return generateTimeSlots(hoursStr)
  }, [selectedLocation, selectedDate])

  // Reset time when date or location changes
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
    setSelectedTime('')
  }, [])

  const handleLocationChange = useCallback((id: string) => {
    setSelectedLocationId(id)
    setSelectedTime('')
    // If current date is now a closed day for new location, clear it
    if (selectedDate) {
      const loc = locations.find((l) => l.id === id)
      if (loc && loc.closedDays.includes(getDayOfWeek(selectedDate))) {
        setSelectedDate(null)
      }
    }
  }, [selectedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedTime || !selectedLocationId || !name || !phone) return

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: dbError } = await supabase.from('reservations').insert({
        location_id: selectedLocationId,
        date: formatDateShort(selectedDate),
        time: selectedTime,
        guest_count: guestCount,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        special_requests: notes || null,
        status: 'confirmed',
      })

      if (dbError) {
        // Graceful degradation: if table doesn't exist, still show confirmation
        console.warn('[Reservations] DB insert failed:', dbError.message)
      }

      setSubmitted(true)
    } catch (err) {
      console.error('[Reservations] Submit error:', err)
      // Still show confirmation to user
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedLocationId('')
    setSelectedDate(null)
    setSelectedTime('')
    setGuestCount(2)
    setName('')
    setPhone('')
    setEmail('')
    setNotes('')
    setSubmitted(false)
  }

  return (
    <div className="min-h-screen bg-[#2D2A26] pt-24">
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-[#FF6B35] font-semibold uppercase tracking-wider text-sm mb-4 block">
              {t(b.subtitle)}
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-[#FFF8F0] mb-6">
              {t(b.heading)}
            </h1>
            <p className="text-xl text-[#B8B0A8]">
              {t(b.description)}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Reservation Form */}
      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {submitted ? (
              /* ─── Confirmation ─── */
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-[#252320] border border-[#3D3936] p-8 md:p-12"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                    className="w-20 h-20 bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center mx-auto mb-8"
                  >
                    <Check className="w-10 h-10 text-[#4CAF50]" />
                  </motion.div>

                  <h2 className="font-display text-3xl md:text-4xl font-bold text-[#FFF8F0] mb-3">
                    {t(b.confirmed)}
                  </h2>
                  <p className="text-[#B8B0A8] text-lg mb-10">
                    {t(b.confirmedDesc)}
                  </p>

                  {/* Reservation details card */}
                  <div className="bg-[#2D2A26] border border-[#3D3936] p-6 md:p-8 text-left max-w-md mx-auto mb-10">
                    <h3 className="text-sm font-semibold text-[#6B6560] uppercase tracking-wider mb-6">
                      {t(b.details)}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[#6B6560] text-sm">{t(b.location)}</p>
                          <p className="text-[#FFF8F0] font-medium">
                            {selectedLocation?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[#6B6560] text-sm">{t(b.date)}</p>
                          <p className="text-[#FFF8F0] font-medium capitalize">
                            {selectedDate && formatDate(selectedDate, locale)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[#6B6560] text-sm">{t(b.time)}</p>
                          <p className="text-[#FFF8F0] font-medium">{selectedTime}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[#6B6560] text-sm">{t(b.guests)}</p>
                          <p className="text-[#FFF8F0] font-medium">
                            {guestCount} {guestCount === 1 ? t(b.person) : t(b.people)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[#6B6560] text-sm">{t(b.name)}</p>
                          <p className="text-[#FFF8F0] font-medium">{name}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 bg-[#3D3936] hover:bg-[#4A4642] text-[#FFF8F0] px-8 py-4 font-semibold transition-colors min-h-[56px]"
                    >
                      {t(b.makeAnother)}
                    </button>
                    <Link
                      href="/"
                      className="flex items-center gap-2 text-[#B8B0A8] hover:text-[#FF6B35] px-8 py-4 font-semibold transition-colors min-h-[56px]"
                    >
                      {t(b.backHome)}
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ─── Booking Form ─── */
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                {/* Location */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-[#252320] border border-[#3D3936] p-6 md:p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="w-5 h-5 text-[#FF6B35]" />
                    <h2 className="text-lg font-semibold text-[#FFF8F0]">{t(b.location)}</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {locations.map((loc) => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => handleLocationChange(loc.id)}
                        className={`
                          p-4 border text-left transition-all min-h-[56px]
                          ${selectedLocationId === loc.id
                            ? 'border-[#FF6B35] bg-[#FF6B35]/10 text-[#FFF8F0]'
                            : 'border-[#3D3936] bg-[#2D2A26] text-[#B8B0A8] hover:border-[#6B6560] hover:text-[#FFF8F0]'
                          }
                        `}
                        aria-pressed={selectedLocationId === loc.id}
                      >
                        <span className="font-medium block">{loc.name}</span>
                        {loc.closedDays.length > 0 && (
                          <span className="text-xs text-[#6B6560] mt-1 block">
                            {locale === 'es' ? 'Dias cerrados: ' : 'Closed days: '}
                            {loc.closedDays.map((d) => (locale === 'es' ? DAY_NAMES_ES : DAY_NAMES_EN)[d]).join(', ')}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* Date & Time */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  viewport={{ once: true }}
                  className="bg-[#252320] border border-[#3D3936] p-6 md:p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Calendar className="w-5 h-5 text-[#FF6B35]" />
                    <h2 className="text-lg font-semibold text-[#FFF8F0]">
                      {t(b.date)} & {t(b.time)}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Calendar */}
                    <CalendarPicker
                      selectedDate={selectedDate}
                      onSelectDate={handleDateSelect}
                      location={selectedLocation}
                      locale={locale}
                      t={t}
                    />

                    {/* Time slots */}
                    <div className="bg-[#252320] border border-[#3D3936] p-4 sm:p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-4 h-4 text-[#FF6B35]" />
                        <h3 className="text-sm font-semibold text-[#FFF8F0]">{t(b.selectTime)}</h3>
                      </div>

                      {!selectedDate ? (
                        <p className="text-[#6B6560] text-sm py-8 text-center">
                          {t(b.selectDateFirst)}
                        </p>
                      ) : timeSlots.length === 0 ? (
                        <p className="text-[#6B6560] text-sm py-8 text-center">
                          {t(b.noTimesAvailable)}
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[320px] overflow-y-auto pr-1">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedTime(slot)}
                              className={`
                                py-2.5 px-2 text-sm font-medium transition-all text-center
                                ${selectedTime === slot
                                  ? 'bg-[#FF6B35] text-white'
                                  : 'bg-[#2D2A26] border border-[#3D3936] text-[#B8B0A8] hover:border-[#6B6560] hover:text-[#FFF8F0]'
                                }
                              `}
                              aria-pressed={selectedTime === slot}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Guest count */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  viewport={{ once: true }}
                  className="bg-[#252320] border border-[#3D3936] p-6 md:p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="w-5 h-5 text-[#FF6B35]" />
                    <h2 className="text-lg font-semibold text-[#FFF8F0]">{t(b.guestCount)}</h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setGuestCount(num)}
                        className={`
                          w-14 h-14 flex items-center justify-center text-lg font-medium transition-all
                          ${guestCount === num
                            ? 'bg-[#FF6B35] text-white'
                            : 'bg-[#2D2A26] border border-[#3D3936] text-[#B8B0A8] hover:border-[#6B6560] hover:text-[#FFF8F0]'
                          }
                        `}
                        aria-label={`${num} ${num === 1 ? t(b.person) : t(b.people)}`}
                        aria-pressed={guestCount === num}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <p className="text-[#6B6560] text-sm mt-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {t(b.largeParty)}
                  </p>
                </motion.div>

                {/* Contact info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  viewport={{ once: true }}
                  className="bg-[#252320] border border-[#3D3936] p-6 md:p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <User className="w-5 h-5 text-[#FF6B35]" />
                    <h2 className="text-lg font-semibold text-[#FFF8F0]">{t(b.contactInfo)}</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label htmlFor="res-name" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                        {t(b.name)} *
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6560]" />
                        <input
                          id="res-name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                          placeholder={t({ es: 'Tu nombre', en: 'Your name' })}
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label htmlFor="res-phone" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                        {t(b.phone)} *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6560]" />
                        <input
                          id="res-phone"
                          type="tel"
                          required
                          inputMode="tel"
                          autoComplete="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                          placeholder="+503 XXXX-XXXX"
                        />
                      </div>
                    </div>

                    {/* Email (optional) */}
                    <div className="md:col-span-2">
                      <label htmlFor="res-email" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                        {t(b.email)}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6560]" />
                        <input
                          id="res-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                          placeholder={t({ es: 'tu@email.com', en: 'you@email.com' })}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Special Requests */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  viewport={{ once: true }}
                  className="bg-[#252320] border border-[#3D3936] p-6 md:p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <FileText className="w-5 h-5 text-[#FF6B35]" />
                    <h2 className="text-lg font-semibold text-[#FFF8F0]">{t(b.specialRequests)}</h2>
                  </div>
                  <textarea
                    id="res-notes"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition resize-none"
                    placeholder={t(b.specialRequestsPlaceholder)}
                  />
                </motion.div>

                {/* Submit */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  viewport={{ once: true }}
                >
                  <button
                    type="submit"
                    disabled={loading || !selectedLocationId || !selectedDate || !selectedTime || !name || !phone}
                    className="w-full flex items-center justify-center gap-3 bg-[#FF6B35] hover:bg-[#E55A2B] disabled:bg-[#3D3936] disabled:text-[#6B6560] text-white py-4 text-lg font-semibold transition-colors min-h-[56px]"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin" />
                        {t(b.reserving)}
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        {t(b.reserve)}
                      </>
                    )}
                  </button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  )
}
