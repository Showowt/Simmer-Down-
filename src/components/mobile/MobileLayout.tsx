'use client'

import { useState, ReactNode } from 'react'
import { LocationProvider } from './LocationProvider'
import { LocationBar } from './LocationBar'
import { LocationSheet } from './LocationSheet'
import { BottomTabs } from './BottomTabs'
import { CartBar } from './CartBar'

export function MobileLayout({
  children,
  showLocationBar = true,
  showBottomTabs = true,
  cartItemCount = 0,
  cartTotal = 0,
}: {
  children: ReactNode
  showLocationBar?: boolean
  showBottomTabs?: boolean
  cartItemCount?: number
  cartTotal?: number
}) {
  const [locationSheetOpen, setLocationSheetOpen] = useState(false)

  return (
    <LocationProvider>
      <div className="mobile-app-container">
        {showLocationBar && (
          <LocationBar onTap={() => setLocationSheetOpen(true)} />
        )}

        <main className="mobile-main-content">
          {children}
        </main>

        {cartItemCount > 0 && (
          <CartBar itemCount={cartItemCount} total={cartTotal} />
        )}

        {showBottomTabs && <BottomTabs />}

        <LocationSheet
          isOpen={locationSheetOpen}
          onClose={() => setLocationSheetOpen(false)}
        />

        <style jsx>{`
          .mobile-app-container {
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            flex-direction: column;
          }

          .mobile-main-content {
            flex: 1;
            padding-bottom: ${showBottomTabs ? 'calc(60px + env(safe-area-inset-bottom))' : '0'};
          }
        `}</style>
      </div>
    </LocationProvider>
  )
}
