'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

// ============================================================================
// TYPES
// ============================================================================

interface DayHours {
  days: string
  open: string
  close: string
}

export interface MobileLocation {
  id: string
  name: string
  slug: string
  address: string
  city: string
  phone: string
  whatsapp: string
  hours: DayHours[]
  isActive: boolean
  features: string[]
  coordinates: { lat: number; lng: number }
}

interface LocationContextType {
  selectedLocation: MobileLocation | null
  setSelectedLocation: (location: MobileLocation) => void
  isOpen: boolean
  nextChange: string
  distance: number | null
}

// ============================================================================
// LOCATION DATA
// ============================================================================

export const MOBILE_LOCATIONS: MobileLocation[] = [
  {
    id: 'santa-ana',
    name: 'Santa Ana',
    slug: 'santa-ana',
    address: 'Frente a Catedral',
    city: 'Santa Ana',
    phone: '+503 2455-4899',
    whatsapp: '+50324554899',
    hours: [
      { days: 'Lun-Jue', open: '11:00', close: '21:00' },
      { days: 'Vie-Sab', open: '11:00', close: '22:00' },
      { days: 'Dom', open: '11:00', close: '20:00' },
    ],
    isActive: true,
    features: ['WiFi', 'Terraza', 'Musica en vivo', 'Estacionamiento'],
    coordinates: { lat: 13.9944, lng: -89.5597 },
  },
  {
    id: 'lago-coatepeque',
    name: 'Lago de Coatepeque',
    slug: 'coatepeque',
    address: 'Orilla del Lago',
    city: 'Coatepeque',
    phone: '+503 2441-6688',
    whatsapp: '+50324416688',
    hours: [
      { days: 'Lun-Dom', open: '10:00', close: '20:00' },
    ],
    isActive: true,
    features: ['Vista al lago', 'Kayaks', 'Eventos privados', 'Piscina'],
    coordinates: { lat: 13.8667, lng: -89.5333 },
  },
  {
    id: 'san-benito',
    name: 'San Benito',
    slug: 'san-benito',
    address: 'Zona Rosa, Colonia San Benito',
    city: 'San Salvador',
    phone: '+503 2263-1234',
    whatsapp: '+50322631234',
    hours: [
      { days: 'Lun-Mie', open: '11:00', close: '22:00' },
      { days: 'Jue-Sab', open: '11:00', close: '23:00' },
      { days: 'Dom', open: '11:00', close: '21:00' },
    ],
    isActive: true,
    features: ['Jazz nights', 'Cocteles premium', 'Ambiente nocturno', 'Valet'],
    coordinates: { lat: 13.7034, lng: -89.2370 },
  },
  {
    id: 'surf-city',
    name: 'Surf City',
    slug: 'surf-city',
    address: 'Playa El Tunco',
    city: 'La Libertad',
    phone: '+503 2389-6666',
    whatsapp: '+50323896666',
    hours: [
      { days: 'Lun-Dom', open: '08:00', close: '22:00' },
    ],
    isActive: true,
    features: ['Vista al mar', 'Surf rental', 'Desayunos', 'Pet friendly'],
    coordinates: { lat: 13.4936, lng: -89.3844 },
  },
  {
    id: 'simmer-garden',
    name: 'Simmer Garden',
    slug: 'juayua',
    address: 'Ruta de las Flores',
    city: 'Juayua, Sonsonate',
    phone: '+503 2452-2233',
    whatsapp: '+50324522233',
    hours: [
      { days: 'Sab-Dom', open: '09:00', close: '18:00' },
    ],
    isActive: true,
    features: ['Jardin botanico', 'Cafe de origen', 'Eventos privados', 'Tour'],
    coordinates: { lat: 13.8417, lng: -89.7472 },
  },
]

// ============================================================================
// CONTEXT
// ============================================================================

const LocationContext = createContext<LocationContextType | null>(null)

export function useLocationContext() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocationContext must be used within LocationProvider')
  }
  return context
}

// ============================================================================
// UTILITIES
// ============================================================================

function checkIfOpen(location: MobileLocation): { isOpen: boolean; nextChange: string } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  const dayMap: Record<string, number[]> = {
    'Lun': [1], 'Mar': [2], 'Mie': [3], 'Jue': [4], 'Vie': [5], 'Sab': [6], 'Dom': [0],
    'Lun-Vie': [1, 2, 3, 4, 5],
    'Lun-Jue': [1, 2, 3, 4],
    'Lun-Mie': [1, 2, 3],
    'Jue-Sab': [4, 5, 6],
    'Vie-Sab': [5, 6],
    'Sab-Dom': [0, 6],
    'Lun-Dom': [0, 1, 2, 3, 4, 5, 6],
  }

  for (const schedule of location.hours) {
    const days = dayMap[schedule.days] || []
    if (days.includes(dayOfWeek)) {
      const [openH, openM] = schedule.open.split(':').map(Number)
      const [closeH, closeM] = schedule.close.split(':').map(Number)
      const openTime = openH * 60 + (openM || 0)
      const closeTime = closeH * 60 + (closeM || 0)

      if (currentTime >= openTime && currentTime < closeTime) {
        return { isOpen: true, nextChange: `Cierra a las ${schedule.close}` }
      } else if (currentTime < openTime) {
        return { isOpen: false, nextChange: `Abre a las ${schedule.open}` }
      } else {
        return { isOpen: false, nextChange: 'Cerrado hoy' }
      }
    }
  }

  return { isOpen: false, nextChange: 'Cerrado hoy' }
}

export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ============================================================================
// PROVIDER
// ============================================================================

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedLocation, setSelectedLocation] = useState<MobileLocation>(MOBILE_LOCATIONS[0])
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [openStatus, setOpenStatus] = useState({ isOpen: false, nextChange: '' })

  useEffect(() => {
    const check = () => setOpenStatus(checkIfOpen(selectedLocation))
    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [selectedLocation])

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // Silently fail
      )
    }
  }, [])

  const distance = userCoords
    ? calculateDistance(
        userCoords.lat, userCoords.lng,
        selectedLocation.coordinates.lat, selectedLocation.coordinates.lng
      )
    : null

  return (
    <LocationContext.Provider value={{
      selectedLocation,
      setSelectedLocation,
      isOpen: openStatus.isOpen,
      nextChange: openStatus.nextChange,
      distance,
    }}>
      {children}
    </LocationContext.Provider>
  )
}

export { checkIfOpen }
