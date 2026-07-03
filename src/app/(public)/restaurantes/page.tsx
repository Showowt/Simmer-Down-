'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Clock, ChevronRight, Navigation, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { LOCATIONS, isLocationOpen, getGoogleMapsUrl } from '@/lib/data'
import { useTranslation } from '@/lib/store'

const featureLabels: Record<string, Record<string, string>> = {
  'dine-in': { es: 'Comer aquí', en: 'Dine-in' },
  'takeout': { es: 'Para llevar', en: 'Takeout' },
  'delivery': { es: 'Domicilio', en: 'Delivery' },
  'outdoor-seating': { es: 'Terraza', en: 'Outdoor' },
  'parking': { es: 'Parqueo', en: 'Parking' },
  'wifi': { es: 'WiFi', en: 'WiFi' },
  'lake-view': { es: 'Vista al lago', en: 'Lake view' },
  'beach-view': { es: 'Vista al mar', en: 'Beach view' },
  'bar': { es: 'Bar', en: 'Bar' },
  'live-music-weekends': { es: 'Música en vivo', en: 'Live music' },
  'pet-friendly': { es: 'Pet friendly', en: 'Pet friendly' },
  'garden-seating': { es: 'Jardín', en: 'Garden' },
  'surf-parking': { es: 'Surf parking', en: 'Surf parking' },
  'valet-parking': { es: 'Valet', en: 'Valet' },
}

function getCompactHours(location: typeof LOCATIONS[0], lang: string): string[] {
  const h = location.hours
  const mon = h.monday || h.weekday
  const thu = h.thursday || h.weekday
  const fri = h.friday || h.weekend
  const allSame = mon === fri && mon === thu && mon === (h.sunday || h.weekend)

  if (allSame && mon) {
    return [`${lang === 'es' ? 'L-D' : 'Mon-Sun'}: ${mon}`]
  }

  // Check if Mon-Wed differ from Thu
  const monWed = h.monday || h.weekday
  const thursday = h.thursday || h.weekday
  const isClosed = (s: string | undefined) => !s || s.toLowerCase() === 'cerrado' || s.toLowerCase() === 'closed'

  if (isClosed(monWed) && !isClosed(h.wednesday || h.weekday)) {
    // Mon-Tue closed, Wed-Sun open (Surf City pattern)
    return [
      `${lang === 'es' ? 'L-M' : 'Mon-Tue'}: ${lang === 'es' ? 'Cerrado' : 'Closed'}`,
      `${lang === 'es' ? 'M-D' : 'Wed-Sun'}: ${h.wednesday || h.weekday}`,
    ]
  }

  if (monWed !== thursday) {
    // San Benito pattern: Mon-Wed differ from Thu, differ from Fri-Sun
    return [
      `${lang === 'es' ? 'L-M' : 'Mon-Wed'}: ${monWed}`,
      `${lang === 'es' ? 'J' : 'Thu'}: ${thursday}`,
      `${lang === 'es' ? 'V-D' : 'Fri-Sun'}: ${fri}`,
    ]
  }

  // Default: weekday/weekend split
  return [
    `${lang === 'es' ? 'L-J' : 'Mon-Thu'}: ${h.weekday}`,
    `${lang === 'es' ? 'V-D' : 'Fri-Sun'}: ${h.weekend}`,
  ]
}

export default function LocationsPage() {
  const { t, language } = useTranslation()

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-36 pb-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] text-white uppercase leading-none tracking-tight">
            {t('locations.title')}
          </h1>
          <p className="text-white/50 mt-2">{t('locations.subtitle')}</p>
        </motion.div>

        {/* Location Cards */}
        <div className="space-y-6">
          {LOCATIONS.map((location, i) => {
            const isOpen = isLocationOpen(location)
            return (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#1A1A1A] rounded-2xl overflow-hidden border border-white/10 hover:border-[#E85D04]/30 transition-all"
              >
                {/* Image */}
                <div className="relative h-48 sm:h-56 bg-[#0A0A0A]">
                  <Image
                    src={location.image}
                    alt={location.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent" />
                  {/* Open/Closed badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      isOpen ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      {isOpen ? t('locations.open') : t('locations.closed')}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h2 className="font-display text-2xl text-white uppercase">{location.shortName}</h2>
                  <p className="text-white/50 text-sm mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    {location.address}, {location.city}
                  </p>

                  {/* Hours */}
                  <div className="mt-4 flex items-center gap-2 text-sm text-white/40 flex-wrap">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    {getCompactHours(location, language).map((segment, si, arr) => (
                      <span key={si} className="flex items-center gap-2">
                        <span>{segment}</span>
                        {si < arr.length - 1 && <span className="text-white/20">|</span>}
                      </span>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {location.features.slice(0, 5).map((feature) => (
                      <span key={feature} className="px-2.5 py-1 rounded-full text-xs bg-white/5 text-white/50 border border-white/10">
                        {featureLabels[feature]?.[language] || feature}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href={getGoogleMapsUrl(location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-white text-sm font-medium hover:border-white/30 transition"
                    >
                      <Navigation className="w-4 h-4" />
                      {t('locations.directions')}
                    </a>
                    <a
                      href={`tel:${location.phone}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-white text-sm font-medium hover:border-white/30 transition"
                    >
                      <Phone className="w-4 h-4" />
                      {location.phone}
                    </a>
                    <a
                      href={`https://wa.me/${location.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola! Quiero hacer un pedido en ${location.name}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#20BD5A] transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
