'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Search, Pizza } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* Pizza Icon */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
          className="w-32 h-32 bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-8"
        >
          <span className="text-7xl">🍕</span>
        </motion.div>

        {/* Error Code - Animated */}
        <div className="text-8xl font-black text-zinc-800 mb-4 select-none">
          <motion.span
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="inline-block"
          >
            4
          </motion.span>
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="inline-block text-orange-500"
          >
            0
          </motion.span>
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.5 }}
            className="inline-block"
          >
            4
          </motion.span>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-white mb-4">
          ¡Ups! Esta página fue devorada
        </h2>
        <p className="text-zinc-400 mb-8">
          Parece que alguien tenía más hambre de lo esperado. La página que buscas no existe o ha sido movida.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 font-semibold transition-colors min-h-[56px]"
          >
            <Home className="w-5 h-5" />
            Volver al Inicio
          </Link>
          <Link
            href="/menu"
            className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 font-semibold transition-colors min-h-[56px]"
          >
            <Search className="w-5 h-5" />
            Ver Menú
          </Link>
        </div>

        {/* Fun suggestion */}
        <p className="text-zinc-600 text-sm mt-12">
          Tip: Ordena una pizza mientras estás aquí. Todo mejora con pizza.
        </p>
      </motion.div>
    </div>
  )
}
