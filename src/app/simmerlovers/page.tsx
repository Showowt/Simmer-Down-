'use client'

import { motion } from 'framer-motion'
import {
  Heart,
  Star,
  Gift,
  Zap,
  Award,
  Users,
  ArrowRight,
  Check,
  Sparkles,
  Crown,
  Flame,
  Pizza,
  Percent,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { useAnimaStore } from '@/store/anima'
import { useEffect, useState } from 'react'

const tiers = [
  {
    name: 'Starter',
    points: '0 - 499',
    color: 'bg-[#6B6560]',
    benefits: [
      '1 punto por cada $1 gastado',
      'Recompensa de cumpleaños',
      'Ofertas exclusivas para miembros',
    ],
  },
  {
    name: 'Flame',
    points: '500 - 1,499',
    color: 'bg-[#FF6B35]',
    benefits: [
      '1.5 puntos por cada $1 gastado',
      'Delivery gratis',
      'Acceso anticipado al menú',
      'Puntos dobles en cumpleaños',
    ],
  },
  {
    name: 'Inferno',
    points: '1,500+',
    color: 'bg-[#E55A2B]',
    benefits: [
      '2 puntos por cada $1 gastado',
      'Toppings premium gratis',
      'Acceso a eventos VIP',
      'Merch exclusivo',
      'Reservaciones prioritarias',
    ],
  },
]

const rewards = [
  { points: 100, reward: 'Bebida Gratis', icon: '🥤' },
  { points: 250, reward: 'Acompañamiento Gratis', icon: '🍟' },
  { points: 500, reward: 'Pizza Mediana Gratis', icon: '🍕' },
  { points: 750, reward: '$15 de Descuento', icon: '💰' },
  { points: 1000, reward: 'Pizza Grande Gratis', icon: '🍕' },
  { points: 1500, reward: 'Pizza Party (4 Pizzas)', icon: '🎉' },
]

const perks = [
  {
    icon: Gift,
    title: 'Recompensas de Cumpleaños',
    description: 'Pizza gratis durante tu mes de cumpleaños, ¡más puntos dobles toda la semana!',
  },
  {
    icon: Zap,
    title: 'Ofertas Flash',
    description: 'Ventas flash exclusivas para miembros y recompensas sorpresa.',
  },
  {
    icon: Star,
    title: 'Acceso Anticipado',
    description: 'Sé el primero en probar nuevos items del menú antes que nadie.',
  },
  {
    icon: Users,
    title: 'Eventos VIP',
    description: 'Invitaciones a eventos exclusivos de degustación y pizza parties.',
  },
  {
    icon: Percent,
    title: 'Descuentos de Miembro',
    description: 'Precios especiales en items selectos todos los días de la semana.',
  },
  {
    icon: Calendar,
    title: 'Salta la Fila',
    description: 'Pickup prioritario y reservaciones en todas las ubicaciones.',
  },
]

function LoyaltyProgress() {
  const { loyaltyTier, loyaltyPoints, visitCount, memory, customerName } = useAnimaStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const tierColors = {
    bronze: 'bg-[#CD7F32]',
    silver: 'bg-[#C0C0C0]',
    gold: 'bg-[#FFD700]',
    platinum: 'bg-[#E5E4E2]',
  }

  return (
    <section className="py-12 bg-[#1F1D1A]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#252320] border border-[#FF6B35]/30 p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-4 h-4 ${tierColors[loyaltyTier]}`} />
            <span className="font-handwritten text-2xl text-[#FF6B35]">Tu Historia Con Nosotros</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center md:text-left">
              <p className="text-[#6B6560] text-sm mb-1">Nombre</p>
              <p className="text-[#FFF8F0] text-xl font-display">{customerName || 'Invitado'}</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-[#6B6560] text-sm mb-1">Nivel</p>
              <p className="text-[#FFF8F0] text-xl font-display capitalize">{loyaltyTier}</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-[#6B6560] text-sm mb-1">Puntos</p>
              <p className="text-[#FF6B35] text-xl font-bold">{loyaltyPoints}</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-[#6B6560] text-sm mb-1">Pedidos</p>
              <p className="text-[#FFF8F0] text-xl font-display">{memory.totalOrders}</p>
            </div>
          </div>

          {memory.favoriteItems.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[#3D3936]">
              <p className="text-[#6B6560] text-sm mb-2">Tus Favoritos</p>
              <div className="flex flex-wrap gap-2">
                {memory.favoriteItems.map((item) => (
                  <span key={item} className="bg-[#3D3936] text-[#FFF8F0] px-3 py-1 text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}

export default function SimmerLoversPage() {
  const { visitCount } = useAnimaStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
            <div className="inline-flex items-center gap-2 bg-[#FF6B35]/10 border border-[#FF6B35]/20 px-4 py-2 mb-6">
              <Heart className="w-4 h-4 text-[#FF6B35] fill-[#FF6B35]" />
              <span className="text-[#FF6B35] font-medium">50,000+ Miembros</span>
            </div>

            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              Únete a la familia
            </p>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-[#FFF8F0] mb-6">
              SimmerLovers
            </h1>
            <p className="text-xl text-[#B8B0A8] mb-10 max-w-2xl mx-auto">
              Nuestro programa de lealtad que te recompensa por lo que ya amas hacer —
              disfrutar pizza increíble. Gana puntos, desbloquea recompensas, obtén beneficios exclusivos.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/login"
                className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-8 py-4 font-bold text-lg transition-all min-h-[56px]"
              >
                Únete Gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 bg-[#252320] hover:bg-[#3D3936] border border-[#3D3936] text-[#FFF8F0] px-8 py-4 font-semibold text-lg transition-all min-h-[56px]"
              >
                Iniciar Sesión
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Personalized Progress (if returning user) */}
      {mounted && visitCount > 1 && <LoyaltyProgress />}

      {/* How It Works */}
      <section className="py-24 bg-[#252320] border-y border-[#3D3936]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              Cómo Funciona
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0]">
              Gana. Canjea. Disfruta.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Users,
                title: 'Regístrate Gratis',
                description: 'Crea tu cuenta en segundos. Sin cargos, sin trucos.',
              },
              {
                step: '02',
                icon: Pizza,
                title: 'Gana Puntos',
                description: 'Obtén 1 punto por cada $1 gastado. Más a medida que subes de nivel.',
              },
              {
                step: '03',
                icon: Gift,
                title: 'Canjea Recompensas',
                description: 'Convierte puntos en pizza gratis, bebidas, acompañamientos y más.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-[#2D2A26] border border-[#3D3936] p-8 h-full">
                  <span className="text-6xl font-display text-[#3D3936]">{item.step}</span>
                  <div className="w-14 h-14 bg-[#FF6B35]/10 flex items-center justify-center my-6">
                    <item.icon className="w-7 h-7 text-[#FF6B35]" />
                  </div>
                  <h3 className="font-display text-xl text-[#FFF8F0] mb-2">{item.title}</h3>
                  <p className="text-[#6B6560]">{item.description}</p>
                </div>

                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-[#3D3936]">
                    <ArrowRight className="w-8 h-8" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              Niveles de Miembro
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0] mb-4">
              Sube de Nivel
            </h2>
            <p className="text-[#B8B0A8] max-w-2xl mx-auto">
              Entre más ordenes, más alto subes. Cada nivel desbloquea mejores recompensas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className={`relative overflow-hidden ${i === 2 ? 'ring-2 ring-[#FF6B35]' : ''}`}
              >
                {i === 2 && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-[#FF6B35] text-white text-xs font-bold px-3 py-1 flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Mejor Valor
                    </span>
                  </div>
                )}

                <div className={`h-2 ${tier.color}`} />

                <div className="bg-[#252320] border border-[#3D3936] border-t-0 p-8">
                  <div className="flex items-center gap-3 mb-2">
                    <Flame className={`w-6 h-6 ${i === 0 ? 'text-[#6B6560]' : 'text-[#FF6B35]'}`} />
                    <h3 className="font-display text-2xl text-[#FFF8F0]">{tier.name}</h3>
                  </div>
                  <p className="text-[#6B6560] mb-6">{tier.points} puntos</p>

                  <ul className="space-y-3">
                    {tier.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-3 text-[#B8B0A8]">
                        <Check className="w-5 h-5 text-[#FF6B35] flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rewards */}
      <section className="py-24 bg-[#252320] border-y border-[#3D3936]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              Menú de Recompensas
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0]">
              Canjea Tus Puntos
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {rewards.map((reward, i) => (
              <motion.div
                key={reward.points}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="bg-[#2D2A26] border border-[#3D3936] p-6 text-center hover:border-[#FF6B35]/50 transition-colors"
              >
                <span className="text-4xl mb-4 block">{reward.icon}</span>
                <p className="text-[#FFF8F0] font-semibold mb-1">{reward.reward}</p>
                <p className="text-[#FF6B35] text-sm font-bold">{reward.points} pts</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Perks Grid */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              Beneficios de Miembro
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0]">
              Más Allá de los Puntos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {perks.map((perk, i) => (
              <motion.div
                key={perk.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-[#252320] border border-[#3D3936] p-6 hover:border-[#FF6B35]/30 transition-colors"
              >
                <div className="w-12 h-12 bg-[#FF6B35]/10 flex items-center justify-center mb-4">
                  <perk.icon className="w-6 h-6 text-[#FF6B35]" />
                </div>
                <h3 className="font-display text-lg text-[#FFF8F0] mb-2">{perk.title}</h3>
                <p className="text-[#6B6560] text-sm">{perk.description}</p>
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
            <Sparkles className="w-12 h-12 text-white mx-auto mb-6" />
            <h2 className="font-display text-4xl md:text-5xl text-white mb-6">
              ¿Listo para Comenzar a Ganar?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Únete a SimmerLovers hoy y obtén 50 puntos de bono solo por registrarte.
              ¡Eso ya es la mitad del camino a una bebida gratis!
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-[#2D2A26] hover:bg-[#1F1D1A] text-white px-10 py-5 font-bold text-xl transition-all min-h-[56px]"
            >
              Únete Gratis — Obtén 50 Puntos
              <ArrowRight className="w-6 h-6" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
