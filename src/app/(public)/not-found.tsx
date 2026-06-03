'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 pt-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* Pizza Icon */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
          className="w-32 h-32 bg-[#E85D04]/10 border border-[#E85D04]/20 flex items-center justify-center mx-auto mb-8"
        >
          <span className="text-7xl">🍕</span>
        </motion.div>

        {/* Error Code - Animated with proper contrast */}
        <div className="text-8xl font-black mb-4 select-none">
          <motion.span
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="inline-block text-white/40"
          >
            4
          </motion.span>
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="inline-block text-[#E85D04]"
          >
            0
          </motion.span>
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.5 }}
            className="inline-block text-white/40"
          >
            4
          </motion.span>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-white mb-4">
          ¡Ups! Esta página fue devorada
        </h2>
        <p className="text-white/60 mb-8">
          Parece que alguien tenía más hambre de lo esperado. La página que buscas no existe o ha sido movida.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-[#E85D04] hover:bg-[#C2410C] text-white px-6 py-4 font-semibold transition-colors min-h-[56px]"
          >
            <Home className="w-5 h-5" />
            Volver al Inicio
          </Link>
          <Link
            href="/menu"
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-4 font-semibold transition-colors min-h-[56px]"
          >
            <Search className="w-5 h-5" />
            Ver Menú
          </Link>
        </div>

        {/* Fun suggestion */}
        <p className="text-white/40 text-sm mt-12">
          Consejo: Ordena una pizza mientras estás aquí. Todo mejora con pizza.
        </p>
      </motion.div>
    </div>
  )
}
