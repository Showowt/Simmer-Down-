'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { id: 'menu', href: '/menu', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z', label: 'Menu' },
  { id: 'reservar', href: '/reservar', icon: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z', label: 'Reservar' },
  { id: 'ubicaciones', href: '/locations', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', label: 'Ubicaciones' },
  { id: 'cuenta', href: '/account', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z', label: 'Cuenta' },
]

export function BottomTabs() {
  const pathname = usePathname()

  const getActiveTab = () => {
    if (pathname === '/' || pathname?.startsWith('/menu')) return 'menu'
    if (pathname?.startsWith('/reservar') || pathname?.startsWith('/reservations')) return 'reservar'
    if (pathname?.startsWith('/locations') || pathname?.startsWith('/ubicaciones')) return 'ubicaciones'
    if (pathname?.startsWith('/account') || pathname?.startsWith('/cuenta')) return 'cuenta'
    return 'menu'
  }

  const activeTab = getActiveTab()

  return (
    <nav className="bottom-tabs">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`tab ${isActive ? 'active' : ''}`}
          >
            <svg className="tab-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d={tab.icon} />
            </svg>
            <span className="tab-label">{tab.label}</span>
            {isActive && <span className="tab-indicator" />}
          </Link>
        )
      })}

      <style jsx>{`
        .bottom-tabs {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          background: rgba(31, 29, 26, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(61, 57, 54, 0.5);
          padding-bottom: env(safe-area-inset-bottom);
          z-index: 100;
        }

        .tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 0 0.375rem;
          text-decoration: none;
          color: rgba(184, 176, 168, 0.5);
          position: relative;
          transition: color 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .tab:active {
          transform: scale(0.95);
        }

        .tab.active {
          color: #FF6B35;
        }

        .tab-icon {
          width: 22px;
          height: 22px;
        }

        .tab-label {
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin-top: 0.25rem;
        }

        .tab-indicator {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 2px;
          background: #FF6B35;
          border-radius: 0 0 2px 2px;
        }
      `}</style>
    </nav>
  )
}
