'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cart'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const itemCount = useCartStore((state) => state.getItemCount())

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="bg-black text-white sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🍕</span>
            <span className="font-bold text-xl tracking-tight">SIMMER DOWN</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/menu" className="hover:text-orange-400 transition">
              Menu
            </Link>
            <Link href="/orders" className="hover:text-orange-400 transition">
              Track Order
            </Link>
            <Link href="/cart" className="relative hover:text-orange-400 transition">
              <ShoppingCart className="w-6 h-6" />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              href="/menu"
              className="block py-2 hover:text-orange-400"
              onClick={() => setIsOpen(false)}
            >
              Menu
            </Link>
            <Link
              href="/orders"
              className="block py-2 hover:text-orange-400"
              onClick={() => setIsOpen(false)}
            >
              Track Order
            </Link>
            <Link
              href="/cart"
              className="block py-2 hover:text-orange-400"
              onClick={() => setIsOpen(false)}
            >
              Cart {mounted && itemCount > 0 && `(${itemCount})`}
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
