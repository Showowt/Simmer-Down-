'use client'

import { motion } from 'framer-motion'
import { MapPin, Clock, Phone, Navigation, Star, Wifi, Car, Accessibility } from 'lucide-react'
import Link from 'next/link'

const locations = [
  {
    id: 1,
    name: 'Zona Rosa',
    tagline: 'Our Flagship Location',
    address: 'Boulevard del Hipódromo #510, Colonia San Benito',
    city: 'San Salvador, El Salvador',
    phone: '+503 2263-7890',
    whatsapp: '+503 7890-1234',
    hours: {
      weekday: '11:00 AM - 11:00 PM',
      weekend: '11:00 AM - 12:00 AM',
    },
    features: ['Outdoor Patio', 'Full Bar', 'Private Events', 'Free WiFi', 'Valet Parking'],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200',
    mapUrl: 'https://maps.google.com/maps?q=13.6929,-89.2365',
    rating: 4.9,
    reviews: 1250,
  },
  {
    id: 2,
    name: 'Escalón',
    tagline: 'Cozy Neighborhood Spot',
    address: 'Paseo General Escalón #4518, entre 87 y 89 Av. Norte',
    city: 'San Salvador, El Salvador',
    phone: '+503 2264-5678',
    whatsapp: '+503 7890-5678',
    hours: {
      weekday: '11:00 AM - 10:00 PM',
      weekend: '11:00 AM - 11:00 PM',
    },
    features: ['Family Friendly', 'Takeout Window', 'Free WiFi', 'Street Parking', 'Kids Menu'],
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
    mapUrl: 'https://maps.google.com/maps?q=13.7012,-89.2456',
    rating: 4.8,
    reviews: 890,
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
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
              Our Locations
            </h1>
            <p className="text-xl text-zinc-400">
              Visit us at one of our locations across San Salvador.
              Each spot offers the same great pizza with its own unique vibe.
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
                {/* Image */}
                <div className={`relative overflow-hidden rounded-3xl ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className="aspect-[4/3] relative">
                    <img
                      src={location.image}
                      alt={location.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Rating Badge */}
                    <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 flex items-center gap-2">
                      <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                      <span className="text-white font-semibold">{location.rating}</span>
                      <span className="text-white/70 text-sm">({location.reviews} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className={`${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <span className="text-orange-400 text-sm font-medium">{location.tagline}</span>
                  <h2 className="text-3xl md:text-4xl font-black text-white mt-2 mb-6">
                    {location.name}
                  </h2>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{location.address}</p>
                        <p className="text-zinc-500">{location.city}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Mon - Thu: {location.hours.weekday}</p>
                        <p className="text-zinc-500">Fri - Sun: {location.hours.weekend}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{location.phone}</p>
                        <p className="text-zinc-500">Call or WhatsApp</p>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-8">
                    {location.features.map((feature) => (
                      <span
                        key={feature}
                        className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-full text-sm"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-4">
                    <a
                      href={location.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-full font-semibold transition-all"
                    >
                      <Navigation className="w-5 h-5" />
                      Get Directions
                    </a>
                    <a
                      href={`tel:${location.phone}`}
                      className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white px-6 py-3 rounded-full font-semibold transition-all"
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

      {/* Coming Soon */}
      <section className="py-24 bg-zinc-900/50 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-orange-400 font-semibold uppercase tracking-wider text-sm mb-4 block">
              Coming Soon
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
              New Locations Opening 2025
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto mb-8">
              We&apos;re expanding! New locations coming to Santa Tecla and Antiguo Cuscatlán.
              Sign up to be the first to know when we open.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white hover:bg-zinc-100 text-black px-8 py-4 rounded-full font-semibold transition-all"
            >
              Get Notified
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
