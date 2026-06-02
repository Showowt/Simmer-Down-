'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  MessageCircle,
  ChevronLeft,
  Utensils,
  CalendarDays,
  Wifi,
  Car,
  TreePine,
  Waves,
  Music,
  Dog,
  Beer,
  Truck,
  ShoppingBag,
  Sun,
  Mountain,
} from 'lucide-react'
import { useI18n, translations } from '@/lib/i18n'
import { type Location, getGoogleMapsUrl, isLocationOpen } from '@/lib/data'

// ─── Feature icon mapping ─────────────────────────────────

const featureConfig: Record<string, { icon: typeof MapPin; labelEs: string; labelEn: string }> = {
  'dine-in':             { icon: Utensils,       labelEs: 'Comer aqui',       labelEn: 'Dine-in' },
  'takeout':             { icon: ShoppingBag,    labelEs: 'Para llevar',      labelEn: 'Takeout' },
  'delivery':            { icon: Truck,          labelEs: 'Domicilio',        labelEn: 'Delivery' },
  'outdoor-seating':     { icon: Sun,            labelEs: 'Terraza',          labelEn: 'Outdoor Seating' },
  'parking':             { icon: Car,            labelEs: 'Parqueo',          labelEn: 'Parking' },
  'wifi':                { icon: Wifi,           labelEs: 'WiFi Gratis',      labelEn: 'Free WiFi' },
  'lake-view':           { icon: Mountain,       labelEs: 'Vista al Lago',    labelEn: 'Lake View' },
  'beach-view':          { icon: Waves,          labelEs: 'Vista al Mar',     labelEn: 'Beach View' },
  'bar':                 { icon: Beer,           labelEs: 'Bar',              labelEn: 'Bar' },
  'live-music-weekends': { icon: Music,          labelEs: 'Musica en Vivo',   labelEn: 'Live Music' },
  'pet-friendly':        { icon: Dog,            labelEs: 'Pet Friendly',     labelEn: 'Pet Friendly' },
  'garden-seating':      { icon: TreePine,       labelEs: 'Jardin',           labelEn: 'Garden Seating' },
  'surf-parking':        { icon: Car,            labelEs: 'Surf Parking',     labelEn: 'Surf Parking' },
  'valet-parking':       { icon: Car,            labelEs: 'Valet Parking',    labelEn: 'Valet Parking' },
}

// ─── Day labels ───────────────────────────────────────────

const dayLabels = {
  es: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
}

const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

// ─── Animation variants ───────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

// ─── Component ────────────────────────────────────────────

export default function LocationDetailClient({ location }: { location: Location }) {
  const { t, locale } = useI18n()
  const isOpen = isLocationOpen(location)
  const mapsUrl = getGoogleMapsUrl(location)
  const whatsappUrl = `https://wa.me/${location.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    locale === 'es'
      ? `Hola! Quiero hacer un pedido en ${location.name}.`
      : `Hi! I'd like to place an order at ${location.name}.`
  )}`

  const embedUrl = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${location.coordinates.lng}!3d${location.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2ssv!4v1`

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* ═══════ HERO ═══════ */}
      <section className="relative h-[50vh] min-h-[360px] max-h-[520px]">
        <Image
          src={location.heroImage || location.image}
          alt={location.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute top-28 left-4 md:left-8 z-10"
        >
          <Link
            href="/restaurantes"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium transition-colors bg-black/30 backdrop-blur-sm rounded-full px-4 py-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {locale === 'es' ? 'Ubicaciones' : 'Locations'}
          </Link>
        </motion.div>

        {/* Hero text */}
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-8">
          <div className="max-w-5xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              {/* Open/Closed badge */}
              <motion.div variants={fadeUp} className="mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide ${
                    isOpen
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  {isOpen
                    ? locale === 'es' ? 'Abierto Ahora' : 'Open Now'
                    : locale === 'es' ? 'Cerrado' : 'Closed'}
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="font-display text-[clamp(2rem,5vw,3.5rem)] text-white uppercase leading-[1.05] tracking-tight"
              >
                {location.name}
              </motion.h1>

              <motion.p variants={fadeUp} className="text-white/50 text-base md:text-lg mt-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0 text-[#FBBF24]" />
                {location.address}, {location.city}
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 pb-32">

        {/* ─── Quick Actions ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-3 mt-8"
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#20BD5A] transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
          <a
            href={`tel:${location.phone.replace(/\s/g, '')}`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1A1A1A] border border-white/10 text-white text-sm font-medium hover:border-white/30 transition-all"
          >
            <Phone className="w-4 h-4" />
            {location.phone}
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1A1A1A] border border-white/10 text-white text-sm font-medium hover:border-white/30 transition-all"
          >
            <Navigation className="w-4 h-4" />
            {locale === 'es' ? 'Como Llegar' : 'Get Directions'}
          </a>
        </motion.div>

        {/* ─── Info Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">

          {/* Hours Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 bg-[#1A1A1A] rounded-2xl border border-white/10 p-6"
          >
            <h2 className="text-white font-display text-xl uppercase flex items-center gap-2 mb-5">
              <Clock className="w-5 h-5 text-[#FBBF24]" />
              {locale === 'es' ? 'Horarios' : 'Hours'}
            </h2>
            <div className="space-y-0">
              {dayKeys.map((day, i) => {
                const hours = location.hours[day] || (i < 5 ? location.hours.weekday : location.hours.weekend)
                const isClosed = !hours || hours.toLowerCase() === 'cerrado' || hours.toLowerCase() === 'closed'
                const today = new Date().getDay()
                // Convert: JS getDay() 0=Sun, our array 0=Mon
                const adjustedToday = today === 0 ? 6 : today - 1
                const isToday = i === adjustedToday

                return (
                  <div
                    key={day}
                    className={`flex items-center justify-between py-3 border-b border-white/5 last:border-0 ${
                      isToday ? 'bg-[#FBBF24]/5 -mx-3 px-3 rounded-lg' : ''
                    }`}
                  >
                    <span className={`text-sm ${isToday ? 'text-[#FBBF24] font-semibold' : 'text-white/60'}`}>
                      {dayLabels[locale][i]}
                      {isToday && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-[#FBBF24]/70">
                          {locale === 'es' ? 'Hoy' : 'Today'}
                        </span>
                      )}
                    </span>
                    <span className={`text-sm font-medium ${
                      isClosed ? 'text-red-400/70' : isToday ? 'text-white' : 'text-white/80'
                    }`}>
                      {isClosed ? (locale === 'es' ? 'Cerrado' : 'Closed') : hours}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Features / Amenities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-[#1A1A1A] rounded-2xl border border-white/10 p-6"
          >
            <h2 className="text-white font-display text-xl uppercase mb-5">
              {locale === 'es' ? 'Servicios' : 'Amenities'}
            </h2>
            <div className="space-y-3">
              {location.features.map((feature) => {
                const config = featureConfig[feature]
                const Icon = config?.icon || MapPin
                const label = config
                  ? locale === 'es' ? config.labelEs : config.labelEn
                  : feature
                return (
                  <div key={feature} className="flex items-center gap-3 text-white/70">
                    <div className="w-8 h-8 rounded-lg bg-[#FBBF24]/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#FBBF24]" />
                    </div>
                    <span className="text-sm">{label}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* ─── Map Section ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10"
        >
          <h2 className="text-white font-display text-xl uppercase flex items-center gap-2 mb-5">
            <MapPin className="w-5 h-5 text-[#FBBF24]" />
            {locale === 'es' ? 'Ubicacion' : 'Location'}
          </h2>
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#1A1A1A]">
            {/* Interactive Google Maps embed */}
            <div className="relative h-[280px] md:h-[360px]">
              <iframe
                src={embedUrl}
                title={`Mapa de ${location.name}`}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <div className="px-5 py-3 flex items-center justify-between bg-[#111]">
              <p className="text-white/40 text-xs">
                {location.address}, {location.city}
              </p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E85D04] text-white text-xs font-semibold hover:bg-[#C2410C] transition-all"
              >
                <Navigation className="w-3.5 h-3.5" />
                {locale === 'es' ? 'Abrir en Google Maps' : 'Open in Google Maps'}
              </a>
            </div>
          </div>
        </motion.div>

        {/* ─── CTA Sections ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          {/* Menu CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#E85D04]/20 via-[#1A1A1A] to-[#1A1A1A] p-8 group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E85D04]/10 rounded-full blur-3xl" />
            <Utensils className="w-10 h-10 text-[#E85D04] mb-4" />
            <h3 className="font-display text-2xl text-white uppercase">
              {locale === 'es' ? 'Nuestro Menu' : 'Our Menu'}
            </h3>
            <p className="text-white/50 text-sm mt-2 mb-6 leading-relaxed">
              {locale === 'es'
                ? 'Pizza artesanal, pastas, ensaladas y mas.'
                : 'Artisan pizza, pastas, salads and more.'}
            </p>
            <Link
              href="/carta"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E85D04] text-white text-sm font-semibold hover:bg-[#C2410C] transition-all"
            >
              {locale === 'es' ? 'Ver Menu' : 'View Menu'}
            </Link>
          </motion.div>

          {/* Reservation CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#FBBF24]/15 via-[#1A1A1A] to-[#1A1A1A] p-8 group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FBBF24]/10 rounded-full blur-3xl" />
            <CalendarDays className="w-10 h-10 text-[#FBBF24] mb-4" />
            <h3 className="font-display text-2xl text-white uppercase">
              {locale === 'es' ? 'Reservar Mesa' : 'Reserve a Table'}
            </h3>
            <p className="text-white/50 text-sm mt-2 mb-6 leading-relaxed">
              {locale === 'es'
                ? 'Asegura tu mesa para una experiencia perfecta.'
                : 'Secure your table for a perfect experience.'}
            </p>
            <Link
              href="/reservations"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FBBF24] text-[#0A0A0A] text-sm font-semibold hover:bg-[#F59E0B] transition-all"
            >
              {locale === 'es' ? 'Reservar Ahora' : 'Reserve Now'}
            </Link>
          </motion.div>
        </div>

        {/* ─── Back to all locations ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-14 text-center"
        >
          <Link
            href="/restaurantes"
            className="inline-flex items-center gap-2 text-white/50 text-sm font-medium uppercase tracking-wider hover:text-[#FBBF24] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {locale === 'es' ? 'Ver Todas las Ubicaciones' : 'View All Locations'}
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
