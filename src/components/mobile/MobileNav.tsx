'use client'

import { useEffect, useState } from 'react'
import { LocationProvider } from './LocationProvider'
import { BottomTabs } from './BottomTabs'
import { CartBar } from './CartBar'
import { useCartStore } from '@/store/cart'

/**
 * MobileNav — renders bottom tabs + floating cart bar on mobile viewports.
 * Hidden on desktop via CSS media query.
 * Wraps in LocationProvider for location-aware features.
 */
export function MobileNav() {
  const [mounted, setMounted] = useState(false)
  const itemCount = useCartStore((s) => s.getItemCount())
  const subtotal = useCartStore((s) => s.getSubtotal())

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  return (
    <LocationProvider>
      <div className="mobile-nav-wrapper">
        {itemCount > 0 && (
          <CartBar itemCount={itemCount} total={subtotal} />
        )}
        <BottomTabs />
      </div>

      <style jsx>{`
        .mobile-nav-wrapper {
          display: block;
        }

        @media (min-width: 768px) {
          .mobile-nav-wrapper {
            display: none;
          }
        }
      `}</style>
    </LocationProvider>
  )
}
