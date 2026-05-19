'use client'

import { useEffect } from 'react'
import { X, MapPin, Navigation, Clock } from 'lucide-react'
import { useUIStore, useCartStore, useGeolocation, useTranslation } from '@/lib/store'
import { LOCATIONS, isLocationOpen, type Location } from '@/lib/data'

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export default function LocationSheet() {
  const { isLocationSheetOpen, closeLocationSheet } = useUIStore()
  const { setSelectedLocation } = useCartStore()
  const { language } = useTranslation()
  const { distances, loading, requestLocation, nearestLocation } = useGeolocation()

  // Request location when sheet opens
  useEffect(() => {
    if (isLocationSheetOpen) {
      requestLocation()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isLocationSheetOpen, requestLocation])

  const handleSelect = (location: Location) => {
    setSelectedLocation(location)
    closeLocationSheet()
  }

  if (!isLocationSheetOpen) return null

  // Sort by distance if available, otherwise use default order
  const sortedLocations = distances
    ? distances.map((d) => d)
    : LOCATIONS.map((loc) => ({ location: loc, distanceKm: null as number | null }))

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={closeLocationSheet}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A1A] rounded-t-3xl max-h-[85vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={language === 'es' ? 'Seleccionar ubicación' : 'Select location'}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-[#1A1A1A] z-10">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={closeLocationSheet}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="px-5 pb-8">
          {/* Header */}
          <div className="mt-3 mb-5">
            <h2 className="font-display text-2xl text-white tracking-wide">
              {language === 'es' ? 'Nuestras Ubicaciones' : 'Our Locations'}
            </h2>
            <p className="text-white/50 text-sm mt-1">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-[#E85D04] border-t-transparent rounded-full animate-spin" />
                  {language === 'es' ? 'Detectando tu ubicación...' : 'Detecting your location...'}
                </span>
              ) : distances ? (
                <span className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-[#E85D04]" />
                  {language === 'es' ? 'Ordenadas por distancia' : 'Sorted by distance'}
                </span>
              ) : (
                language === 'es' ? 'Selecciona el restaurante más cercano' : 'Select your nearest restaurant'
              )}
            </p>
          </div>

          {/* Location cards */}
          <div className="space-y-3">
            {sortedLocations.map((entry, i) => {
              const loc = 'location' in entry ? entry.location : entry as unknown as Location
              const dist = entry.distanceKm
              const open = isLocationOpen(loc)
              const isNearest = nearestLocation?.id === loc.id && distances !== null

              return (
                <button
                  key={loc.id}
                  onClick={() => handleSelect(loc)}
                  className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
                    isNearest
                      ? 'border-[#E85D04] bg-[#E85D04]/10'
                      : 'border-white/10 bg-[#111] hover:border-white/25'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className={`w-4 h-4 shrink-0 ${isNearest ? 'text-[#E85D04]' : 'text-white/40'}`} />
                        <span className="font-semibold text-white text-sm truncate">{loc.shortName}</span>
                        {isNearest && (
                          <span className="bg-[#E85D04] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            {language === 'es' ? 'Más cercano' : 'Nearest'}
                          </span>
                        )}
                      </div>
                      <p className="text-white/40 text-xs mt-1 ml-6">{loc.address}, {loc.city}</p>
                      <div className="flex items-center gap-3 mt-2 ml-6">
                        <span className={`flex items-center gap-1.5 text-xs font-medium ${open ? 'text-green-400' : 'text-red-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-green-500' : 'bg-red-500'}`} />
                          {open ? (language === 'es' ? 'Abierto' : 'Open') : (language === 'es' ? 'Cerrado' : 'Closed')}
                        </span>
                        <span className="flex items-center gap-1 text-white/30 text-xs">
                          <Clock className="w-3 h-3" />
                          {loc.hours.weekday !== 'Cerrado' ? loc.hours.weekday : loc.hours.weekend}
                        </span>
                      </div>
                    </div>
                    {dist !== null && (
                      <span className={`text-xs font-bold shrink-0 px-2 py-1 rounded-lg ${
                        isNearest ? 'text-[#E85D04] bg-[#E85D04]/10' : 'text-white/40 bg-white/5'
                      }`}>
                        {formatDistance(dist)}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Retry geolocation button */}
          {!distances && !loading && (
            <button
              onClick={requestLocation}
              className="w-full mt-4 py-3 rounded-xl border border-[#E85D04]/30 text-[#E85D04] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#E85D04]/10 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              {language === 'es' ? 'Usar mi ubicación' : 'Use my location'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
