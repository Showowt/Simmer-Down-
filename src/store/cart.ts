/**
 * SIMMER DOWN - CART STORE (Enhanced)
 *
 * Features:
 * - Location-aware cart
 * - Delivery fee calculation ($3.99, free over $25)
 * - Pickup/delivery/dine-in modes
 * - Promo codes & loyalty points
 * - Tax calculation (13% IVA)
 * - Persistent storage with migration
 * - Backward-compatible with existing MenuItem/CartItem types
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CartItem, MenuItem, OrderType } from '@/lib/types'

// ============================================================================
// TYPES
// ============================================================================

export interface CartModifier {
  id: string
  name: string
  price: number
}

export interface CartLocation {
  id: string
  name: string
  slug: string
  address: string
  city: string
  phone: string
  whatsapp: string
}

export interface DeliveryAddress {
  street: string
  city: string
  reference: string
  coordinates?: { lat: number; lng: number }
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const FREE_DELIVERY_THRESHOLD = 25.00
export const DELIVERY_FEE = 3.99
export const TAX_RATE = 0.13 // 13% IVA in El Salvador
export const POINTS_VALUE = 0.01 // $0.01 per point

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface CartState {
  // Cart contents
  items: CartItem[]

  // Order context
  orderType: OrderType
  location: CartLocation | null
  deliveryAddress: DeliveryAddress | null
  scheduledTime: string | null

  // Customer info
  customerName: string
  customerPhone: string
  customerEmail: string

  // Promo/loyalty
  promoCode: string | null
  promoDiscount: number
  loyaltyPointsUsed: number

  // Metadata
  version: number
  updatedAt: string
}

interface CartActions {
  // Existing interface (backward-compatible)
  addItem: (item: MenuItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getItemCount: () => number

  // Order context
  setOrderType: (type: OrderType) => void
  setLocation: (location: CartLocation | null) => void
  setDeliveryAddress: (address: DeliveryAddress | null) => void
  setScheduledTime: (time: string | null) => void

  // Customer info
  setCustomerName: (name: string) => void
  setCustomerPhone: (phone: string) => void
  setCustomerEmail: (email: string) => void

  // Promo/loyalty
  applyPromoCode: (code: string, discount: number) => void
  removePromoCode: () => void
  useLoyaltyPoints: (points: number) => void

  // Enhanced computed values
  getDeliveryFee: () => number
  getPromoDiscount: () => number
  getLoyaltyDiscount: () => number
  getTax: () => number
  getTotal: () => number
  canCheckout: () => boolean
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const INITIAL_STATE: CartState = {
  items: [],
  orderType: 'pickup',
  location: null,
  deliveryAddress: null,
  scheduledTime: null,
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  promoCode: null,
  promoDiscount: 0,
  loyaltyPointsUsed: 0,
  version: 4,
  updatedAt: new Date().toISOString(),
}

// ============================================================================
// STORE
// ============================================================================

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // ─── ITEM MANAGEMENT (backward-compatible) ─────────────────────

      addItem: (item: MenuItem) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
              updatedAt: new Date().toISOString(),
            }
          }
          return {
            items: [...state.items, { ...item, quantity: 1 }],
            updatedAt: new Date().toISOString(),
          }
        })
      },

      removeItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
          updatedAt: new Date().toISOString(),
        }))
      },

      updateQuantity: (id: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
          updatedAt: new Date().toISOString(),
        }))
      },

      clearCart: () => set({
        ...INITIAL_STATE,
        updatedAt: new Date().toISOString(),
      }),

      // ─── ORDER CONTEXT ─────────────────────────────────────────────

      setOrderType: (orderType) => set({
        orderType,
        deliveryAddress: orderType === 'delivery' ? get().deliveryAddress : null,
        updatedAt: new Date().toISOString(),
      }),

      setLocation: (location) => set({
        location,
        updatedAt: new Date().toISOString(),
      }),

      setDeliveryAddress: (deliveryAddress) => set({
        deliveryAddress,
        updatedAt: new Date().toISOString(),
      }),

      setScheduledTime: (scheduledTime) => set({
        scheduledTime,
        updatedAt: new Date().toISOString(),
      }),

      // ─── CUSTOMER INFO ─────────────────────────────────────────────

      setCustomerName: (customerName) => set({
        customerName,
        updatedAt: new Date().toISOString(),
      }),

      setCustomerPhone: (customerPhone) => set({
        customerPhone,
        updatedAt: new Date().toISOString(),
      }),

      setCustomerEmail: (customerEmail) => set({
        customerEmail,
        updatedAt: new Date().toISOString(),
      }),

      // ─── PROMO / LOYALTY ───────────────────────────────────────────

      applyPromoCode: (code, discount) => set({
        promoCode: code,
        promoDiscount: discount,
        updatedAt: new Date().toISOString(),
      }),

      removePromoCode: () => set({
        promoCode: null,
        promoDiscount: 0,
        updatedAt: new Date().toISOString(),
      }),

      useLoyaltyPoints: (points) => set({
        loyaltyPointsUsed: points,
        updatedAt: new Date().toISOString(),
      }),

      // ─── COMPUTED VALUES ───────────────────────────────────────────

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity, 0
        )
      },

      getItemCount: () => {
        return get().items.reduce(
          (sum, item) => sum + item.quantity, 0
        )
      },

      getDeliveryFee: () => {
        const state = get()
        if (state.orderType !== 'delivery') return 0
        const subtotal = get().getSubtotal()
        if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0
        return DELIVERY_FEE
      },

      getPromoDiscount: () => {
        return get().promoDiscount
      },

      getLoyaltyDiscount: () => {
        return get().loyaltyPointsUsed * POINTS_VALUE
      },

      getTax: () => {
        const subtotal = get().getSubtotal()
        const promoDiscount = get().getPromoDiscount()
        const loyaltyDiscount = get().getLoyaltyDiscount()
        const taxableAmount = Math.max(0, subtotal - promoDiscount - loyaltyDiscount)
        return taxableAmount * TAX_RATE
      },

      getTotal: () => {
        const subtotal = get().getSubtotal()
        const deliveryFee = get().getDeliveryFee()
        const promoDiscount = get().getPromoDiscount()
        const loyaltyDiscount = get().getLoyaltyDiscount()
        const tax = get().getTax()
        return Math.max(0, subtotal + deliveryFee - promoDiscount - loyaltyDiscount + tax)
      },

      canCheckout: () => {
        const state = get()
        if (state.items.length === 0) return false
        if (!state.customerName.trim() || !state.customerPhone.trim()) return false
        if (state.orderType === 'delivery' && !state.deliveryAddress) return false
        return true
      },
    }),
    {
      name: 'simmer-down-cart',
      version: 4,
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return localStorage
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),
      migrate: (_persistedState, version) => {
        // Any version before 4: clear cart for clean state
        if (!version || version < 4) {
          return INITIAL_STATE
        }
        return _persistedState as CartState
      },
    }
  )
)

// ============================================================================
// SELECTORS
// ============================================================================

export const selectCartItems = (state: CartState & CartActions) => state.items
export const selectOrderType = (state: CartState & CartActions) => state.orderType
export const selectLocation = (state: CartState & CartActions) => state.location
export const selectDeliveryAddress = (state: CartState & CartActions) => state.deliveryAddress
export const selectCustomerInfo = (state: CartState & CartActions) => ({
  name: state.customerName,
  phone: state.customerPhone,
  email: state.customerEmail,
})

// ============================================================================
// UTILITIES
// ============================================================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `SD-${timestamp}-${random}`
}
