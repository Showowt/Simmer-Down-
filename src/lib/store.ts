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
  calculateCartTotal,
  getNearestLocation,
  getLocationDistances,
  TRANSLATIONS,
  LOCATIONS,
} from '@/lib/data'

// ============================================
// CART STORE
// ============================================

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
  tax: number
  total: number
  addItem: (item: MenuItem, quantity: number, size?: MenuItemSize, modifiers?: MenuItemModifier[], notes?: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
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
      tax: 0,
      total: 0,

      addItem: (item, quantity, size, modifiers, notes) => {
        const totalPrice = calculateItemTotal(item, quantity, size, modifiers)
        const cartItem: CartItem = { ...item, quantity, selectedSize: size, selectedModifiers: modifiers, notes, totalPrice }

        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.id === item.id && i.selectedSize?.id === size?.id && JSON.stringify(i.selectedModifiers?.map((m) => m.id).sort()) === JSON.stringify(modifiers?.map((m) => m.id).sort())
          )
          let newItems: CartItem[]
          if (existingIndex >= 0) {
            newItems = [...state.items]
            const existing = newItems[existingIndex]
            const newQty = existing.quantity + quantity
            newItems[existingIndex] = { ...existing, quantity: newQty, totalPrice: calculateItemTotal(item, newQty, size, modifiers) }
          } else {
            newItems = [...state.items, cartItem]
          }
          const { subtotal, tax, total } = calculateCartTotal(newItems)
          return { items: newItems, itemCount: newItems.reduce((s, i) => s + i.quantity, 0), subtotal, tax, total }
        })
      },

      updateQuantity: (itemId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            const newItems = state.items.filter((i) => i.id !== itemId)
            const { subtotal, tax, total } = calculateCartTotal(newItems)
            return { items: newItems, itemCount: newItems.reduce((s, i) => s + i.quantity, 0), subtotal, tax, total }
          }
          const newItems = state.items.map((item) => item.id === itemId ? { ...item, quantity, totalPrice: calculateItemTotal(item, quantity, item.selectedSize, item.selectedModifiers) } : item)
          const { subtotal, tax, total } = calculateCartTotal(newItems)
          return { items: newItems, itemCount: newItems.reduce((s, i) => s + i.quantity, 0), subtotal, tax, total }
        })
      },

      removeItem: (itemId) => {
        set((state) => {
          const newItems = state.items.filter((i) => i.id !== itemId)
          const { subtotal, tax, total } = calculateCartTotal(newItems)
          return { items: newItems, itemCount: newItems.reduce((s, i) => s + i.quantity, 0), subtotal, tax, total }
        })
      },

      clearCart: () => set({ items: [], itemCount: 0, subtotal: 0, tax: 0, total: 0 }),
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
        tax: 0,
        total: 0,
      }),
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
