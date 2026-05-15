'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ShoppingBag, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cart'
import { useAuth } from '@/hooks/useAuth'
import { useI18n, translations } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'

export default function Header() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const itemCount = useCartStore((state) => state.getItemCount())
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()

  // 4 primary nav items — refined, not crowded
  const navLinks = [
    { href: '/menu', label: t(translations.nav.menu) },
    { href: '/reservations', label: t(translations.nav.reservations) },
    { href: '/locations', label: t(translations.nav.locations) },
    { href: '/about', label: t(translations.nav.about) },
  ]

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#1F1D1A]/98 backdrop-blur-md border-b border-[#3D3936]/40'
            : 'bg-[#1F1D1A]/95 backdrop-blur-sm'
        }`}
      >
        <nav className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo — flame icon + typography */}
            <Link
              href="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <img src="/logos/logo-simmer-light.svg" alt="Simmer Down — Pizzeria y Restaurante" className="h-10 w-auto" />
            </Link>

            {/* Desktop Nav — clean, spaced, understated */}
            <div className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[13px] uppercase tracking-[0.15em] font-medium transition-colors py-2 ${
                    pathname === link.href
                      ? 'text-[#FFF8F0]'
                      : 'text-[#6B6560] hover:text-[#FFF8F0]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Actions — minimal */}
            <div className="flex items-center gap-1">
              <LanguageToggle />

              {/* Account */}
              {mounted && !authLoading && (
                <Link
                  href={user ? '/account' : '/auth/login'}
                  className="hidden sm:flex items-center p-3 text-[#6B6560] hover:text-[#FFF8F0] transition-colors min-w-[44px] min-h-[44px]"
                  aria-label={user ? t(translations.nav.myAccount) : t(translations.nav.login)}
                >
                  <User className="w-[18px] h-[18px]" />
                </Link>
              )}

              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex items-center p-3 text-[#6B6560] hover:text-[#FFF8F0] transition-colors min-w-[44px] min-h-[44px]"
                aria-label={t(translations.nav.cart)}
              >
                <ShoppingBag className="w-[18px] h-[18px]" />
                {mounted && itemCount > 0 && (
                  <span className="absolute top-2 right-1.5 w-4 h-4 bg-[#FF6B35] text-white text-[10px] font-bold flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-3 text-[#FFF8F0] hover:opacity-70 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={isOpen ? t(translations.nav.closeMenu) : t(translations.nav.openMenu)}
                aria-expanded={isOpen}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu — full screen, elegant */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 bg-[#1F1D1A]/98 backdrop-blur-md" onClick={() => setIsOpen(false)} />
            <motion.nav
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className="space-y-1 text-center">
                <div className="mb-8">
                  <img src="/logos/logo-simmer-light.svg" alt="Simmer Down" className="h-14 w-auto mx-auto" />
                </div>
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`block py-4 font-display text-3xl tracking-tight transition-colors ${
                        pathname === link.href
                          ? 'text-[#FFF8F0]'
                          : 'text-[#6B6560] hover:text-[#FFF8F0]'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                {/* Secondary links */}
                <div className="pt-8 mt-8 border-t border-[#3D3936]/40 space-y-3">
                  <Link
                    href="/events"
                    onClick={() => setIsOpen(false)}
                    className="block py-2 text-sm uppercase tracking-[0.15em] text-[#6B6560] hover:text-[#FFF8F0] transition-colors"
                  >
                    {t(translations.nav.events)}
                  </Link>
                  <Link
                    href="/simmerlovers"
                    onClick={() => setIsOpen(false)}
                    className="block py-2 text-sm uppercase tracking-[0.15em] text-[#6B6560] hover:text-[#FFF8F0] transition-colors"
                  >
                    SimmerLovers
                  </Link>
                  <Link
                    href={user ? '/account' : '/auth/login'}
                    onClick={() => setIsOpen(false)}
                    className="block py-2 text-sm uppercase tracking-[0.15em] text-[#6B6560] hover:text-[#FFF8F0] transition-colors"
                  >
                    {user ? t(translations.nav.myAccount) : t(translations.nav.login)}
                  </Link>
                </div>

                <div className="pt-6">
                  <LanguageToggle />
                </div>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
