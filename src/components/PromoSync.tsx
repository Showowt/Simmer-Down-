'use client'

/**
 * Syncs the cart store's promoLive flag with the live 2x1 special.
 * Renders nothing. Mounted once in the public layout so every cart surface
 * (carrito, checkout, bottom-nav badge totals) recomputes when the promo
 * window opens or closes. On fetch failure the promo simply isn't shown —
 * the server still applies it at order creation, so the customer can only
 * be charged LESS than displayed, never more.
 */

import { useEffect } from 'react'
import { useCartStore } from '@/lib/store'
import { PROMO_2X1_SPECIAL_ID } from '@/lib/promo'

interface PublicSpecialLite {
  id: string
  is_live?: boolean
}

export default function PromoSync() {
  const setPromoLive = useCartStore((s) => s.setPromoLive)

  useEffect(() => {
    let cancelled = false

    const sync = async () => {
      try {
        const res = await fetch('/api/specials')
        if (!res.ok) return
        const data = (await res.json()) as { success?: boolean; specials?: PublicSpecialLite[] }
        if (cancelled || !data?.success || !Array.isArray(data.specials)) return
        setPromoLive(
          data.specials.some((s) => s.id === PROMO_2X1_SPECIAL_ID && s.is_live === true),
        )
      } catch (error) {
        console.error('[PromoSync]', error)
      }
    }

    sync()
    // Re-check when the tab regains focus — catches the promo flipping live or
    // expiring (midnight SV) while the tab sat open.
    const onFocus = () => { void sync() }
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
    }
  }, [setPromoLive])

  return null
}
