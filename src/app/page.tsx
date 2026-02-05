'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, MapPin, Clock, Star } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero - Clear Value Prop */}
      <section className="relative min-h-[90vh] flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1920&q=80"
            alt="Wood-fired Neapolitan pizza fresh from our 900°F oven"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Social Proof Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 mb-8"
          >
            <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
            <span className="text-sm text-white font-medium">4.9 Rating · 1,250+ Reviews</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-6"
          >
            Simmer Down
          </motion.h1>

          {/* Differentiating Value Prop */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-200 mb-4 max-w-2xl mx-auto font-medium"
          >
            72-Hour Fermented Dough · 900°F Wood Fire · Naples Training
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-base text-zinc-400 mb-10 max-w-xl mx-auto"
          >
            El Salvador's highest-rated artisan pizza. Fresh local ingredients.
            Delivered hot in 30 minutes.
          </motion.p>

          {/* CTAs - Both Transactional */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/menu"
              className="group inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold transition-all hover:translate-y-[-2px] hover:shadow-lg hover:shadow-orange-500/25"
            >
              Order Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 text-lg font-semibold backdrop-blur-sm transition-all border border-white/20"
            >
              15% Off First Order
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-8 mt-12 text-sm text-zinc-400"
          >
            <span>🔥 Wood-Fired</span>
            <span>🚀 30 Min Delivery</span>
            <span>📍 2 Locations</span>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-px h-12 bg-gradient-to-b from-white/50 to-transparent"
          />
        </div>
      </section>

      {/* Menu Preview - With Prices in White */}
      <section className="py-24 md:py-32 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-orange-400 font-semibold tracking-widest uppercase text-sm mb-4">
              The Menu
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Signature Pizzas
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'The Salvadoreño',
                size: '12"',
                description: 'Chorizo, queso fresco, jalapeños, cilantro',
                price: '$18.99',
                image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
                badge: 'Signature',
              },
              {
                name: 'Truffle Mushroom',
                size: '12"',
                description: 'Wild mushrooms, truffle oil, fontina, arugula',
                price: '$22.99',
                image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
                badge: 'Popular',
              },
              {
                name: 'Margherita',
                size: '12"',
                description: 'San Marzano tomatoes, fresh mozzarella, basil',
                price: '$14.99',
                image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&q=80',
                badge: null,
              },
            ].map((pizza, i) => (
              <motion.div
                key={pizza.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="aspect-square overflow-hidden mb-6 relative bg-zinc-900">
                  <img
                    src={pizza.image}
                    alt={`${pizza.name} - ${pizza.description}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {pizza.badge && (
                    <span className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 uppercase tracking-wide">
                      {pizza.badge}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{pizza.name}</h3>
                    <span className="text-sm text-zinc-500">{pizza.size}</span>
                  </div>
                  {/* Price in WHITE for contrast */}
                  <span className="text-white text-xl font-bold">{pizza.price}</span>
                </div>
                <p className="text-zinc-400">{pizza.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link
              href="/menu"
              className="group inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold transition-all hover:translate-y-[-2px] hover:shadow-lg hover:shadow-orange-500/25"
            >
              View Full Menu
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* About - Differentiation */}
      <section className="py-24 md:py-32 bg-zinc-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-orange-400 font-semibold tracking-widest uppercase text-sm mb-4">
                Why We're Different
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                Crafted, Not Made
              </h2>
              <div className="space-y-4 text-zinc-300 text-lg leading-relaxed">
                <p>
                  <strong className="text-white">72-hour fermented dough</strong> — slow fermentation
                  develops complex flavors and perfect texture.
                </p>
                <p>
                  <strong className="text-white">900°F wood-fired oven</strong> — authentic Neapolitan
                  baking creates the signature char and crisp.
                </p>
                <p>
                  <strong className="text-white">Naples-trained chef</strong> — Marco trained at
                  Associazione Verace Pizza Napoletana in Italy.
                </p>
                <p>
                  <strong className="text-white">Local Salvadoran ingredients</strong> — fresh produce
                  from farms within 50km of San Salvador.
                </p>
              </div>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-semibold mt-8 transition-colors"
              >
                Meet the team
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80"
                alt="Chef preparing artisan pizza dough with traditional Neapolitan technique"
                className="w-full aspect-square object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Locations - With Open Now Badge */}
      <section className="py-24 md:py-32 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-orange-400 font-semibold tracking-widest uppercase text-sm mb-4">
              Visit Us
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Two Locations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                name: 'Zona Rosa',
                address: 'Boulevard del Hipódromo #510',
                phone: '+503 2263-7890',
                hours: 'Daily 11am – 11pm',
                image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
              },
              {
                name: 'Escalón',
                address: 'Paseo General Escalón #4518',
                phone: '+503 2264-5678',
                hours: 'Daily 11am – 10pm',
                image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
              },
            ].map((location) => (
              <div key={location.name} className="group relative overflow-hidden bg-zinc-900">
                <div className="aspect-[4/3]">
                  <img
                    src={location.image}
                    alt={`${location.name} restaurant interior with warm ambient lighting`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </div>

                {/* Open Now Badge */}
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-2 bg-green-500/90 text-white text-sm font-semibold px-3 py-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Open Now
                  </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white mb-3">{location.name}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      {location.address}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      {location.hours}
                    </div>
                  </div>

                  {/* Clickable Phone + Order CTA */}
                  <div className="flex gap-3">
                    <a
                      href={`tel:${location.phone.replace(/\s/g, '')}`}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 text-center font-semibold transition-colors"
                    >
                      Call
                    </a>
                    <Link
                      href="/menu"
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 text-center font-semibold transition-colors"
                    >
                      Order Here
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - With Urgency */}
      <section className="py-24 md:py-32 bg-orange-500">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Hungry? We deliver.
          </h2>
          <p className="text-xl text-white/90 mb-4">
            Fresh from our oven to your door in 30 minutes.
          </p>
          <p className="text-lg text-white/70 mb-10">
            Use code <span className="font-bold text-white">FIRST15</span> for 15% off your first order.
          </p>
          <Link
            href="/menu"
            className="group inline-flex items-center gap-2 bg-black hover:bg-zinc-900 text-white px-10 py-5 text-xl font-semibold transition-all hover:translate-y-[-2px]"
          >
            Start Your Order
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  )
}
