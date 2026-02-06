'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Clock, MapPin, Users } from 'lucide-react'

interface LiveActivity {
  id: string
  type: 'order' | 'event' | 'milestone'
  message: string
  location?: string
  timestamp: Date
}

const pizzaNames = [
  'The Salvadoreño',
  'Margherita',
  'Truffle Mushroom',
  'Spicy Diavola',
  'BBQ Chicken',
  'Pepperoni',
]

const locations = [
  'Santa Ana',
  'Coatepeque',
  'San Benito',
  'Simmer Garden',
  'Surf City',
]

function generateActivity(): LiveActivity {
  const types: LiveActivity['type'][] = ['order', 'order', 'order', 'event', 'milestone']
  const type = types[Math.floor(Math.random() * types.length)]
  const location = locations[Math.floor(Math.random() * locations.length)]
  const pizza = pizzaNames[Math.floor(Math.random() * pizzaNames.length)]

  let message = ''
  switch (type) {
    case 'order':
      message = `${pizza} saliendo del horno`
      break
    case 'event':
      message = 'Música en vivo esta noche'
      break
    case 'milestone':
      message = 'Nuevo miembro Gold'
      break
  }

  return {
    id: Math.random().toString(36).slice(2),
    type,
    message,
    location,
    timestamp: new Date(),
  }
}

export function LiveKitchenPulse() {
  const [pizzaCount, setPizzaCount] = useState(127)
  const [activity, setActivity] = useState<LiveActivity | null>(null)

  useEffect(() => {
    // Increment pizza count randomly
    const pizzaInterval = setInterval(() => {
      setPizzaCount((prev) => prev + Math.floor(Math.random() * 3) + 1)
    }, 15000)

    // Generate random activity
    const activityInterval = setInterval(() => {
      setActivity(generateActivity())
      setTimeout(() => setActivity(null), 4000)
    }, 8000)

    // Initial activity
    setTimeout(() => setActivity(generateActivity()), 2000)

    return () => {
      clearInterval(pizzaInterval)
      clearInterval(activityInterval)
    }
  }, [])

  return (
    <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-4 z-20">
      {/* Pizza Counter */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2"
      >
        <Flame className="w-4 h-4 text-orange-400" />
        <span className="text-sm text-white font-medium">
          <motion.span
            key={pizzaCount}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block"
          >
            {pizzaCount}
          </motion.span>
          {' '}pizzas hoy
        </span>
      </motion.div>

      {/* Live Activity Feed */}
      <AnimatePresence mode="wait">
        {activity && (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2"
          >
            {activity.type === 'order' && <span className="text-orange-400">🍕</span>}
            {activity.type === 'event' && <span className="text-purple-400">🎵</span>}
            {activity.type === 'milestone' && <span className="text-yellow-400">⭐</span>}
            <span className="text-sm text-white">
              {activity.message}
            </span>
            {activity.location && (
              <span className="text-xs text-zinc-400">
                · {activity.location}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function LocationPulse() {
  const [activeLocations, setActiveLocations] = useState<Record<string, number>>({
    'Santa Ana': 12,
    'Coatepeque': 8,
    'San Benito': 28,
    'Simmer Garden': 5,
    'Surf City': 15,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLocations((prev) => {
        const updated = { ...prev }
        const keys = Object.keys(updated)
        const randomKey = keys[Math.floor(Math.random() * keys.length)]
        updated[randomKey] = Math.max(1, updated[randomKey] + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3))
        return updated
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const totalOrders = Object.values(activeLocations).reduce((a, b) => a + b, 0)

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {Object.entries(activeLocations).map(([location, orders]) => {
        const intensity = orders > 20 ? 'high' : orders > 10 ? 'medium' : 'low'
        return (
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`w-2 h-2 ${
                  intensity === 'high'
                    ? 'bg-red-500'
                    : intensity === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                } animate-pulse`}
              />
              <span className="text-sm font-medium text-white">{location}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">{orders}</span>
              <span className="text-xs text-zinc-500">pedidos</span>
            </div>
            <div className="mt-2 h-1 bg-zinc-800 overflow-hidden">
              <motion.div
                className="h-full bg-orange-500"
                initial={{ width: 0 }}
                animate={{ width: `${(orders / 30) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export function TimeAwareGreeting() {
  const [greeting, setGreeting] = useState('')
  const [subtext, setSubtext] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    const day = new Date().getDay()

    if (hour < 12) {
      setGreeting('Buen día para una pizza')
      setSubtext('Desayuno de campeones')
    } else if (hour < 17) {
      setGreeting('La hora perfecta')
      setSubtext('Para un almuerzo memorable')
    } else if (hour < 21) {
      setGreeting('Noche de Simmer Down')
      setSubtext(day === 5 || day === 6 ? 'El fin de semana empieza aquí' : 'Te mereces esto')
    } else {
      setGreeting('Antojo nocturno')
      setSubtext('Abiertos hasta tarde para ti')
    }
  }, [])

  return (
    <div className="text-center">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-orange-400 font-semibold tracking-widest uppercase text-sm mb-2"
      >
        {subtext}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-3xl md:text-4xl font-bold text-white"
      >
        {greeting}
      </motion.h2>
    </div>
  )
}
