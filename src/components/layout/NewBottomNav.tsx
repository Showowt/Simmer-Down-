'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  UtensilsCrossed,
  CalendarDays,
  MapPin,
  ShoppingBag,
} from 'lucide-react'
import { useCartStore } from '@/lib/store'

interface Tab {
  id: string
  href: string
  label: string
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  matchPrefixes?: string[]
}

const TABS: Tab[] = [
  {
    id: 'inicio',
    href: '/',
    label: 'Inicio',
    Icon: Home,
  },
  {
    id: 'menu',
    href: '/carta',
    label: 'Menú',
    Icon: UtensilsCrossed,
    matchPrefixes: ['/carta'],
  },
  {
    id: 'reservar',
    href: '/reservar',
    label: 'Reservar',
    Icon: CalendarDays,
    matchPrefixes: ['/reservar'],
  },
  {
    id: 'ubicaciones',
    href: '/restaurantes',
    label: 'Ubicaciones',
    Icon: MapPin,
    matchPrefixes: ['/restaurantes'],
  },
  {
    id: 'carrito',
    href: '/carrito',
    label: 'Carrito',
    Icon: ShoppingBag,
    matchPrefixes: ['/carrito'],
  },
]

export default function NewBottomNav() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Subscribe only to itemCount to minimise re-renders
  const itemCount = useCartStore((s) => s.itemCount)

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  const isTabActive = (tab: Tab): boolean => {
    if (tab.href === '/') {
      return pathname === '/'
    }
    if (tab.matchPrefixes) {
      return tab.matchPrefixes.some((prefix) => pathname.startsWith(prefix))
    }
    return pathname === tab.href
  }

  return (
    // Hidden on lg+ (desktop). Shown on mobile and tablet (up to lg breakpoint).
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden h-16 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-white/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegación inferior"
    >
      <div className="flex h-full">
        {TABS.map((tab) => {
          const active = isTabActive(tab)
          const showBadge = tab.id === 'carrito' && mounted && itemCount > 0

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors duration-200 -webkit-tap-highlight-color-transparent ${
                active ? 'text-[#E85D04]' : 'text-white/40 hover:text-white/70'
              }`}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Active indicator bar at top */}
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#E85D04] rounded-b-full"
                  aria-hidden="true"
                />
              )}

              {/* Icon + badge wrapper */}
              <span className="relative">
                <tab.Icon
                  className="w-[22px] h-[22px]"
                  aria-hidden={true}
                />
                {showBadge && (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-[3px] bg-[#E85D04] text-white text-[10px] font-bold flex items-center justify-center rounded-full leading-none"
                    aria-label={`${itemCount} artículos en carrito`}
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </span>

              {/* Label */}
              <span className="text-[10px] font-semibold uppercase tracking-[0.04em] leading-none">
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
