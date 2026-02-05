'use client'

import { motion } from 'framer-motion'
import { MapPin, Clock, Phone, Navigation, Star, Wifi, Car, Accessibility } from 'lucide-react'
import Link from 'next/link'

const locations = [
  {
    id: 1,
    name: 'Santa Ana',
    tagline: 'Donde Todo Comenzó',
    address: '1ra Calle Pte y Callejuela Sur Catedral',
    city: 'Santa Ana, El Salvador',
    phone: '+503 2445-5999',
    hours: {
      weekday: 'Dom – Jue: 11am – 9pm',
      weekend: 'Vie – Sáb: 11am – 10pm',
    },
    features: ['Frente a Catedral', 'Historia', 'Cultura', 'Terraza'],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200',
    mapUrl: 'https://maps.google.com/maps?q=13.9942,-89.5597',
    lat: 13.9942,
    lng: -89.5597,
    rating: 4.9,
    reviews: 2100,
  },
  {
    id: 2,
    name: 'Coatepeque',
    tagline: 'Vista al Lago',
    address: 'Calle Principal al Lago de Coatepeque #119',
    city: 'Lago de Coatepeque, El Salvador',
    phone: '+503 6831-6907',
    hours: {
      weekday: 'Dom – Jue: 11am – 8pm',
      weekend: 'Vie – Sáb: 11am – 9pm',
    },
    features: ['Vista al Lago', 'Atardeceres', 'Naturaleza', 'Terraza'],
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200',
    mapUrl: 'https://maps.google.com/maps?q=13.8667,-89.5500',
    lat: 13.8667,
    lng: -89.5500,
    rating: 4.9,
    reviews: 1850,
  },
  {
    id: 3,
    name: 'San Benito',
    tagline: 'El Punto Urbano',
    address: 'Boulevard El Hipódromo #548, San Benito',
    city: 'San Salvador, El Salvador',
    phone: '+503 7487-7792',
    hours: {
      weekday: 'Lun – Mié: 12–2:30pm, 5:30–9pm',
      weekend: 'Jue: 12–2:30pm, 5:30–10pm | Vie–Sáb: 12pm–11pm',
    },
    features: ['Zona Rosa', 'Vida Nocturna', 'Cosmopolita', 'Full Bar'],
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
    mapUrl: 'https://maps.google.com/maps?q=13.6929,-89.2365',
    lat: 13.6929,
    lng: -89.2365,
    rating: 4.8,
    reviews: 1420,
  },
  {
    id: 4,
    name: 'Simmer Garden',
    tagline: 'Ruta de las Flores',
    address: 'Kilómetro 91.5, San José La Majada',
    city: 'Juayúa, Sonsonate, El Salvador',
    phone: '+503 6990-4674',
    hours: {
      weekday: 'Dom – Jue: 11am – 8pm',
      weekend: 'Vie – Sáb: 11am – 8:30pm',
    },
    features: ['Ruta de las Flores', 'Jardín', 'Montaña', 'Naturaleza'],
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1200',
    mapUrl: 'https://maps.google.com/maps?q=13.8467,-89.7456',
    lat: 13.8467,
    lng: -89.7456,
    rating: 4.9,
    reviews: 980,
  },
  {
    id: 5,
    name: 'Surf City',
    tagline: 'Frente al Mar',
    address: 'Hotel Casa Santa Emilia, Conchalio 2',
    city: 'La Libertad, El Salvador',
    phone: '+503 7576-4655',
    hours: {
      weekday: 'Miércoles – Domingo: 12pm – 8pm',
      weekend: '',
    },
    features: ['Playa', 'Surf', 'Atardeceres', 'Brisa Marina'],
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
    mapUrl: 'https://maps.google.com/maps?q=13.4833,-89.3333',
    lat: 13.4833,
    lng: -89.3333,
    rating: 4.8,
    reviews: 760,
  },
]

const amenityIcons: Record<string, React.ElementType> = {
  'Free WiFi': Wifi,
  'Parking': Car,
  'Street Parking': Car,
}

export default function LocationsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-24">
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-orange-400 font-semibold uppercase tracking-wider text-sm mb-4 block">
              Find Us
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Nuestras Ubicaciones
            </h1>
            <p className="text-xl text-zinc-400">
              5 destinos únicos en El Salvador. Cada ubicación tiene su propia personalidad,
              pero todas comparten la misma alma Simmer Down.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Locations Grid */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {locations.map((location, i) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
              >
                {/* Image & Map */}
                <div className={`space-y-4 ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                  {/* Image */}
                  <div className="relative overflow-hidden aspect-[16/9]">
                    <img
                      src={location.image}
                      alt={`${location.name} restaurant interior`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Rating Badge */}
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 flex items-center gap-2">
                      <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                      <span className="text-white font-semibold text-sm">{location.rating}</span>
                      <span className="text-white/70 text-sm">({location.reviews})</span>
                    </div>
                  </div>

                  {/* Interactive Map */}
                  <div className="aspect-[16/9] bg-zinc-900 relative overflow-hidden">
                    <iframe
                      src={`https://www.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map of ${location.name} location`}
                      className="absolute inset-0"
                    />
                  </div>
                </div>

                {/* Details */}
                <div className={`${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <span className="text-orange-400 text-sm font-medium">{location.tagline}</span>
                  <h2 className="text-3xl md:text-4xl font-black text-white mt-2 mb-6">
                    {location.name}
                  </h2>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white">{location.address}</p>
                        <p className="text-zinc-500 text-sm">{location.city}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white">Mon - Thu: {location.hours.weekday}</p>
                        <p className="text-zinc-500 text-sm">Fri - Sun: {location.hours.weekend}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <a href={`tel:${location.phone.replace(/\s/g, '')}`} className="text-white hover:text-orange-400 transition-colors">
                          {location.phone}
                        </a>
                        <p className="text-zinc-500 text-sm">Call or WhatsApp</p>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-8">
                    {location.features.map((feature) => (
                      <span
                        key={feature}
                        className="bg-zinc-900 text-zinc-400 px-3 py-1 text-sm"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={location.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 font-semibold transition-colors"
                    >
                      <Navigation className="w-5 h-5" />
                      Get Directions
                    </a>
                    <a
                      href={`tel:${location.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 font-semibold transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      Call Now
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 12 Years */}
      <section className="py-24 bg-zinc-900/50 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-orange-400 font-semibold uppercase tracking-wider text-sm mb-4 block">
              12 Años de Historia
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Una experiencia que deja huella
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto mb-8">
              Desde Santa Ana hasta Surf City, Simmer Down acompaña a locales y viajeros
              en algunos de los destinos más emblemáticos de El Salvador.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 font-semibold transition-colors"
            >
              Ver Menú
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
