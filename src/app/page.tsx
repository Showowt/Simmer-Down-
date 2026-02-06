'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, MapPin, Clock, Star, ChefHat, Flame, Music, Users, Phone } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useAnimaStore } from '@/store/anima'
import { useEffect, useState } from 'react'

// Dynamic imports for client-only components
const FireParticles = dynamic(() => import('@/components/FireParticles'), { ssr: false })

// Location data with personalities
const locations = [
  {
    name: 'Santa Ana',
    vibe: 'El Origen',
    description: 'Frente a la catedral, donde todo comenzó',
    address: '1ra Calle Pte y Callejuela Sur Catedral',
    phone: '+503 2445-5999',
    hours: 'Dom-Jue 11am-9pm | Vie-Sáb 11am-10pm',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    isOpen: true,
  },
  {
    name: 'Coatepeque',
    vibe: 'Vista al Lago',
    description: 'Frente a una maravilla natural',
    address: 'Calle Principal al Lago #119',
    phone: '+503 6831-6907',
    hours: 'Dom-Jue 11am-8pm | Vie-Sáb 11am-9pm',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
    isOpen: true,
  },
  {
    name: 'San Benito',
    vibe: 'Urbano y Vibrante',
    description: 'El corazón cosmopolita',
    address: 'Boulevard del Hipódromo, San Benito',
    phone: '+503 2263-7890',
    hours: 'Lun-Dom 11am-11pm',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    isOpen: true,
  },
  {
    name: 'Juayúa',
    vibe: 'Simmer Garden',
    description: 'La Ruta de las Flores',
    address: 'Calle Principal, Centro Histórico',
    phone: '+503 7890-1234',
    hours: 'Vie-Dom 11am-8pm',
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80',
    isOpen: false,
  },
  {
    name: 'Surf City',
    vibe: 'Frente al Mar',
    description: 'Atardecer, surf y libertad',
    address: 'Boulevard Costa del Sol',
    phone: '+503 7654-3210',
    hours: 'Lun-Dom 10am-10pm',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    isOpen: true,
  },
]

// Signature pizzas
const signaturePizzas = [
  {
    name: 'The Salvadoreño',
    description: 'Chorizo artesanal, queso fresco, jalapeños encurtidos, cilantro',
    price: '$18.99',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
    badge: 'Signature',
    tags: ['spicy'],
  },
  {
    name: 'Truffle Mushroom',
    description: 'Hongos silvestres, aceite de trufa, fontina, arúgula',
    price: '$22.99',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
    badge: 'Popular',
    tags: ['vegetarian'],
  },
  {
    name: 'Margherita DOP',
    description: 'San Marzano, mozzarella di bufala, albahaca fresca',
    price: '$16.99',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&q=80',
    badge: 'Clásica',
    tags: ['vegetarian'],
  },
]

// Live activity simulation
const liveActivities = [
  { location: 'Santa Ana', item: 'The Salvadoreño', time: 'hace 2 min' },
  { location: 'San Benito', item: 'Truffle Mushroom', time: 'hace 5 min' },
  { location: 'Coatepeque', item: 'Margherita', time: 'hace 8 min' },
  { location: 'Surf City', item: 'BBQ Chicken', time: 'hace 12 min' },
]

// Live Activity Ticker Component
function LiveActivityTicker() {
  return (
    <div className="bg-[#252320] border-y border-[#3D3936] py-3 overflow-hidden">
      <div className="flex animate-ticker">
        {[...liveActivities, ...liveActivities].map((activity, i) => (
          <div key={i} className="flex items-center gap-3 px-8 whitespace-nowrap">
            <span className="live-dot" />
            <span className="text-[#FFF8F0] font-medium">{activity.location}</span>
            <span className="text-[#B8B0A8]">ordenó</span>
            <span className="text-[#FF6B35] font-semibold">{activity.item}</span>
            <span className="text-[#6B6560] text-sm">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Personalized Section Component
function PersonalizedSection() {
  const { customerName, visitCount, memory, getTimeGreeting } = useAnimaStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isReturning = visitCount > 1
  const isVIP = visitCount > 10 || memory.totalOrders > 5

  if (isVIP && customerName) {
    return (
      <section className="py-12 bg-[#1F1D1A]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#252320] border border-[#FF6B35]/30 p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-[#FF6B35] animate-pulse" />
              <span className="text-[#FF6B35] font-handwritten text-2xl">VIP Experience</span>
            </div>
            <h2 className="font-display text-3xl text-[#FFF8F0] mb-2">
              {getTimeGreeting()}, {customerName}
            </h2>
            <p className="text-[#B8B0A8] mb-6">
              {memory.totalOrders} pedidos y contando. Tu mesa favorita siempre está lista.
            </p>
            {memory.favoriteItems.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-[#6B6560] text-sm">Tus favoritos:</span>
                {memory.favoriteItems.map((item) => (
                  <span key={item} className="bg-[#3D3936] text-[#FFF8F0] px-3 py-1 text-sm">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    )
  }

  if (isReturning) {
    return (
      <section className="py-12 bg-[#1F1D1A]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-2">Qué bueno verte de nuevo</p>
            <h2 className="font-display text-3xl text-[#FFF8F0]">
              {getTimeGreeting()}. Visita #{visitCount}
            </h2>
          </motion.div>
        </div>
      </section>
    )
  }

  return null
}

export default function Home() {
  const [pizzaCounter, setPizzaCounter] = useState(47832)

  useEffect(() => {
    // Simulate live pizza counter
    const interval = setInterval(() => {
      setPizzaCounter((prev) => prev + Math.floor(Math.random() * 3))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#2D2A26]">
      {/* Hero - The Kitchen Window */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {/* Background with warm overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1920&q=80"
            alt="Pizza artesanal Simmer Down"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#2D2A26]/80" />
          <div className="absolute inset-0 bg-oven-warmth" />
        </div>

        {/* Fire Particles */}
        <FireParticles />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Live Counter Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 bg-[#252320]/80 border border-[#3D3936] px-5 py-3 mb-8"
          >
            <Flame className="w-5 h-5 text-[#FF6B35] animate-oven-pulse" />
            <span className="text-[#FFF8F0] font-medium">
              <span className="text-[#FF6B35] font-bold">{pizzaCounter.toLocaleString()}</span> pizzas servidas
            </span>
            <span className="live-dot" />
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl lg:text-8xl text-[#FFF8F0] tracking-tight mb-6"
          >
            Simmer Down
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-[#FFF8F0] mb-3 max-w-2xl mx-auto"
          >
            Restaurante y Destino Gastro-Musical
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="font-handwritten text-2xl text-[#FF6B35] mb-4"
          >
            12 Años de Historia. 5 Ubicaciones.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base text-[#B8B0A8] mb-10 max-w-xl mx-auto italic"
          >
            Hay lugares que se visitan. Y hay lugares que se recuerdan.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/menu"
              className="group inline-flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-8 py-4 text-lg font-semibold transition-all hover:translate-y-[-2px] min-h-[56px]"
            >
              Ordenar Ahora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/locations"
              className="inline-flex items-center justify-center gap-2 bg-[#252320]/80 hover:bg-[#3D3936] text-[#FFF8F0] px-8 py-4 text-lg font-semibold transition-all border border-[#3D3936] min-h-[56px]"
            >
              <MapPin className="w-5 h-5" />
              Encontrar Ubicación
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-[#B8B0A8]"
          >
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-[#FF6B35]" />
              <span>Pizzas Artesanales</span>
            </div>
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-[#FF6B35]" />
              <span>Música en Vivo</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[#FF6B35] fill-[#FF6B35]" />
              <span>4.9 Rating</span>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-px h-16 bg-[#FFF8F0]/30"
          />
        </div>
      </section>

      {/* Live Activity Ticker */}
      <LiveActivityTicker />

      {/* Personalized Section */}
      <PersonalizedSection />

      {/* Menu Discovery Teaser */}
      <section className="py-24 md:py-32 bg-[#2D2A26]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              Desde el horno
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0] tracking-tight">
              Nuestras Especialidades
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {signaturePizzas.map((pizza, i) => (
              <motion.div
                key={pizza.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="aspect-square overflow-hidden mb-6 relative bg-[#252320]">
                  <img
                    src={pizza.image}
                    alt={pizza.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {pizza.badge && (
                    <span className="absolute top-4 left-4 bg-[#FF6B35] text-white text-xs font-bold px-3 py-1 uppercase tracking-wide">
                      {pizza.badge}
                    </span>
                  )}
                  {pizza.tags?.includes('vegetarian') && (
                    <span className="absolute top-4 right-4 text-xl" title="Vegetariana">
                      🌱
                    </span>
                  )}
                  {pizza.tags?.includes('spicy') && (
                    <span className="absolute top-4 right-4 text-xl" title="Picante">
                      🌶️
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-display text-xl text-[#FFF8F0]">{pizza.name}</h3>
                  <span className="text-white text-xl font-bold">{pizza.price}</span>
                </div>
                <p className="text-[#B8B0A8]">{pizza.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link
              href="/menu"
              className="group inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-8 py-4 text-lg font-semibold transition-all hover:translate-y-[-2px] min-h-[56px]"
            >
              Ver Menú Completo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Locations Pulse */}
      <section className="py-24 md:py-32 bg-[#252320]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              5 destinos únicos
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0] tracking-tight">
              Nuestras Ubicaciones
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.slice(0, 3).map((location, i) => (
              <motion.div
                key={location.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden bg-[#2D2A26] border border-[#3D3936] hover:border-[#FF6B35]/50 transition-all"
              >
                <div className="aspect-[4/3]">
                  <img
                    src={location.image}
                    alt={location.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-[#2D2A26]/70" />
                </div>

                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                  {location.isOpen ? (
                    <span className="inline-flex items-center gap-2 bg-[#4CAF50]/90 text-white text-sm font-semibold px-3 py-1">
                      <span className="w-2 h-2 bg-white animate-pulse" />
                      Abierto
                    </span>
                  ) : (
                    <span className="bg-[#6B6560] text-white text-sm font-semibold px-3 py-1">
                      Cerrado
                    </span>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="font-handwritten text-lg text-[#FF6B35] mb-1">{location.vibe}</p>
                  <h3 className="font-display text-2xl text-[#FFF8F0] mb-2">{location.name}</h3>
                  <p className="text-[#B8B0A8] text-sm mb-4">{location.description}</p>

                  <div className="flex gap-3">
                    <a
                      href={`tel:${location.phone.replace(/\s/g, '')}`}
                      className="flex-1 bg-[#3D3936] hover:bg-[#4A4642] text-[#FFF8F0] py-3 text-center font-semibold transition-colors min-h-[48px] flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      Llamar
                    </a>
                    <Link
                      href="/menu"
                      className="flex-1 bg-[#FF6B35] hover:bg-[#E55A2B] text-white py-3 text-center font-semibold transition-colors min-h-[48px] flex items-center justify-center"
                    >
                      Ordenar
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 text-[#FF6B35] hover:text-[#FF8A5C] font-semibold transition-colors"
            >
              Ver todas las ubicaciones
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* The Story Teaser */}
      <section className="py-24 md:py-32 bg-[#2D2A26]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
                Nuestra historia
              </p>
              <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0] mb-6 tracking-tight">
                Más Que Un Restaurante
              </h2>
              <div className="space-y-4 text-[#B8B0A8] text-lg leading-relaxed">
                <p>
                  Nacimos en <strong className="text-[#FFF8F0]">Santa Ana</strong>, frente a su histórica catedral,
                  como un punto de encuentro donde el tiempo baja la velocidad.
                </p>
                <p>
                  Hoy somos 5 destinos únicos: desde el <strong className="text-[#FFF8F0]">Lago de Coatepeque</strong> hasta
                  las olas de <strong className="text-[#FFF8F0]">Surf City</strong>. Cada ubicación cuenta su propia historia.
                </p>
                <p className="italic text-[#FFF8F0]">
                  12 años creando memorias, una pizza a la vez.
                </p>
              </div>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-[#FF6B35] hover:text-[#FF8A5C] font-semibold mt-8 transition-colors"
              >
                Conoce nuestra historia completa
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800&q=80"
                alt="Chef preparando pizza artesanal"
                className="w-full aspect-square object-cover"
              />
              <div className="absolute inset-0 border border-[#FF6B35]/20" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Events Teaser */}
      <section className="py-24 md:py-32 bg-[#252320]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
            Experiencias únicas
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0] mb-6 tracking-tight">
            Más Que Solo Pizza
          </h2>
          <p className="text-[#B8B0A8] text-lg max-w-2xl mx-auto mb-12">
            Música en vivo, talleres de pizza, maridajes de vino y eventos privados.
            En Simmer Down, cada visita es una experiencia.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Music, title: 'Jazz & Pizza Nights', desc: 'Cada viernes en Zona Rosa' },
              { icon: ChefHat, title: 'Talleres de Pizza', desc: 'Aprende con nuestros chefs' },
              { icon: Users, title: 'Eventos Privados', desc: 'Tu celebración perfecta' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-[#2D2A26] border border-[#3D3936] p-8 hover:border-[#FF6B35]/50 transition-colors"
              >
                <item.icon className="w-10 h-10 text-[#FF6B35] mx-auto mb-4" />
                <h3 className="font-display text-xl text-[#FFF8F0] mb-2">{item.title}</h3>
                <p className="text-[#B8B0A8]">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <Link
            href="/events"
            className="inline-flex items-center gap-2 bg-[#3D3936] hover:bg-[#4A4642] text-[#FFF8F0] px-8 py-4 font-semibold transition-all min-h-[56px]"
          >
            Ver Todos los Eventos
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* CTA - Join SimmerLovers */}
      <section className="py-24 md:py-32 bg-[#FF6B35]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="font-handwritten text-2xl text-white/90 mb-4">
              Únete a la familia
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-white mb-6 tracking-tight">
              SimmerLovers
            </h2>
            <p className="text-xl text-white/90 mb-4">
              Nuestro programa de lealtad que premia cada visita.
            </p>
            <p className="text-lg text-white/70 mb-10">
              Gana puntos, desbloquea recompensas, recibe ofertas exclusivas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/simmerlovers"
                className="group inline-flex items-center justify-center gap-2 bg-[#2D2A26] hover:bg-[#1F1D1A] text-white px-10 py-5 text-xl font-semibold transition-all hover:translate-y-[-2px] min-h-[56px]"
              >
                Únete Gratis
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
