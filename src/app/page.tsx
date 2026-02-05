'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, MapPin, Clock } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero - Clean & Confident */}
      <section className="relative min-h-[90vh] flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1920&q=80"
            alt="Wood-fired pizza"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-orange-400 font-medium tracking-widest uppercase text-sm mb-6"
          >
            San Salvador, El Salvador
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-8"
          >
            Simmer Down
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-zinc-300 mb-12 max-w-2xl mx-auto font-light"
          >
            Wood-fired artisan pizza. Fresh ingredients.
            <br className="hidden md:block" />
            Good vibes only.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/menu"
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-medium transition-colors"
            >
              View Menu
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/locations"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 text-lg font-medium backdrop-blur-sm transition-colors"
            >
              Find Us
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-px h-16 bg-gradient-to-b from-white/50 to-transparent"
          />
        </div>
      </section>

      {/* About - Simple & Clean */}
      <section className="py-32 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-orange-400 font-medium tracking-widest uppercase text-sm mb-4">
                Our Philosophy
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                Crafted with intention
              </h2>
              <p className="text-lg text-zinc-400 leading-relaxed mb-8">
                Every pizza starts with 72-hour fermented dough, San Marzano tomatoes,
                and ingredients sourced from local Salvadoran farms. Baked at 900°F
                in our wood-fired oven for 90 seconds of perfection.
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-medium transition-colors"
              >
                Learn our story
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80"
                alt="Freshly baked artisan pizza with basil and tomatoes"
                className="w-full aspect-square object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Menu Preview - Minimal Grid */}
      <section className="py-32 bg-zinc-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-orange-400 font-medium tracking-widest uppercase text-sm mb-4">
              The Menu
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Signature pizzas
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'The Salvadoreño',
                description: 'Chorizo, queso fresco, jalapeños, cilantro',
                price: '$18.99',
                image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
              },
              {
                name: 'Truffle Mushroom',
                description: 'Wild mushrooms, truffle oil, fontina, arugula',
                price: '$22.99',
                image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
              },
              {
                name: 'Margherita',
                description: 'San Marzano tomatoes, fresh mozzarella, basil',
                price: '$14.99',
                image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&q=80',
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
                <div className="aspect-square overflow-hidden mb-6">
                  <img
                    src={pizza.image}
                    alt={pizza.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-white">{pizza.name}</h3>
                  <span className="text-orange-400 font-medium">{pizza.price}</span>
                </div>
                <p className="text-zinc-500">{pizza.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-medium transition-colors"
            >
              Full Menu
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Locations - Clean Cards */}
      <section className="py-32 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-orange-400 font-medium tracking-widest uppercase text-sm mb-4">
              Visit Us
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Two locations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                name: 'Zona Rosa',
                address: 'Boulevard del Hipódromo #510',
                hours: 'Daily 11am – 11pm',
                image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
              },
              {
                name: 'Escalón',
                address: 'Paseo General Escalón #4518',
                hours: 'Daily 11am – 10pm',
                image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
              },
            ].map((location) => (
              <div key={location.name} className="group relative overflow-hidden">
                <div className="aspect-[4/3]">
                  <img
                    src={location.image}
                    alt={`${location.name} restaurant interior`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="text-2xl font-bold text-white mb-3">{location.name}</h3>
                  <div className="flex items-center gap-2 text-zinc-300 mb-2">
                    <MapPin className="w-4 h-4 text-orange-400" />
                    {location.address}
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Clock className="w-4 h-4 text-orange-400" />
                    {location.hours}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Simple */}
      <section className="py-32 bg-orange-500">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Ready to order?
          </h2>
          <p className="text-xl text-white/80 mb-10 font-light">
            Delivery in 30 minutes or pickup at your convenience.
          </p>
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 bg-black hover:bg-zinc-900 text-white px-8 py-4 text-lg font-medium transition-colors"
          >
            Start Your Order
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
