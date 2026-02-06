'use client'

import { motion } from 'framer-motion'
import { MapPin, Clock, Phone, Navigation, Heart, Flame, Star, Music, Waves, Mountain, Coffee } from 'lucide-react'
import Link from 'next/link'
import { useAnimaStore } from '@/store/anima'
import { useState, useEffect } from 'react'

const locations = [
  {
    id: 'santa-ana',
    name: 'Santa Ana',
    vibe: 'El Origen',
    personality: 'Tradición, historia y el encanto de una ciudad que respira cultura',
    description: 'Frente a la histórica catedral de Santa Ana, donde todo comenzó hace 12 años. El lugar donde nació la magia Simmer Down.',
    address: '1ra Calle Pte y Callejuela Sur Catedral',
    city: 'Santa Ana, El Salvador',
    phone: '+503 2445-5999',
    hours: {
      weekday: 'Dom–Jue: 11:00 AM – 9:00 PM',
      weekend: 'Vie–Sáb: 11:00 AM – 10:00 PM',
    },
    features: ['Vista a la Catedral', 'Música en Vivo', 'Terraza'],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    icon: Coffee,
    isOpen: true,
    rating: 4.9,
    reviews: 2100,
    mapUrl: 'https://maps.google.com/?q=Santa+Ana+Cathedral+El+Salvador',
  },
  {
    id: 'coatepeque',
    name: 'Lago de Coatepeque',
    vibe: 'Vista al Lago',
    personality: 'Una experiencia frente a una maravilla natural del mundo',
    description: 'Contempla el atardecer sobre el lago volcánico mientras disfrutas de nuestras especialidades. Una experiencia única en El Salvador.',
    address: 'Calle Principal al Lago #119',
    city: 'Lago de Coatepeque, El Salvador',
    phone: '+503 6831-6907',
    hours: {
      weekday: 'Dom–Jue: 11:00 AM – 8:00 PM',
      weekend: 'Vie–Sáb: 11:00 AM – 9:00 PM',
    },
    features: ['Vista al Lago', 'Atardeceres', 'Zona Privada'],
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
    icon: Mountain,
    isOpen: true,
    rating: 4.9,
    reviews: 1850,
    mapUrl: 'https://maps.google.com/?q=Lago+de+Coatepeque+El+Salvador',
  },
  {
    id: 'san-benito',
    name: 'San Benito',
    vibe: 'Urbano y Vibrante',
    personality: 'El punto urbano, vibrante y cosmopolita de San Salvador',
    description: 'En el corazón de la Zona Rosa, ideal para encuentros, cenas de negocios y noches largas con buena música.',
    address: 'Boulevard del Hipódromo, Colonia San Benito',
    city: 'San Salvador, El Salvador',
    phone: '+503 7487-7792',
    hours: {
      weekday: 'Lun–Dom: 11:00 AM – 11:00 PM',
      weekend: 'Viernes y Sábados hasta medianoche',
    },
    features: ['Zona Rosa', 'Jazz Nights', 'Valet Parking'],
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    icon: Music,
    isOpen: true,
    rating: 4.8,
    reviews: 1420,
    mapUrl: 'https://maps.google.com/?q=San+Benito+San+Salvador',
  },
  {
    id: 'juayua',
    name: 'Simmer Garden',
    vibe: 'Ruta de las Flores',
    personality: 'La Ruta de las Flores en su máxima expresión',
    description: 'Rodeado de naturaleza y el encanto del pueblo mágico de Juayúa. Perfecto para escapadas de fin de semana.',
    address: 'Kilómetro 91.5, San José La Majada',
    city: 'Juayúa, Sonsonate, El Salvador',
    phone: '+503 6990-4674',
    hours: {
      weekday: 'Vie–Dom: 11:00 AM – 8:00 PM',
      weekend: 'Cerrado Lun–Jue',
    },
    features: ['Jardín', 'Café de Altura', 'Montaña'],
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80',
    icon: Coffee,
    isOpen: false,
    rating: 4.9,
    reviews: 980,
    mapUrl: 'https://maps.google.com/?q=Juayua+El+Salvador',
  },
  {
    id: 'surf-city',
    name: 'Surf City',
    vibe: 'Frente al Mar',
    personality: 'Atardecer, surf y libertad que solo la costa ofrece',
    description: 'Nuestra ubicación más nueva, donde el océano y la pizza se encuentran. El spot perfecto después de surfear.',
    address: 'Hotel Casa Santa Emilia, Conchalio 2',
    city: 'La Libertad, El Salvador',
    phone: '+503 7576-4655',
    hours: {
      weekday: 'Mié–Dom: 12:00 PM – 8:00 PM',
      weekend: 'Happy Hour 4–7 PM',
    },
    features: ['Vista al Mar', 'Surf Vibes', 'Cócteles'],
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    icon: Waves,
    isOpen: true,
    rating: 4.8,
    reviews: 760,
    mapUrl: 'https://maps.google.com/?q=El+Tunco+El+Salvador',
  },
]

export default function LocationsPage() {
  const { memory, setPreferredLocation } = useAnimaStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSetFavorite = (locationId: string) => {
    setPreferredLocation(locationId)
  }

  return (
    <div className="min-h-screen bg-[#2D2A26] pt-24">
      {/* Hero */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-oven-warmth opacity-50" />
        <div className="max-w-6xl mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              5 destinos únicos
            </p>
            <h1 className="font-display text-4xl md:text-6xl text-[#FFF8F0] mb-6">
              Nuestras Ubicaciones
            </h1>
            <p className="text-xl text-[#B8B0A8]">
              Cada ubicación cuenta su propia historia. Encuentra tu favorita.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Locations Grid */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="space-y-20">
            {locations.map((location, i) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`}
              >
                {/* Image */}
                <div className={`relative ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={location.image}
                      alt={location.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {location.isOpen ? (
                      <span className="inline-flex items-center gap-2 bg-[#4CAF50] text-white text-sm font-semibold px-4 py-2">
                        <span className="w-2 h-2 bg-white animate-pulse" />
                        Abierto
                      </span>
                    ) : (
                      <span className="bg-[#6B6560] text-white text-sm font-semibold px-4 py-2">
                        Cerrado
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 bg-[#2D2A26]/80 text-white text-sm px-3 py-2">
                      <Star className="w-4 h-4 text-[#FF6B35] fill-[#FF6B35]" />
                      {location.rating}
                    </span>
                  </div>

                  {/* Favorite Button */}
                  {mounted && (
                    <button
                      onClick={() => handleSetFavorite(location.id)}
                      className={`absolute top-4 right-4 w-12 h-12 flex items-center justify-center transition-colors ${
                        memory.preferredLocation === location.id
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-[#2D2A26]/80 text-[#B8B0A8] hover:text-[#FF6B35]'
                      }`}
                      aria-label={memory.preferredLocation === location.id ? 'Tu ubicación favorita' : 'Marcar como favorita'}
                    >
                      <Heart className={`w-6 h-6 ${memory.preferredLocation === location.id ? 'fill-white' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-[#FF6B35]/10 flex items-center justify-center">
                      <location.icon className="w-7 h-7 text-[#FF6B35]" />
                    </div>
                    <div>
                      <p className="font-handwritten text-xl text-[#FF6B35]">{location.vibe}</p>
                      <h2 className="font-display text-3xl md:text-4xl text-[#FFF8F0]">{location.name}</h2>
                    </div>
                  </div>

                  <p className="text-[#B8B0A8] mb-6 text-lg leading-relaxed">
                    {location.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {location.features.map((feature) => (
                      <span
                        key={feature}
                        className="bg-[#252320] border border-[#3D3936] text-[#B8B0A8] px-4 py-2 text-sm"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Details */}
                  <div className="space-y-4 mb-8 bg-[#252320] border border-[#3D3936] p-6">
                    <div className="flex items-start gap-4">
                      <MapPin className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[#FFF8F0]">{location.address}</p>
                        <p className="text-[#6B6560] text-sm">{location.city}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Clock className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[#FFF8F0]">{location.hours.weekday}</p>
                        <p className="text-[#6B6560] text-sm">{location.hours.weekend}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Phone className="w-5 h-5 text-[#FF6B35] flex-shrink-0" />
                      <a href={`tel:${location.phone.replace(/\s/g, '')}`} className="text-[#FFF8F0] hover:text-[#FF6B35] transition-colors">
                        {location.phone}
                      </a>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-4">
                    <Link
                      href="/menu"
                      className="inline-flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-6 py-4 font-semibold transition-all min-h-[56px]"
                    >
                      Ordenar Aquí
                    </Link>
                    <a
                      href={location.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-[#252320] hover:bg-[#3D3936] text-[#FFF8F0] px-6 py-4 font-semibold border border-[#3D3936] transition-all min-h-[56px]"
                    >
                      <Navigation className="w-5 h-5" />
                      Cómo Llegar
                    </a>
                    <a
                      href={`tel:${location.phone.replace(/\s/g, '')}`}
                      className="inline-flex items-center justify-center gap-2 bg-[#252320] hover:bg-[#3D3936] text-[#FFF8F0] px-6 py-4 font-semibold border border-[#3D3936] transition-all min-h-[56px]"
                    >
                      <Phone className="w-5 h-5" />
                      Llamar
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#FF6B35]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Flame className="w-12 h-12 text-white mx-auto mb-6" />
            <h2 className="font-display text-4xl md:text-5xl text-white mb-6">
              Te Esperamos
            </h2>
            <p className="text-xl text-white/90 mb-10">
              12 años de historia. 5 destinos únicos. Una sola experiencia Simmer Down.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-[#2D2A26] hover:bg-[#1F1D1A] text-white px-10 py-5 text-xl font-semibold transition-all min-h-[56px]"
            >
              Ver Menú
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
