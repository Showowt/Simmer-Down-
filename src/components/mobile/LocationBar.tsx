'use client'

import { useLocationContext } from './LocationProvider'

export function LocationBar({ onTap }: { onTap: () => void }) {
  const { selectedLocation, isOpen, nextChange, distance } = useLocationContext()

  return (
    <button onClick={onTap} className="location-bar">
      <div className="location-left">
        <span className={`status-dot ${isOpen ? 'open' : 'closed'}`} />
        <div className="location-text">
          <span className="location-name">{selectedLocation?.name}</span>
          <span className="location-meta">
            {isOpen ? 'Abierto' : 'Cerrado'} · {nextChange}
            {distance !== null && ` · ${distance.toFixed(1)} km`}
          </span>
        </div>
      </div>
      <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M6 9l6 6 6-6"/>
      </svg>

      <style jsx>{`
        .location-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.625rem 1rem;
          background: rgba(31, 29, 26, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: none;
          border-bottom: 1px solid rgba(61, 57, 54, 0.6);
          cursor: pointer;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .location-left {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-dot.open {
          background: #22C55E;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
          animation: pulse 2s ease-in-out infinite;
        }

        .status-dot.closed {
          background: #EF4444;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }

        .location-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.125rem;
        }

        .location-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: #FFF8F0;
          letter-spacing: -0.01em;
        }

        .location-meta {
          font-size: 0.6875rem;
          color: rgba(184, 176, 168, 0.7);
        }

        .chevron {
          width: 18px;
          height: 18px;
          color: rgba(184, 176, 168, 0.4);
          transition: transform 0.2s ease;
        }

        .location-bar:active .chevron {
          transform: translateY(2px);
        }
      `}</style>
    </button>
  )
}
