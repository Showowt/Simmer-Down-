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
  Calendar,
  MapPin,
  Clock,
  Trophy,
  Target
} from 'lucide-react'
import Link from 'next/link'
import { useAnimaStore } from '@/store/anima'

// Tier configuration matching anima store
const tierConfig: Record<string, { color: string; gradient: string; icon: string; next: string | null; pointsToNext: number }> = {
  bronze: { color: 'from-amber-700 to-amber-800', gradient: 'from-amber-600/20 to-transparent', icon: '🥉', next: 'silver', pointsToNext: 500 },
  silver: { color: 'from-zinc-400 to-zinc-500', gradient: 'from-zinc-400/20 to-transparent', icon: '🥈', next: 'gold', pointsToNext: 1500 },
  gold: { color: 'from-yellow-400 to-amber-500', gradient: 'from-yellow-400/20 to-transparent', icon: '🥇', next: 'platinum', pointsToNext: 5000 },
  platinum: { color: 'from-purple-400 to-indigo-500', gradient: 'from-purple-400/20 to-transparent', icon: '💎', next: null, pointsToNext: 0 },
}

const tiers = [
  {
    name: 'Starter',
    points: '0 - 499',
    color: 'from-zinc-600 to-zinc-700',
    benefits: [
      '1 point per $1 spent',
      'Birthday reward',
      'Member-only offers',
    ],
  },
  {
    name: 'Flame',
    points: '500 - 1,499',
    color: 'from-orange-500 to-orange-600',
    benefits: [
      '1.5 points per $1 spent',
      'Free delivery',
      'Early menu access',
      'Birthday double points',
    ],
  },
  {
    name: 'Inferno',
    points: '1,500+',
    color: 'from-amber-400 to-orange-500',
    benefits: [
      '2 points per $1 spent',
      'Free premium toppings',
      'VIP event access',
      'Exclusive merch drops',
      'Priority reservations',
    ],
  },
]

const rewards = [
  { points: 100, reward: 'Free Drink', icon: '🥤' },
  { points: 250, reward: 'Free Side', icon: '🍟' },
  { points: 500, reward: 'Free Medium Pizza', icon: '🍕' },
  { points: 750, reward: '$15 Off', icon: '💰' },
  { points: 1000, reward: 'Free Large Pizza', icon: '🍕' },
  { points: 1500, reward: 'Pizza Party (4 Pizzas)', icon: '🎉' },
]

const perks = [
  {
    icon: Gift,
    title: 'Birthday Rewards',
    description: 'Free pizza during your birthday month, plus double points all week!',
  },
  {
    icon: Zap,
    title: 'Flash Deals',
    description: 'Exclusive member-only flash sales and surprise rewards.',
  },
  {
    icon: Star,
    title: 'Early Access',
    description: 'Be the first to try new menu items before anyone else.',
  },
  {
    icon: Users,
    title: 'VIP Events',
    description: 'Invitations to exclusive tasting events and pizza parties.',
  },
  {
    icon: Percent,
    title: 'Member Discounts',
    description: 'Special pricing on select items every day of the week.',
  },
  {
    icon: Calendar,
    title: 'Skip the Line',
    description: 'Priority pickup and reservations at all locations.',
  },
]

// Tu Historia Con Nosotros - Personalized Loyalty Story
function LoyaltyStory() {
  const {
    customerName,
    loyaltyTier,
    loyaltyPoints,
    visitCount,
    memory,
    getTimeGreeting
  } = useAnimaStore()

  const config = tierConfig[loyaltyTier] || tierConfig.bronze
  const progress = config.next
    ? Math.min((loyaltyPoints / config.pointsToNext) * 100, 100)
    : 100
  const pointsNeeded = config.next ? config.pointsToNext - loyaltyPoints : 0

  // Calculate member since
  const memberSince = memory.firstVisit
    ? new Date(memory.firstVisit).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    : 'Hoy'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/80 border border-zinc-800 p-8 mb-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-zinc-500 text-sm mb-1">{getTimeGreeting()}</p>
          <h3 className="text-2xl font-bold text-white">
            {customerName ? `${customerName}, ` : ''}Tu Historia Con Nosotros
          </h3>
        </div>
        <div className={`px-4 py-2 bg-gradient-to-r ${config.color} text-white font-bold flex items-center gap-2`}>
          <span className="text-lg">{config.icon}</span>
          <span className="capitalize">{loyaltyTier}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-800/50 p-4 text-center">
          <Trophy className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{loyaltyPoints.toLocaleString()}</p>
          <p className="text-xs text-zinc-500">Puntos</p>
        </div>
        <div className="bg-zinc-800/50 p-4 text-center">
          <Pizza className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{memory.totalOrders}</p>
          <p className="text-xs text-zinc-500">Pedidos</p>
        </div>
        <div className="bg-zinc-800/50 p-4 text-center">
          <Clock className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{visitCount}</p>
          <p className="text-xs text-zinc-500">Visitas</p>
        </div>
        <div className="bg-zinc-800/50 p-4 text-center">
          <Calendar className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-white">{memberSince}</p>
          <p className="text-xs text-zinc-500">Miembro desde</p>
        </div>
      </div>

      {/* Progress to Next Tier */}
      {config.next && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-zinc-400">Progreso a {config.next}</span>
            <span className="text-sm text-orange-400 font-medium">{pointsNeeded} pts restantes</span>
          </div>
          <div className="h-3 bg-zinc-800 overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${config.color}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Favorites & Preferences */}
      {(memory.favoriteItems.length > 0 || memory.preferredLocation) && (
        <div className="border-t border-zinc-800 pt-6">
          <p className="text-sm text-zinc-500 mb-3">Tu perfil Simmer Down</p>
          <div className="flex flex-wrap gap-2">
            {memory.preferredLocation && (
              <span className="bg-zinc-800 text-zinc-300 px-3 py-1 text-sm flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-400" />
                {memory.preferredLocation}
              </span>
            )}
            {memory.favoriteItems.slice(0, 3).map((item) => (
              <span key={item} className="bg-zinc-800 text-zinc-300 px-3 py-1 text-sm flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-400" />
                {item}
              </span>
            ))}
            {memory.dietaryPreferences.map((pref) => (
              <span key={pref} className="bg-green-900/30 text-green-400 px-3 py-1 text-sm">
                {pref === 'vegetarian' ? '🌱' : pref === 'vegan' ? '🌿' : '🌾'} {pref}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      {memory.milestones.length > 0 && (
        <div className="border-t border-zinc-800 pt-6 mt-6">
          <p className="text-sm text-zinc-500 mb-3">Tus logros</p>
          <div className="flex flex-wrap gap-2">
            {memory.milestones.map((milestone) => (
              <span key={milestone} className="bg-orange-500/10 text-orange-400 px-3 py-1 text-sm flex items-center gap-1">
                <Award className="w-3 h-3" />
                {milestone}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function SimmerLoversPage() {
  const { customerName, loyaltyTier, loyaltyPoints } = useAnimaStore()
  const isReturningMember = loyaltyPoints > 0

  return (
    <div className="min-h-screen bg-zinc-950 pt-24">
      {/* Tu Historia Con Nosotros - For returning members */}
      {isReturningMember && (
        <section className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <LoyaltyStory />
          </div>
        </section>
      )}

      {/* Hero */}
      <section className={`${isReturningMember ? 'py-8 md:py-12' : 'py-16 md:py-24'} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/10 blur-[100px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-2 mb-6">
              <Heart className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span className="text-orange-400 font-medium">50,000+ Miembros</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6">
              {isReturningMember ? (
                <>
                  Bienvenido de nuevo,
                  <span className="text-gradient block">{customerName || 'SimmerLover'}</span>
                </>
              ) : (
                <>
                  Únete a los
                  <span className="text-gradient block">SimmerLovers</span>
                </>
              )}
            </h1>
            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
              {isReturningMember
                ? 'Tu lealtad no pasa desapercibida. Cada visita es parte de nuestra historia juntos.'
                : 'Nuestro programa de lealtad que te premia por lo que ya amas hacer — disfrutar pizza increíble. Gana puntos, desbloquea recompensas, obtén beneficios exclusivos.'}
            </p>

            {!isReturningMember && (
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/login"
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 font-bold text-lg transition-all hover:shadow-lg hover:shadow-orange-500/25 min-h-[56px]"
                >
                  Únete Gratis
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white px-8 py-4 font-semibold text-lg transition-all min-h-[56px]"
                >
                  Iniciar Sesión
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-zinc-900/50 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-400 font-semibold uppercase tracking-wider text-sm mb-4 block">
              How It Works
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              Earn. Redeem. Enjoy.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Users,
                title: 'Sign Up Free',
                description: 'Create your account in seconds. No fees, no catches.',
              },
              {
                step: '02',
                icon: Pizza,
                title: 'Earn Points',
                description: 'Get 1 point for every $1 spent. More as you level up.',
              },
              {
                step: '03',
                icon: Gift,
                title: 'Redeem Rewards',
                description: 'Turn points into free pizza, drinks, sides, and more.',
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
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 h-full">
                  <span className="text-6xl font-black text-zinc-800">{item.step}</span>
                  <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center my-6">
                    <item.icon className="w-7 h-7 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-zinc-500">{item.description}</p>
                </div>

                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-zinc-700">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-400 font-semibold uppercase tracking-wider text-sm mb-4 block">
              Member Tiers
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Level Up Your Status
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              The more you order, the higher you climb. Each tier unlocks better rewards.
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
                className={`relative overflow-hidden rounded-3xl ${i === 2 ? 'ring-2 ring-orange-500' : ''}`}
              >
                {i === 2 && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Best Value
                    </span>
                  </div>
                )}

                <div className={`h-2 bg-gradient-to-r ${tier.color}`} />

                <div className="bg-zinc-900 border border-zinc-800 border-t-0 p-8">
                  <div className="flex items-center gap-3 mb-2">
                    <Flame className={`w-6 h-6 ${i === 0 ? 'text-zinc-500' : 'text-orange-400'}`} />
                    <h3 className="text-2xl font-black text-white">{tier.name}</h3>
                  </div>
                  <p className="text-zinc-500 mb-6">{tier.points} points</p>

                  <ul className="space-y-3">
                    {tier.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-3 text-zinc-300">
                        <Check className="w-5 h-5 text-orange-400 flex-shrink-0" />
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
      <section className="py-24 bg-zinc-900/50 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-400 font-semibold uppercase tracking-wider text-sm mb-4 block">
              Rewards Menu
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              Redeem Your Points
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
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center hover:border-orange-500/50 transition-colors"
              >
                <span className="text-4xl mb-4 block">{reward.icon}</span>
                <p className="text-white font-semibold mb-1">{reward.reward}</p>
                <p className="text-orange-400 text-sm font-bold">{reward.points} pts</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Perks Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-400 font-semibold uppercase tracking-wider text-sm mb-4 block">
              Member Perks
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              Beyond the Points
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
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/30 transition-colors"
              >
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4">
                  <perk.icon className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{perk.title}</h3>
                <p className="text-zinc-500 text-sm">{perk.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-500" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, black 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-12 h-12 text-white mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Join SimmerLovers today and get 50 bonus points just for signing up.
              That&apos;s already halfway to a free drink!
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-black hover:bg-zinc-900 text-white px-10 py-5 rounded-full font-bold text-xl transition-all"
            >
              Join Free — Get 50 Points
              <ArrowRight className="w-6 h-6" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
