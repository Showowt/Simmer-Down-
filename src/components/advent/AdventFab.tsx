'use client'

/**
 * Floating gift above the ANIMA button — the client's sketch ("un símbolo de
 * un regalito, aquí donde lo dibujé"). Shows only while the Calendario de
 * Adviento is switched on in /admin/adviento, carries a HOY badge on drawer
 * days, and stays out of the way on the calendar itself and at checkout.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { Gift } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useAdventStatus } from '@/lib/use-advent-status'

const HIDDEN_ON = ['/adviento', '/checkout', '/carrito', '/cart']

export default function AdventFab() {
  const status = useAdventStatus()
  const pathname = usePathname() ?? ''
  const reduceMotion = useReducedMotion()
  const { t } = useI18n()

  if (!status.active) return null
  if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null

  const label = t({ es: 'Calendario de Adviento', en: 'Advent Calendar' })

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 260, delay: 0.3 }}
      className="group fixed right-3 bottom-[calc(8.5rem+env(safe-area-inset-bottom))] lg:right-6 lg:bottom-[10.5rem] z-[9998]"
    >
      <Link
        href="/adviento"
        aria-label={status.todayIsDrawer ? `${label} — ${t({ es: '¡casilla nueva hoy!', en: 'new drawer today!' })}` : label}
        data-testid="advent-fab"
        className="relative flex w-11 h-11 lg:w-14 lg:h-14 items-center justify-center rounded-full text-white shadow-lg shadow-black/40 ring-2 ring-[#F5C451]/70 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F5C451]"
        style={{ background: 'radial-gradient(circle at 35% 30%, #E23A4E 0%, #B5233A 55%, #7E1222 100%)' }}
      >
        <motion.span
          className="flex"
          animate={reduceMotion ? undefined : { rotate: [0, -14, 11, -7, 4, 0] }}
          transition={reduceMotion ? undefined : { duration: 0.9, repeat: Infinity, repeatDelay: 5 }}
        >
          <Gift className="w-5 h-5 lg:w-6 lg:h-6" aria-hidden />
        </motion.span>
        {status.todayIsDrawer && (
          <span className="absolute -top-1.5 -right-1.5 rounded-full bg-[#F5C451] px-1.5 py-px text-[9px] font-bold tracking-wide text-[#5A1A0C] shadow">
            {t({ es: 'HOY', en: 'TODAY' })}
          </span>
        )}
      </Link>
      <span className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 hidden lg:block whitespace-nowrap rounded-md border border-white/10 bg-[#1A1A1A] px-3 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </motion.div>
  )
}
