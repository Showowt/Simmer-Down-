'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ShoppingBag } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cart'

const navLinks = [
  { href: '/menu', label: 'Menu' },
  { href: '/locations', label: 'Locations' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function Header() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const items = useCartStore((state) => state.items)
  const getSubtotal = useCartStore((state) => state.getSubtotal)
  const itemCount = useCartStore((state) => state.getItemCount())

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800' : 'bg-transparent'
        }`}
      >
        <nav className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link
              href="/"
              className="text-xl font-bold text-white tracking-tight hover:text-orange-400 transition-colors"
            >
              Simmer Down
            </Link>

            {/* Desktop Nav - Improved visibility */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-sm font-medium transition-colors py-2 ${
                    pathname === link.href
                      ? 'text-orange-400'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  {link.label}
                  {/* Active/hover underline */}
                  <span
                    className={`absolute bottom-0 left-0 w-full h-0.5 bg-orange-400 transition-transform origin-left ${
                      pathname === link.href ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Cart with total */}
              <Link
                href="/cart"
                className="relative flex items-center gap-2 p-2 text-zinc-300 hover:text-white transition-colors"
                aria-label={`Shopping cart${mounted && itemCount > 0 ? `, ${itemCount} items, $${getSubtotal().toFixed(2)}` : ''}`}
              >
                <ShoppingBag className="w-5 h-5" />
                {mounted && itemCount > 0 && (
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <span className="bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                    <span className="hidden sm:inline text-white">
                      ${getSubtotal().toFixed(2)}
                    </span>
                  </span>
                )}
              </Link>

              {/* Order CTA - Desktop */}
              <Link
                href="/menu"
                className="hidden md:flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 text-sm font-semibold transition-all hover:translate-y-[-1px]"
              >
                Order Now
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 text-white hover:text-orange-400 transition-colors"
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu - Full screen overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div
              className="absolute inset-0 bg-black/90"
              onClick={() => setIsOpen(false)}
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute top-0 right-0 bottom-0 w-80 bg-zinc-950 border-l border-zinc-800 p-8 pt-24"
            >
              {/* Large touch targets - 56px min */}
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block py-4 text-xl font-medium transition-colors ${
                      pathname === link.href
                        ? 'text-orange-400'
                        : 'text-zinc-300 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-zinc-800">
                <Link
                  href="/menu"
                  onClick={() => setIsOpen(false)}
                  className="block w-full bg-orange-500 hover:bg-orange-600 text-white py-4 text-center text-lg font-semibold transition-colors"
                >
                  Order Now
                </Link>

                {/* Cart summary in mobile menu */}
                {mounted && itemCount > 0 && (
                  <Link
                    href="/cart"
                    onClick={() => setIsOpen(false)}
                    className="mt-4 flex items-center justify-between p-4 bg-zinc-900 text-white"
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5" />
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
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
