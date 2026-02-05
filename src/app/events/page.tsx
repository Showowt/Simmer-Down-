'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, MapPin, Users, Music, Utensils, PartyPopper, ArrowRight, Star } from 'lucide-react'
import Link from 'next/link'

const upcomingEvents = [
  {
    id: 1,
    title: 'Live Jazz & Pizza Night',
    description: 'Enjoy live jazz performances while savoring our signature pizzas. Local artists, craft cocktails, and amazing vibes.',
    date: 'Every Friday',
    time: '7:00 PM - 11:00 PM',
    location: 'Zona Rosa',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    category: 'Music',
    featured: true,
  },
  {
    id: 2,
    title: 'Pizza Making Workshop',
    description: 'Learn the art of pizza making from our head chef. Hands-on experience with dough tossing, sauce making, and oven techniques.',
    date: 'Feb 15, 2025',
    time: '2:00 PM - 5:00 PM',
    location: 'Escalón',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    category: 'Workshop',
    price: '$45',
  },
  {
    id: 3,
    title: 'Wine & Pizza Pairing',
    description: 'A curated evening of Italian wines perfectly paired with our artisan pizzas. Limited seats available.',
    date: 'Feb 22, 2025',
    time: '6:30 PM - 9:30 PM',
    location: 'Zona Rosa',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800',
    category: 'Tasting',
    price: '$65',
  },
  {
    id: 4,
    title: 'Kids Pizza Party',
    description: 'Let your little ones create their own mini pizzas! Includes pizza making, games, and prizes. Ages 5-12.',
    date: 'Every Saturday',
    time: '11:00 AM - 1:00 PM',
    location: 'Both Locations',
    image: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=800',
    category: 'Family',
    price: '$25',
  },
]

const privateEventTypes = [
  {
    title: 'Birthday Parties',
    description: 'Make your birthday unforgettable with custom pizza menus and decorations.',
    icon: PartyPopper,
  },
  {
    title: 'Corporate Events',
    description: 'Team building, client entertainment, or office celebrations.',
    icon: Users,
  },
  {
    title: 'Private Dining',
    description: 'Exclusive use of our private rooms for intimate gatherings.',
    icon: Utensils,
  },
]

export default function EventsPage() {
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
              What&apos;s Happening
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
              Events & Experiences
            </h1>
            <p className="text-xl text-zinc-400">
              From live music to pizza workshops, there&apos;s always something
              exciting happening at Simmer Down.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Event */}
      {upcomingEvents.filter(e => e.featured).map((event) => (
        <section key={event.id} className="pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 z-20 flex items-center">
                <div className="max-w-2xl p-8 md:p-16">
                  <span className="inline-flex items-center gap-2 bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full mb-6">
                    <Star className="w-4 h-4" />
                    Featured Event
                  </span>
                  <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                    {event.title}
                  </h2>
                  <p className="text-lg text-zinc-300 mb-6">
                    {event.description}
                  </p>
                  <div className="flex flex-wrap gap-4 mb-8">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Calendar className="w-5 h-5 text-orange-400" />
                      {event.date}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Clock className="w-5 h-5 text-orange-400" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <MapPin className="w-5 h-5 text-orange-400" />
                      {event.location}
                    </div>
                  </div>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 rounded-full font-bold transition-all"
                  >
                    Reserve Your Spot
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      ))}

      {/* Upcoming Events */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white mb-12">Upcoming Events</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.filter(e => !e.featured).map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all"
              >
                <div className="aspect-video overflow-hidden relative">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-zinc-900/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {event.category}
                    </span>
                  </div>
                  {event.price && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                        {event.price}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                  <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{event.description}</p>

                  <div className="space-y-2 mb-6">
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

                  <Link
                    href="/contact"
                    className="block text-center bg-zinc-800 hover:bg-orange-500 text-white py-3 rounded-xl font-semibold transition-colors"
                  >
                    Book Now
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Private Events */}
      <section className="py-24 bg-zinc-900/50 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-orange-400 font-semibold uppercase tracking-wider text-sm mb-4 block">
                Private Events
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                Host Your Event With Us
              </h2>
              <p className="text-lg text-zinc-400 mb-8">
                Looking for the perfect venue for your next celebration?
                We offer private event spaces, custom menus, and full-service catering
                to make your event unforgettable.
              </p>

              <div className="space-y-6 mb-8">
                {privateEventTypes.map((type) => (
                  <div key={type.title} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <type.icon className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{type.title}</h3>
                      <p className="text-zinc-500 text-sm">{type.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 rounded-full font-bold transition-all"
              >
                Inquire Now
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
                  alt="Private event"
                  className="rounded-2xl w-full h-48 object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400"
                  alt="Celebration"
                  className="rounded-2xl w-full h-48 object-cover mt-8"
                />
                <img
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400"
                  alt="Corporate event"
                  className="rounded-2xl w-full h-48 object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400"
                  alt="Party"
                  className="rounded-2xl w-full h-48 object-cover mt-8"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
