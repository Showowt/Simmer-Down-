'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Globe, Menu, X } from 'lucide-react'
import { useUIStore, useTranslation } from '@/lib/store'

interface NavLink {
  href: string
  labelKey: string
}

const NAV_LINKS: NavLink[] = [
  { href: '/carta', labelKey: 'nav.menu' },
  { href: '/restaurantes', labelKey: 'nav.locations' },
  { href: '/reservar', labelKey: 'nav.reserve' },
  { href: '/nosotros', labelKey: 'nav.about' },
]

export default function NewHeader() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const toggleLanguage = useUIStore((s) => s.toggleLanguage)
  const language = useUIStore((s) => s.language)
  const { t } = useTranslation()

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    queueMicrotask(() => setIsMenuOpen(false))
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const isActive = (href: string) => pathname === href

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">

          {/* Left — Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0 hover:opacity-80 transition-opacity duration-200"
            aria-label="Simmer Down — Inicio"
          >
            <Image
              src="/logos/logo-simmer-light.svg"
              alt="Simmer Down"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Center — Desktop nav */}
          <nav
            className="hidden lg:flex items-center gap-8"
            aria-label="Navegación principal"
          >
            {NAV_LINKS.map(({ href, labelKey }) => (
              <Link
                key={href}
                href={href}
                className={`text-[13px] font-medium uppercase tracking-[0.12em] transition-colors duration-200 py-1 border-b-2 ${
                  isActive(href)
                    ? 'text-[#E85D04] border-[#E85D04]'
                    : 'text-white/60 border-transparent hover:text-white hover:border-white/20'
                }`}
              >
                {t(labelKey)}
              </Link>
            ))}
          </nav>

          {/* Right — Language toggle + mobile hamburger */}
          <div className="flex items-center gap-1">
            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-white/60 hover:text-white hover:bg-white/[0.06] transition-all duration-200 text-[12px] font-semibold uppercase tracking-wider min-h-[44px]"
              aria-label={`Cambiar idioma a ${language === 'es' ? 'English' : 'Español'}`}
            >
              <Globe className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {mounted ? (language === 'es' ? 'ES' : 'EN') : 'ES'}
            </button>

            {/* Mobile hamburger — hidden on lg+ */}
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="lg:hidden flex items-center justify-center w-11 h-11 text-white/70 hover:text-white transition-colors duration-200"
              aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div className="absolute top-16 left-0 right-0 bg-[#0A0A0A] border-b border-white/[0.08] shadow-2xl">
            <nav className="px-6 py-4 space-y-1" aria-label="Menú móvil">
              {NAV_LINKS.map(({ href, labelKey }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center h-12 px-3 rounded-lg text-[15px] font-medium tracking-wide transition-all duration-150 ${
                    isActive(href)
                      ? 'text-[#E85D04] bg-[#E85D04]/10'
                      : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {t(labelKey)}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
