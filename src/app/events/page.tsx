'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, MapPin, Users, Music, Utensils, Crown, Lock, Star, ArrowRight, Sparkles, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useAnimaStore } from '@/store/anima'

// Event tiers based on loyalty
type EventTier = 'public' | 'members' | 'vip' | 'inner_circle'

interface Event {
  id: number
  title: string
  titleEs: string
  description: string
  descriptionEs: string
  date: string
  time: string
  location: string
  image: string
  category: string
  tier: EventTier
  price?: string
  capacity?: number
  spotsLeft?: number
  featured?: boolean
}

const upcomingEvents: Event[] = [
  {
    id: 1,
    title: 'Live Jazz & Pizza Night',
    titleEs: 'Noche de Jazz y Pizza',
    description: 'Live jazz performances while savoring our signature pizzas.',
    descriptionEs: 'Jazz en vivo mientras disfrutas de nuestras pizzas signature. Artistas locales, cocteles artesanales y vibras increíbles.',
    date: 'Todos los Viernes',
    time: '7:00 PM - 11:00 PM',
    location: 'San Benito',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    category: 'Música',
    tier: 'public',
    featured: true,
  },
  {
    id: 2,
    title: 'Pizza Making Workshop',
    titleEs: 'Taller de Pizza Artesanal',
    description: 'Learn the art of pizza making from our head chef.',
    descriptionEs: 'Aprende el arte de hacer pizza con nuestro chef. Experiencia práctica con masa, salsa y técnicas de horno.',
    date: '15 Feb, 2025',
    time: '2:00 PM - 5:00 PM',
    location: 'Santa Ana',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    category: 'Taller',
    tier: 'members',
    price: '$45',
    capacity: 12,
    spotsLeft: 4,
  },
  {
    id: 3,
    title: 'Wine & Pizza Pairing',
    titleEs: 'Maridaje Vino y Pizza',
    description: 'A curated evening of Italian wines perfectly paired with our artisan pizzas.',
    descriptionEs: 'Una velada curada de vinos italianos perfectamente maridados con nuestras pizzas artesanales.',
    date: '22 Feb, 2025',
    time: '6:30 PM - 9:30 PM',
    location: 'Coatepeque',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800',
    category: 'Degustación',
    tier: 'vip',
    price: '$65',
    capacity: 20,
    spotsLeft: 7,
  },
  {
    id: 4,
    title: "Chef's Secret Table",
    titleEs: 'La Mesa Secreta del Chef',
    description: 'An exclusive 10-course experience with our head chef.',
    descriptionEs: 'Una experiencia exclusiva de 10 tiempos con nuestro chef. Menú secreto, ingredientes premium y maridaje incluido.',
    date: '1 Mar, 2025',
    time: '7:00 PM',
    location: 'Santa Ana',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    category: 'Exclusivo',
    tier: 'inner_circle',
    price: '$150',
    capacity: 8,
    spotsLeft: 2,
  },
  {
    id: 5,
    title: 'Kids Pizza Party',
    titleEs: 'Fiesta de Pizza para Niños',
    description: 'Let your little ones create their own mini pizzas!',
    descriptionEs: '¡Deja que tus pequeños creen sus propias mini pizzas! Incluye decoración, juegos y premios. Edades 5-12.',
    date: 'Todos los Sábados',
    time: '11:00 AM - 1:00 PM',
    location: 'Todas las Ubicaciones',
    image: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=800',
    category: 'Familia',
    tier: 'public',
    price: '$25',
  },
  {
    id: 6,
    title: 'Sunset Session',
    titleEs: 'Sesión Atardecer',
    description: 'Pizza and cocktails with the best sunset view.',
    descriptionEs: 'Pizza y cocteles con la mejor vista del atardecer en el lago. Solo para miembros.',
    date: 'Domingos',
    time: '4:00 PM - 7:00 PM',
    location: 'Coatepeque',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    category: 'Experiencia',
    tier: 'members',
  },
]

const tierConfig: Record<EventTier, { label: string; color: string; icon: typeof Star; bgColor: string }> = {
  public: { label: 'Público', color: 'text-green-400', icon: Star, bgColor: 'bg-green-500/10' },
  members: { label: 'Miembros', color: 'text-blue-400', icon: Users, bgColor: 'bg-blue-500/10' },
  vip: { label: 'VIP', color: 'text-purple-400', icon: Crown, bgColor: 'bg-purple-500/10' },
  inner_circle: { label: 'Círculo Interno', color: 'text-orange-400', icon: Sparkles, bgColor: 'bg-orange-500/10' },
}

const loyaltyTierAccess: Record<string, EventTier[]> = {
  bronze: ['public'],
  silver: ['public', 'members'],
  gold: ['public', 'members', 'vip'],
  platinum: ['public', 'members', 'vip', 'inner_circle'],
}

function EventCard({ event, hasAccess }: { event: Event; hasAccess: boolean }) {
  const config = tierConfig[event.tier]
  const TierIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`group bg-zinc-900 border border-zinc-800 overflow-hidden transition-all ${hasAccess ? 'hover:border-zinc-700' : 'opacity-75'}`}
    >
      <div className="aspect-video overflow-hidden relative">
        <img
          src={event.image}
          alt={event.titleEs}
          className={`w-full h-full object-cover transition-transform duration-500 ${hasAccess ? 'group-hover:scale-105' : 'grayscale'}`}
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`${config.bgColor} ${config.color} text-xs font-semibold px-3 py-1 flex items-center gap-1`}>
            <TierIcon className="w-3 h-3" />
            {config.label}
          </span>
        </div>
        {event.price && (
          <div className="absolute top-4 right-4">
            <span className="bg-orange-500 text-white text-sm font-bold px-3 py-1">
              {event.price}
            </span>
          </div>
        )}
        {!hasAccess && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center">
              <Lock className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-zinc-400 text-sm">Requiere nivel {config.label}</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2">{event.titleEs}</h3>
        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{event.descriptionEs}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <Calendar className="w-4 h-4 text-orange-400" />
            {event.date}
          </div>
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <Clock className="w-4 h-4 text-orange-400" />
            {event.time}
          </div>
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <MapPin className="w-4 h-4 text-orange-400" />
            {event.location}
          </div>
        </div>

        {event.spotsLeft && event.capacity && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>Disponibilidad</span>
              <span>{event.spotsLeft} de {event.capacity}</span>
            </div>
            <div className="h-1 bg-zinc-800 overflow-hidden">
              <div
                className={`h-full ${event.spotsLeft <= 3 ? 'bg-red-500' : 'bg-orange-500'}`}
                style={{ width: `${((event.capacity - event.spotsLeft) / event.capacity) * 100}%` }}
              />
            </div>
            {event.spotsLeft <= 3 && (
              <p className="text-red-400 text-xs mt-1">¡Últimos lugares!</p>
            )}
          </div>
        )}

        {hasAccess ? (
          <Link
            href="/contact"
            className="block text-center bg-zinc-800 hover:bg-orange-500 text-white py-3 font-semibold transition-colors min-h-[48px] flex items-center justify-center"
          >
            Reservar
          </Link>
        ) : (
          <Link
            href="/simmerlovers"
            className="block text-center bg-zinc-800 text-zinc-400 py-3 font-semibold min-h-[48px] flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Desbloquear Acceso
          </Link>
        )}
      </div>
    </motion.div>
  )
}

export default function EventsPage() {
  const { loyaltyTier, customerName } = useAnimaStore()
  const [filter, setFilter] = useState<EventTier | 'all'>('all')

  const accessibleTiers = loyaltyTierAccess[loyaltyTier] || ['public']
  const hasAccess = (tier: EventTier) => accessibleTiers.includes(tier)

  const filteredEvents = filter === 'all'
    ? upcomingEvents
    : upcomingEvents.filter((e) => e.tier === filter)

  const featuredEvent = upcomingEvents.find((e) => e.featured)

  return (
    <div className="min-h-screen bg-zinc-950 pt-24">
      {/* Hero */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-orange-400 font-semibold uppercase tracking-wider text-sm mb-4 block">
              La Mesa Privada
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Eventos y Experiencias
            </h1>
            <p className="text-xl text-zinc-400 mb-8">
              Desde música en vivo hasta talleres de pizza, siempre hay algo
              emocionante pasando en Simmer Down.
            </p>

            {/* Access Level Indicator */}
            <div className="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-6 py-3">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <span className="text-zinc-400 text-sm">Tu nivel:</span>
              <span className="text-white font-semibold capitalize">{loyaltyTier}</span>
              {loyaltyTier !== 'platinum' && (
                <Link href="/simmerlovers" className="text-orange-400 text-sm hover:underline flex items-center gap-1">
                  Subir nivel <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tier Filter */}
      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            {(Object.keys(tierConfig) as EventTier[]).map((tier) => {
              const config = tierConfig[tier]
              const TierIcon = config.icon
              const canAccess = hasAccess(tier)
              return (
                <button
                  key={tier}
                  onClick={() => setFilter(tier)}
                  className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                    filter === tier ? 'bg-white text-black' : `${config.color} hover:opacity-80`
                  } ${!canAccess ? 'opacity-50' : ''}`}
                >
                  {!canAccess && <Lock className="w-3 h-3" />}
                  <TierIcon className="w-4 h-4" />
                  {config.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Event */}
      {featuredEvent && filter === 'all' && (
        <section className="pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
              <img
                src={featuredEvent.image}
                alt={featuredEvent.titleEs}
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 z-20 flex items-center">
                <div className="max-w-2xl p-8 md:p-16">
                  <span className="inline-flex items-center gap-2 bg-orange-500 text-white text-sm font-bold px-4 py-2 mb-6">
                    <Star className="w-4 h-4" />
                    Evento Destacado
                  </span>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    {featuredEvent.titleEs}
                  </h2>
                  <p className="text-lg text-zinc-300 mb-6">
                    {featuredEvent.descriptionEs}
                  </p>
                  <div className="flex flex-wrap gap-4 mb-8">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Calendar className="w-5 h-5 text-orange-400" />
                      {featuredEvent.date}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Clock className="w-5 h-5 text-orange-400" />
                      {featuredEvent.time}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <MapPin className="w-5 h-5 text-orange-400" />
                      {featuredEvent.location}
                    </div>
                  </div>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 font-bold transition-all min-h-[56px]"
                  >
                    Reservar Tu Lugar
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Events Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-12">Próximos Eventos</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.filter((e) => !e.featured || filter !== 'all').map((event) => (
              <EventCard key={event.id} event={event} hasAccess={hasAccess(event.tier)} />
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-16">
              <p className="text-zinc-500">No hay eventos en esta categoría</p>
            </div>
          )}
        </div>
      </section>

      {/* Private Events CTA */}
      <section className="py-24 bg-zinc-900/50 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-orange-400 font-semibold uppercase tracking-wider text-sm mb-4 block">
                Eventos Privados
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Tu Evento en Simmer Down
              </h2>
              <p className="text-lg text-zinc-400 mb-8">
                ¿Buscas el lugar perfecto para tu próxima celebración?
                Ofrecemos espacios privados, menús personalizados y servicio completo
                para hacer tu evento inolvidable.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Music className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Cumpleaños</h3>
                    <p className="text-zinc-500 text-sm">Menús personalizados y decoración temática</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Eventos Corporativos</h3>
                    <p className="text-zinc-500 text-sm">Team building, entretenimiento de clientes</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Utensils className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Cenas Privadas</h3>
                    <p className="text-zinc-500 text-sm">Uso exclusivo de nuestros salones privados</p>
                  </div>
                </div>
              </div>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 font-bold transition-all min-h-[56px]"
              >
                Solicitar Información
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                <img
                  src="https://images.unsplash.com/photo-1529543544277-750e7ea18e27?w=400"
                  alt="Evento privado"
                  className="w-full h-48 object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400"
                  alt="Celebración"
                  className="w-full h-48 object-cover mt-8"
                />
                <img
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400"
                  alt="Evento corporativo"
                  className="w-full h-48 object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400"
                  alt="Fiesta"
                  className="w-full h-48 object-cover mt-8"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
