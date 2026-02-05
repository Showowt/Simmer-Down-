'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
  ArrowRight,
  Flame,
  Leaf,
  Clock,
  Truck,
  Star,
  MapPin,
  ChevronRight,
  Play,
  Sparkles,
  Users,
  Award,
  Heart,
  Check,
  Plus
} from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { MenuItem } from '@/lib/types'

const featuredPizzas: MenuItem[] = [
  {
    id: 'home-1',
    name: 'The Salvadoreño',
    description: 'Local chorizo, queso fresco, jalapeños, cilantro',
    price: 18.99,
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'home-2',
    name: 'Truffle Mushroom',
    description: 'Wild mushrooms, truffle oil, fontina, arugula',
    price: 22.99,
    image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'home-3',
    name: 'Spicy Diavola',
    description: 'Spicy salami, Calabrian chilis, honey drizzle',
    price: 19.99,
    image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
  },
]

const pizzaBadges: Record<string, string> = {
  'home-1': 'Signature',
  'home-2': "Chef's Pick",
  'home-3': 'Fan Favorite',
}

function FeaturedPizzaCard({ pizza, badge, index }: { pizza: MenuItem; badge: string; index: number }) {
  const addItem = useCartStore((state) => state.addItem)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addItem(pizza)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15 }}
      viewport={{ once: true }}
      className="group relative bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-zinc-700 transition-all"
    >
      {/* Badge */}
      <div className="absolute top-4 left-4 z-10">
        <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          {badge}
        </span>
      </div>

      {/* Image */}
      <div className="aspect-square overflow-hidden">
        <img
          src={pizza.image_url || ''}
          alt={`${pizza.name} pizza - ${pizza.description}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2">{pizza.name}</h3>
        <p className="text-zinc-400 text-sm mb-4">{pizza.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-black text-orange-400">
            ${pizza.price.toFixed(2)}
          </span>
          <AnimatePresence mode="wait">
            {added ? (
              <motion.span
                key="added"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Added!
              </motion.span>
            ) : (
              <motion.button
                key="add"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={handleAdd}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
                aria-label={`Add ${pizza.name} to cart`}
              >
                <Plus className="w-4 h-4" />
                Add to Cart
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

const stats = [
  { value: '50K+', label: 'Happy Customers' },
  { value: '25+', label: 'Pizza Varieties' },
  { value: '4.9', label: 'Average Rating' },
  { value: '2', label: 'Locations' },
]

const testimonials = [
  {
    name: 'María García',
    role: 'Food Blogger',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    quote: 'Best pizza in San Salvador, hands down. The Salvadoreño is a masterpiece.',
  },
  {
    name: 'Carlos Mendez',
    role: 'Regular Customer',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    quote: 'The vibes here are unmatched. Perfect spot for date nights or hanging with friends.',
  },
  {
    name: 'Sofia Reyes',
    role: 'SimmerLover Member',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    quote: 'The loyalty program is amazing! Free pizzas just for being a regular? Yes please!',
  },
]

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-zinc-950 z-10" />
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            poster="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1920"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          {/* Fallback image if no video */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1920)',
            }}
          />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 pt-40">
          <div className="max-w-3xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-8"
            >
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-white/90">El Salvador&apos;s #1 Pizza Experience</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.9] mb-6"
            >
              <span className="text-white">Pizza &</span>
              <br />
              <span className="text-gradient">Good Vibes</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-zinc-300 mb-10 max-w-xl leading-relaxed"
            >
              Handcrafted artisan pizzas baked in wood-fired ovens.
              Fresh ingredients, bold flavors, unforgettable moments.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/menu"
                className="group flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:shadow-2xl hover:shadow-orange-500/30 hover:scale-105 active:scale-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black"
              >
                Order Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/about"
                className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <Play className="w-5 h-5" />
                Our Story
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-3 bg-white/50 rounded-full mt-2"
            />
          </div>
        </motion.div>
      </section>

      {/* Marquee */}
      <section className="bg-orange-500 py-4 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 mx-4">
              {['WOOD-FIRED', 'HANDCRAFTED', 'FRESH DAILY', 'LOCAL INGREDIENTS', 'GOOD VIBES ONLY', 'EST. 2024'].map((text) => (
                <span key={text} className="flex items-center gap-4 text-black font-bold text-lg">
                  <Flame className="w-5 h-5" />
                  {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-zinc-900 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-black text-gradient mb-2">
                  {stat.value}
                </div>
                <div className="text-zinc-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Pizzas */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-orange-400 font-semibold uppercase tracking-wider text-sm mb-4 block"
              >
                Our Signatures
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-black text-white"
              >
                Fan Favorites
              </motion.h2>
            </div>
            <Link
              href="/menu"
              className="group flex items-center gap-2 text-orange-400 hover:text-orange-300 font-semibold transition-colors"
            >
              View Full Menu
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Pizza Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredPizzas.map((pizza, i) => (
              <FeaturedPizzaCard key={pizza.id} pizza={pizza} badge={pizzaBadges[pizza.id]} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Flame, title: 'Wood-Fired', desc: '900°F stone oven perfection' },
              { icon: Leaf, title: 'Fresh Daily', desc: 'Local farm ingredients' },
              { icon: Truck, title: 'Fast Delivery', desc: '30 min or it\'s free' },
              { icon: Heart, title: 'Made with Love', desc: 'Every pizza, every time' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/50 transition-colors group"
              >
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{feature.title}</h3>
                <p className="text-zinc-500 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-400 font-semibold uppercase tracking-wider text-sm mb-4 block"
            >
              Testimonials
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black text-white"
            >
              What People Say
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8"
              >
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-orange-400 fill-orange-400" />
                  ))}
                </div>
                <p className="text-zinc-300 text-lg mb-6 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={`Photo of ${testimonial.name}, ${testimonial.role}`}
                    className="w-12 h-12 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-zinc-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SimmerLovers CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-500" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 mb-6">
                <Users className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">Join 50,000+ Members</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                Become a SimmerLover
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Earn points on every order. Get free pizzas, exclusive deals, and early access to new menu items.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/simmerlovers"
                  className="flex items-center gap-2 bg-black hover:bg-zinc-900 text-white px-8 py-4 rounded-full font-bold text-lg transition-all"
                >
                  Join Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/simmerlovers"
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-8 py-4 rounded-full font-semibold text-lg transition-all"
                >
                  Learn More
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Award, title: 'Free Pizza', desc: 'Every 10th order' },
                { icon: Star, title: 'VIP Access', desc: 'Exclusive events' },
                { icon: Sparkles, title: 'Double Points', desc: 'Birthday month' },
                { icon: Heart, title: 'Early Access', desc: 'New menu items' },
              ].map((perk) => (
                <div key={perk.title} className="bg-white/10 backdrop-blur-md rounded-2xl p-5">
                  <perk.icon className="w-8 h-8 text-white mb-3" />
                  <h3 className="font-bold text-white">{perk.title}</h3>
                  <p className="text-white/70 text-sm">{perk.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Locations Preview */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-400 font-semibold uppercase tracking-wider text-sm mb-4 block"
            >
              Find Us
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black text-white mb-4"
            >
              Our Locations
            </motion.h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Visit us at one of our locations across El Salvador
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                name: 'Zona Rosa',
                address: 'Blvd. del Hipódromo, San Salvador',
                hours: '11:00 AM - 11:00 PM',
                image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
              },
              {
                name: 'Escalón',
                address: 'Paseo General Escalón, San Salvador',
                hours: '11:00 AM - 10:00 PM',
                image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
              },
            ].map((location, i) => (
              <motion.div
                key={location.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-3xl"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10" />
                <img
                  src={location.image}
                  alt={location.name}
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                  <h3 className="text-2xl font-bold text-white mb-2">{location.name}</h3>
                  <p className="text-zinc-300 flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-orange-400" />
                    {location.address}
                  </p>
                  <p className="text-zinc-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-400" />
                    {location.hours}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-semibold transition-colors"
            >
              View All Locations
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-[150px]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8"
          >
            Ready to
            <span className="text-gradient block">Simmer Down?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto"
          >
            Order now for delivery or pickup. Fresh, hot pizza at your door in 30 minutes.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Link
              href="/menu"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-12 py-5 rounded-full font-bold text-xl transition-all hover:shadow-2xl hover:shadow-orange-500/30 hover:scale-105"
            >
              Start Your Order
              <ArrowRight className="w-6 h-6" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
