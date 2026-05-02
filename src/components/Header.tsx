'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ShoppingBag, Flame, User } from 'lucide-react'
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
  const items = useCartStore((state) => state.items)
  const getSubtotal = useCartStore((state) => state.getSubtotal)
  const itemCount = useCartStore((state) => state.getItemCount())
  const { user, profile, loading: authLoading } = useAuth()
  const { t } = useI18n()

  const navLinks = [
    { href: '/menu', label: t(translations.nav.menu) },
    { href: '/locations', label: t(translations.nav.locations) },
    { href: '/reservations', label: t(translations.nav.reservations) },
    { href: '/about', label: t(translations.nav.about) },
    { href: '/events', label: t(translations.nav.events) },
    { href: '/simmerlovers', label: 'SimmerLovers' },
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#2D2A26]/95 backdrop-blur-sm border-b border-[#3D3936]' : 'bg-transparent'
        }`}
      >
        <nav className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-display text-[#FFF8F0] tracking-tight hover:text-[#FF6B35] transition-colors"
            >
              <Flame className="w-6 h-6 text-[#FF6B35]" />
              Simmer Down
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-sm font-medium transition-colors py-2 ${
                    pathname === link.href
                      ? 'text-[#FF6B35]'
                      : 'text-[#B8B0A8] hover:text-[#FFF8F0]'
                  }`}
                >
                  {link.label}
                  {pathname === link.href && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF6B35]" />
                  )}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Language Toggle - Desktop */}
              <LanguageToggle />

              {/* Account / Login */}
              {mounted && !authLoading && (
                user ? (
                  <Link
                    href="/account"
                    className="hidden sm:flex items-center gap-2 p-3 -m-1 text-[#B8B0A8] hover:text-[#FFF8F0] transition-colors min-w-[44px] min-h-[44px]"
                    aria-label={t(translations.nav.myAccount)}
                  >
                    <div className="w-8 h-8 bg-[#FF6B35] flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden md:inline text-sm">
                      {profile?.full_name?.split(' ')[0] || t(translations.nav.account)}
                    </span>
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    className="hidden sm:flex items-center gap-2 p-3 -m-1 text-[#B8B0A8] hover:text-[#FFF8F0] transition-colors min-w-[44px] min-h-[44px]"
                    aria-label={t(translations.auth.loginBtn)}
                  >
                    <User className="w-5 h-5" />
                    <span className="hidden md:inline text-sm">{t(translations.nav.login)}</span>
                  </Link>
                )
              )}

              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex items-center gap-2 p-3 -m-1 text-[#B8B0A8] hover:text-[#FFF8F0] transition-colors min-w-[44px] min-h-[44px]"
                aria-label={`${t(translations.nav.cart)}${mounted && itemCount > 0 ? `, ${itemCount} ${itemCount === 1 ? t(translations.cart.product) : t(translations.cart.products)}, $${getSubtotal().toFixed(2)}` : ''}`}
              >
                <ShoppingBag className="w-5 h-5" />
                {mounted && itemCount > 0 && (
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <span className="bg-[#FF6B35] text-white text-xs w-5 h-5 flex items-center justify-center">
                      {itemCount}
                    </span>
                    <span className="hidden sm:inline text-[#FFF8F0]">
                      ${getSubtotal().toFixed(2)}
                    </span>
                  </span>
                )}
              </Link>

              {/* Order CTA - Desktop */}
              <Link
                href="/menu"
                className="hidden lg:flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-5 py-2.5 text-sm font-semibold transition-all hover:translate-y-[-1px] min-h-[44px]"
              >
                {t(translations.nav.order)}
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2.5 -m-1 text-[#FFF8F0] hover:text-[#FF6B35] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={isOpen ? t(translations.nav.closeMenu) : t(translations.nav.openMenu)}
                aria-expanded={isOpen}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-[#1F1D1A]/95"
              onClick={() => setIsOpen(false)}
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute top-0 right-0 bottom-0 w-80 bg-[#2D2A26] border-l border-[#3D3936] p-8 pt-24"
            >
              {/* Language Toggle - Mobile */}
              <div className="mb-4">
                <LanguageToggle />
              </div>

              <div className="space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block py-4 text-xl font-medium transition-colors ${
                      pathname === link.href
                        ? 'text-[#FF6B35]'
                        : 'text-[#B8B0A8] hover:text-[#FFF8F0]'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Mobile Account Link */}
                {mounted && !authLoading && (
                  user ? (
                    <Link
                      href="/account"
                      onClick={() => setIsOpen(false)}
                      className="block py-4 text-xl font-medium text-[#B8B0A8] hover:text-[#FFF8F0] transition-colors"
                    >
                      {t(translations.nav.myAccount)}
                    </Link>
                  ) : (
                    <Link
                      href="/auth/login"
                      onClick={() => setIsOpen(false)}
                      className="block py-4 text-xl font-medium text-[#B8B0A8] hover:text-[#FFF8F0] transition-colors"
                    >
                      {t(translations.auth.loginBtn)}
                    </Link>
                  )
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-[#3D3936]">
                <Link
                  href="/menu"
                  onClick={() => setIsOpen(false)}
                  className="block w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white py-4 text-center text-lg font-semibold transition-colors min-h-[56px]"
                >
                  {t(translations.nav.orderNow)}
                </Link>

                {mounted && itemCount > 0 && (
                  <Link
                    href="/cart"
                    onClick={() => setIsOpen(false)}
                    className="mt-4 flex items-center justify-between p-4 bg-[#252320] text-[#FFF8F0] border border-[#3D3936]"
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5" />
                      {itemCount} {itemCount === 1 ? t(translations.cart.product) : t(translations.cart.products)}
                    </span>
                    <span className="font-semibold">${getSubtotal().toFixed(2)}</span>
                  </Link>
                )}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
