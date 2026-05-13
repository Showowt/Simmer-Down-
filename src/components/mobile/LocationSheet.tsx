'use client'

import { useState, useEffect } from 'react'
import { useLocationContext, MOBILE_LOCATIONS, checkIfOpen, calculateDistance } from './LocationProvider'
import type { MobileLocation } from './LocationProvider'

export function LocationSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { selectedLocation, setSelectedLocation } = useLocationContext()
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (isOpen && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
  }, [isOpen])

  if (!isOpen) return null

  const sortedLocations = userCoords
    ? [...MOBILE_LOCATIONS].sort((a, b) => {
        const distA = calculateDistance(userCoords.lat, userCoords.lng, a.coordinates.lat, a.coordinates.lng)
        const distB = calculateDistance(userCoords.lat, userCoords.lng, b.coordinates.lat, b.coordinates.lng)
        return distA - distB
      })
    : MOBILE_LOCATIONS

  const handleSelect = (loc: MobileLocation) => {
    setSelectedLocation(loc)
    onClose()
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-header">
          <div className="handle" />
          <h2 className="title">Seleccionar Ubicacion</h2>
        </div>

        <div className="locations-list">
          {sortedLocations.map((loc) => {
            const status = checkIfOpen(loc)
            const dist = userCoords
              ? calculateDistance(userCoords.lat, userCoords.lng, loc.coordinates.lat, loc.coordinates.lng)
              : null
            const isSelected = loc.id === selectedLocation?.id

            return (
              <button
                key={loc.id}
                className={`location-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(loc)}
              >
                <div className="option-left">
                  <span className={`dot ${status.isOpen ? 'open' : 'closed'}`} />
                  <div className="option-info">
                    <div className="option-name">{loc.name}</div>
                    <div className="option-address">{loc.address}</div>
                    <div className="option-meta">
                      {status.isOpen ? 'Abierto' : 'Cerrado'}
                      {dist !== null && ` · ${dist.toFixed(1)} km`}
                    </div>
                  </div>
                </div>
                {isSelected && <span className="check">&#10003;</span>}
              </button>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 200;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .sheet {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #1F1D1A;
          border-radius: 20px 20px 0 0;
          padding: 0.75rem 0 calc(env(safe-area-inset-bottom) + 1rem);
          z-index: 201;
          animation: slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
          max-height: 75vh;
          overflow-y: auto;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .sheet-header {
          padding: 0 1rem 1rem;
          border-bottom: 1px solid rgba(61, 57, 54, 0.5);
        }

        .handle {
          width: 36px;
          height: 4px;
          background: rgba(184, 176, 168, 0.3);
          border-radius: 2px;
          margin: 0 auto 0.75rem;
        }

        .title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #FFF8F0;
          text-align: center;
          margin: 0;
        }

        .locations-list {
          padding: 0.5rem 0;
        }

        .location-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 1rem;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(61, 57, 54, 0.3);
          cursor: pointer;
          text-align: left;
          transition: background 0.15s ease;
        }

        .location-option:active {
          background: rgba(255, 255, 255, 0.05);
        }

        .location-option.selected {
          background: rgba(255, 107, 53, 0.1);
        }

        .option-left {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-top: 4px;
          flex-shrink: 0;
        }

        .dot.open { background: #22C55E; }
        .dot.closed { background: #EF4444; }

        .option-info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .option-name {
          font-size: 1rem;
          font-weight: 700;
          color: #FFF8F0;
        }

        .option-address {
          font-size: 0.8125rem;
          color: rgba(184, 176, 168, 0.8);
        }

        .option-meta {
          font-size: 0.75rem;
          color: rgba(184, 176, 168, 0.5);
          margin-top: 0.25rem;
        }

        .check {
          font-size: 1.25rem;
          color: #FF6B35;
          font-weight: 700;
        }
      `}</style>
    </>
  )
}
