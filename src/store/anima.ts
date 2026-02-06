import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CustomerMemory {
  firstVisit: string | null
  lastVisit: string | null
  totalOrders: number
  favoriteItems: string[]
  preferredLocation: string | null
  dietaryPreferences: string[]
  milestones: string[]
}

interface AnimaState {
  // Chat state
  isOpen: boolean
  setIsOpen: (open: boolean) => void

  // Customer identity
  customerName: string | null
  setCustomerName: (name: string | null) => void
  customerPhone: string | null
  setCustomerPhone: (phone: string | null) => void

  // Loyalty
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum'
  setLoyaltyTier: (tier: 'bronze' | 'silver' | 'gold' | 'platinum') => void
  loyaltyPoints: number
  setLoyaltyPoints: (points: number) => void

  // Memory
  memory: CustomerMemory
  updateMemory: (updates: Partial<CustomerMemory>) => void
  setPreferredLocation: (location: string | null) => void
  addFavoriteItem: (item: string) => void
  removeFavoriteItem: (item: string) => void
  addDietaryPreference: (pref: string) => void
  addMilestone: (milestone: string) => void
  incrementOrders: () => void

  // Visit tracking
  visitCount: number
  incrementVisit: () => void

  // Preferences learned
  hasSeenWelcome: boolean
  setHasSeenWelcome: (seen: boolean) => void

  // Time awareness
  getTimeGreeting: () => string
  getPersonalizedGreeting: () => string
}

export const useAnimaStore = create<AnimaState>()(
  persist(
    (set, get) => ({
      // Chat state
      isOpen: false,
      setIsOpen: (open) => set({ isOpen: open }),

      // Customer identity
      customerName: null,
      setCustomerName: (name) => set({ customerName: name }),
      customerPhone: null,
      setCustomerPhone: (phone) => set({ customerPhone: phone }),

      // Loyalty
      loyaltyTier: 'bronze',
      setLoyaltyTier: (tier) => set({ loyaltyTier: tier }),
      loyaltyPoints: 0,
      setLoyaltyPoints: (points) => set({ loyaltyPoints: points }),

      // Memory
      memory: {
        firstVisit: null,
        lastVisit: null,
        totalOrders: 0,
        favoriteItems: [],
        preferredLocation: null,
        dietaryPreferences: [],
        milestones: [],
      },
      updateMemory: (updates) =>
        set((state) => ({
          memory: { ...state.memory, ...updates },
        })),
      setPreferredLocation: (location) =>
        set((state) => ({
          memory: { ...state.memory, preferredLocation: location },
        })),
      addFavoriteItem: (item) =>
        set((state) => ({
          memory: {
            ...state.memory,
            favoriteItems: state.memory.favoriteItems.includes(item)
              ? state.memory.favoriteItems
              : [...state.memory.favoriteItems, item],
          },
        })),
      removeFavoriteItem: (item) =>
        set((state) => ({
          memory: {
            ...state.memory,
            favoriteItems: state.memory.favoriteItems.filter((i) => i !== item),
          },
        })),
      addDietaryPreference: (pref) =>
        set((state) => ({
          memory: {
            ...state.memory,
            dietaryPreferences: state.memory.dietaryPreferences.includes(pref)
              ? state.memory.dietaryPreferences
              : [...state.memory.dietaryPreferences, pref],
          },
        })),
      addMilestone: (milestone) =>
        set((state) => ({
          memory: {
            ...state.memory,
            milestones: state.memory.milestones.includes(milestone)
              ? state.memory.milestones
              : [...state.memory.milestones, milestone],
          },
        })),
      incrementOrders: () =>
        set((state) => ({
          memory: { ...state.memory, totalOrders: state.memory.totalOrders + 1 },
          loyaltyPoints: state.loyaltyPoints + 10, // 10 points per order
        })),

      // Visit tracking
      visitCount: 0,
      incrementVisit: () =>
        set((state) => {
          const now = new Date().toISOString()
          return {
            visitCount: state.visitCount + 1,
            memory: {
              ...state.memory,
              firstVisit: state.memory.firstVisit || now,
              lastVisit: now,
            },
          }
        }),

      // Welcome state
      hasSeenWelcome: false,
      setHasSeenWelcome: (seen) => set({ hasSeenWelcome: seen }),

      // Time awareness
      getTimeGreeting: () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Buenos días'
        if (hour < 18) return 'Buenas tardes'
        return 'Buenas noches'
      },

      getPersonalizedGreeting: () => {
        const state = get()
        const timeGreeting = state.getTimeGreeting()
        const name = state.customerName

        if (name) {
          if (state.visitCount > 10) {
            return `¡${name}! Mi persona favorita está de vuelta.`
          }
          if (state.visitCount > 5) {
            return `¡${timeGreeting}, ${name}! Qué gusto verte de nuevo.`
          }
          return `¡Hola, ${name}! ${timeGreeting}.`
        }

        if (state.visitCount > 3) {
          return `${timeGreeting}. Veo que te gusta volver por aquí.`
        }

        return `${timeGreeting}. Bienvenido a Simmer Down.`
      },
    }),
    {
      name: 'anima-storage',
      partialize: (state) => ({
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        loyaltyTier: state.loyaltyTier,
        loyaltyPoints: state.loyaltyPoints,
        memory: state.memory,
        visitCount: state.visitCount,
        hasSeenWelcome: state.hasSeenWelcome,
      }),
    }
  )
)
