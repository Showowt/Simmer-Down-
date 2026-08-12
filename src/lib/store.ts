import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useState, useEffect, useCallback } from 'react'
import {
  type Location,
  type MenuItem,
  type CartItem,
  type MenuItemSize,
  type MenuItemModifier,
  calculateItemTotal,
  getNearestLocation,
  getLocationDistances,
  TRANSLATIONS,
  LOCATIONS,
} from '@/lib/data'
import { calculateCartTotalsWithPromo } from '@/lib/promo'

// ============================================
// CART STORE
// ============================================

/**
 * Stable identity for a cart LINE (item + size + modifiers). Matching by bare
 * item.id corrupts carts holding the same pizza in two sizes: remove/qty
 * operations hit both lines. Mirrors the merge criteria in addItem.
 */
export function cartLineKey(item: Pick<CartItem, 'id' | 'selectedSize' | 'selectedModifiers'>): string {
  const mods = (item.selectedModifiers ?? []).map((m) => m.id).sort().join('+')
  return `${item.id}|${item.selectedSize?.id ?? ''}|${mods}`
}

interface CartState {
  items: CartItem[]
  selectedLocation: Location | null
  customerName: string
  customerPhone: string
  customerEmail: string
  orderType: 'dine_in' | 'takeout' | 'delivery'
  orderNotes: string
  itemCount: number
  subtotal: number
  /** Auto-applied promo discount (2x1 pizzas tradicionales) when the special is live. */
  discount: number
  /** Synced from /api/specials by <PromoSync/>; server re-validates on order create. */
  promoLive: boolean
  /** Live order-wide percentage promo (0..100); synced by <PromoSync/>, server re-validates. */
  orderPercent: number
  tax: number
  total: number
  addItem: (item: MenuItem, quantity: number, size?: MenuItemSize, modifiers?: MenuItemModifier[], notes?: string) => void
  updateQuantity: (lineKey: string, quantity: number) => void
  removeItem: (lineKey: string) => void
  clearCart: () => void
  setPromoLive: (live: boolean) => void
  setOrderPercent: (percent: number) => void
  setSelectedLocation: (location: Location) => void
  setCustomerInfo: (name: string, phone: string, email?: string) => void
  setOrderType: (type: 'dine_in' | 'takeout' | 'delivery') => void
  setOrderNotes: (notes: string) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      selectedLocation: null,
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      orderType: 'takeout',
      orderNotes: '',
      itemCount: 0,
      subtotal: 0,
      discount: 0,
      promoLive: false,
      orderPercent: 0,
      tax: 0,
      total: 0,

      addItem: (item, quantity, size, modifiers, notes) => {
        const totalPrice = calculateItemTotal(item, quantity, size, modifiers)
        const cartItem: CartItem = { ...item, quantity, selectedSize: size, selectedModifiers: modifiers, notes, totalPrice }

        set((state) => {
          const newKey = cartLineKey(cartItem)
          const existingIndex = state.items.findIndex((i) => cartLineKey(i) === newKey)
          let newItems: CartItem[]
          if (existingIndex >= 0) {
            newItems = [...state.items]
            const existing = newItems[existingIndex]
            const newQty = existing.quantity + quantity
            newItems[existingIndex] = { ...existing, quantity: newQty, totalPrice: calculateItemTotal(item, newQty, size, modifiers) }
          } else {
            newItems = [...state.items, cartItem]
          }
          const { subtotal, discount, tax, total } = calculateCartTotalsWithPromo(newItems, state.promoLive, state.orderPercent)
          return { items: newItems, itemCount: newItems.reduce((s, i) => s + i.quantity, 0), subtotal, discount, tax, total }
        })
      },

      updateQuantity: (lineKey, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            const newItems = state.items.filter((i) => cartLineKey(i) !== lineKey)
            const { subtotal, discount, tax, total } = calculateCartTotalsWithPromo(newItems, state.promoLive, state.orderPercent)
            return { items: newItems, itemCount: newItems.reduce((s, i) => s + i.quantity, 0), subtotal, discount, tax, total }
          }
          const newItems = state.items.map((item) => cartLineKey(item) === lineKey ? { ...item, quantity, totalPrice: calculateItemTotal(item, quantity, item.selectedSize, item.selectedModifiers) } : item)
          const { subtotal, discount, tax, total } = calculateCartTotalsWithPromo(newItems, state.promoLive, state.orderPercent)
          return { items: newItems, itemCount: newItems.reduce((s, i) => s + i.quantity, 0), subtotal, discount, tax, total }
        })
      },

      removeItem: (lineKey) => {
        set((state) => {
          const newItems = state.items.filter((i) => cartLineKey(i) !== lineKey)
          const { subtotal, discount, tax, total } = calculateCartTotalsWithPromo(newItems, state.promoLive, state.orderPercent)
          return { items: newItems, itemCount: newItems.reduce((s, i) => s + i.quantity, 0), subtotal, discount, tax, total }
        })
      },

      clearCart: () => set({ items: [], itemCount: 0, subtotal: 0, discount: 0, tax: 0, total: 0 }),

      setPromoLive: (live) => {
        set((state) => {
          if (state.promoLive === live) return state
          const { subtotal, discount, tax, total } = calculateCartTotalsWithPromo(state.items, live, state.orderPercent)
          return { promoLive: live, subtotal, discount, tax, total }
        })
      },
      setOrderPercent: (percent) => {
        set((state) => {
          const p = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0
          if (state.orderPercent === p) return state
          const { subtotal, discount, tax, total } = calculateCartTotalsWithPromo(state.items, state.promoLive, p)
          return { orderPercent: p, subtotal, discount, tax, total }
        })
      },
      setSelectedLocation: (location) => set({ selectedLocation: location }),
      setCustomerInfo: (name, phone, email) => set({ customerName: name, customerPhone: phone, customerEmail: email || '' }),
      setOrderType: (type) => set({ orderType: type }),
      setOrderNotes: (notes) => set({ orderNotes: notes }),
    }),
    {
      name: 'simmerdown-cart-v3',
      version: 3,
      partialize: (state) => ({ items: state.items, selectedLocation: state.selectedLocation, customerName: state.customerName, customerPhone: state.customerPhone, orderType: state.orderType }),
      migrate: () => ({
        items: [],
        selectedLocation: null,
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        orderType: 'takeout' as const,
        orderNotes: '',
        itemCount: 0,
        subtotal: 0,
        discount: 0,
        promoLive: false,
        orderPercent: 0,
        tax: 0,
        total: 0,
      }),
      // Derived fields (itemCount/subtotal/tax/total) are intentionally excluded
      // from partialize. Recompute them from the restored items so the cart badge,
      // floating bar, and checkout totals are correct on the first render after a
      // page reload — otherwise they stay at their initial 0 (D001/D002).
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CartState>
        const items = p.items ?? []
        // promoLive/orderPercent are never persisted — <PromoSync/> re-fetches
        // and triggers a recompute right after hydration, so booting at 0 is safe.
        const { subtotal, discount, tax, total } = calculateCartTotalsWithPromo(items, current.promoLive, current.orderPercent)
        return {
          ...current,
          ...p,
          items,
          itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
          subtotal,
          discount,
          tax,
          total,
        }
      },
    }
  )
)

// ============================================
// UI STORE
// ============================================

interface UIState {
  language: 'es' | 'en'
  isCartSheetOpen: boolean
  isLocationSheetOpen: boolean
  isMenuItemSheetOpen: boolean
  selectedMenuItem: MenuItem | null
  setLanguage: (lang: 'es' | 'en') => void
  toggleLanguage: () => void
  openCartSheet: () => void
  closeCartSheet: () => void
  openLocationSheet: () => void
  closeLocationSheet: () => void
  openMenuItemSheet: (item: MenuItem) => void
  closeMenuItemSheet: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      language: 'es',
      isCartSheetOpen: false,
      isLocationSheetOpen: false,
      isMenuItemSheetOpen: false,
      selectedMenuItem: null,
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () => set((s) => ({ language: s.language === 'es' ? 'en' : 'es' })),
      openCartSheet: () => set({ isCartSheetOpen: true }),
      closeCartSheet: () => set({ isCartSheetOpen: false }),
      openLocationSheet: () => set({ isLocationSheetOpen: true }),
      closeLocationSheet: () => set({ isLocationSheetOpen: false }),
      openMenuItemSheet: (item) => set({ isMenuItemSheetOpen: true, selectedMenuItem: item }),
      closeMenuItemSheet: () => set({ isMenuItemSheetOpen: false, selectedMenuItem: null }),
    }),
    { name: 'simmerdown-ui-v2', partialize: (state) => ({ language: state.language }) }
  )
)

// ============================================
// HOOKS
// ============================================

export function useTranslation() {
  const language = useUIStore((s) => s.language)
  const t = (key: string): string => TRANSLATIONS[language]?.[key] || key
  return { t, language }
}

// ============================================
// GEOLOCATION HOOK
// ============================================

interface GeoState {
  lat: number | null
  lng: number | null
  loading: boolean
  error: string | null
  distances: Array<{ location: Location; distanceKm: number }> | null
  nearestLocation: Location | null
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    lat: null, lng: null, loading: false, error: null, distances: null, nearestLocation: null,
  })

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation not supported' }))
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const distances = getLocationDistances(latitude, longitude)
        const { location: nearest } = getNearestLocation(latitude, longitude)
        setState({ lat: latitude, lng: longitude, loading: false, error: null, distances, nearestLocation: nearest })
      },
      (err) => {
        setState((s) => ({ ...s, loading: false, error: err.message }))
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  return { ...state, requestLocation }
}
