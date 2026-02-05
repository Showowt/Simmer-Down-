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

export default function SimmerLoversPage() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-24">
      {/* Hero */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
              <Heart className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span className="text-orange-400 font-medium">50,000+ Members Strong</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6">
              Join the
              <span className="text-gradient block">SimmerLovers</span>
            </h1>
            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
              Our loyalty program that rewards you for what you already love doing —
              eating amazing pizza. Earn points, unlock rewards, get exclusive perks.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/login"
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                Join Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all"
              >
                Sign In
              </Link>
            </div>
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
