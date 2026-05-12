'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Menu, ShoppingBag, MapPin, ChevronDown, MessageCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useCartStore } from '@/store/cart'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderType = 'delivery' | 'pickup'

// ─── Promo Data ───────────────────────────────────────────────────────────────

const PROMOS = [
  {
    id: 1,
    titleEs: 'COMBO FAMILIAR',
    titleEn: 'FAMILY COMBO',
    subtitleEs: '2 Pizzas Grandes + Breadsticks',
    subtitleEn: '2 Large Pizzas + Breadsticks',
    price: '$24.99',
    badgeEs: '🔥 HOT DEAL',
    badgeEn: '🔥 HOT DEAL',
    gradient: 'from-orange-500 to-red-600',
    bgGradient: 'from-orange-400/20 to-red-500/20',
    emoji: '🍕',
    image: '/images/menu/pizza-memoravel.jpg',
  },
  {
    id: 2,
    titleEs: 'PIZZA DEL MES',
    titleEn: 'PIZZA OF THE MONTH',
    subtitleEs: 'La Memoravel — Favorita de todos',
    subtitleEn: 'La Memoravel — Everyone\'s Favorite',
    price: '$12.99',
    badgeEs: '⭐ NUEVO',
    badgeEn: '⭐ NEW',
    gradient: 'from-green-600 to-emerald-700',
    bgGradient: 'from-green-400/20 to-emerald-500/20',
    emoji: '🌿',
    image: '/images/menu/pizza-maradona.jpg',
  },
  {
    id: 3,
    titleEs: 'MARTES 2×1',
    titleEn: 'TUESDAY 2×1',
    subtitleEs: 'Todas las pizzas medianas',
    subtitleEn: 'All medium pizzas',
    price: '2×1',
    badgeEs: '📅 SOLO MARTES',
    badgeEn: '📅 TUE ONLY',
    gradient: 'from-purple-600 to-pink-600',
    bgGradient: 'from-purple-400/20 to-pink-500/20',
    emoji: '🎉',
    image: '/images/menu/pizzas-hero.jpg',
  },
]

// ─── Category Data ────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'pizzas',
    labelEs: 'Pizzas',
    labelEn: 'Pizzas',
    emoji: '🍕',
    image: '/images/menu/pizza-memoravel.jpg',
    badge: null,
    gradient: 'from-red-500 to-orange-400',
  },
  {
    id: 'combos',
    labelEs: 'Combos',
    labelEn: 'Combos',
    emoji: '🔥',
    image: '/images/menu/pro-IMG4591.jpg',
    badge: '🔥 POPULAR',
    gradient: 'from-orange-500 to-yellow-400',
  },
  {
    id: 'entradas',
    labelEs: 'Entradas',
    labelEn: 'Starters',
    emoji: '🥟',
    image: '/images/menu/entradas-seafood-trio.jpg',
    badge: null,
    gradient: 'from-amber-500 to-orange-400',
  },
  {
    id: 'pastas',
    labelEs: 'Pastas',
    labelEn: 'Pastas',
    emoji: '🍝',
    image: '/images/menu/food-IMG20045.jpg',
    badge: 'NUEVO',
    gradient: 'from-yellow-500 to-amber-400',
  },
  {
    id: 'mariscos',
    labelEs: 'Mariscos',
    labelEn: 'Seafood',
    emoji: '🦐',
    image: '/images/menu/entradas-cheese-balls.jpg',
    badge: null,
    gradient: 'from-blue-500 to-cyan-400',
  },
  {
    id: 'bebidas',
    labelEs: 'Bebidas',
    labelEn: 'Drinks',
    emoji: '🥤',
    image: '/images/menu/cervezas.jpg',
    badge: null,
    gradient: 'from-cyan-500 to-blue-400',
  },
  {
    id: 'postres',
    labelEs: 'Postres',
    labelEn: 'Desserts',
    emoji: '🍰',
    image: '/images/menu/brownie-helado.jpg',
    badge: null,
    gradient: 'from-pink-500 to-rose-400',
  },
  {
    id: 'cafe',
    labelEs: 'Café',
    labelEn: 'Coffee',
    emoji: '☕',
    image: '/images/menu/frozen-positive.jpg',
    badge: null,
    gradient: 'from-stone-600 to-amber-700',
  },
]

// ─── Bottom Nav Config ────────────────────────────────────────────────────────

const NAV_TABS = [
  {
    id: 'menu',
    labelEs: 'Menú',
    labelEn: 'Menu',
    icon: '🍕',
    href: '/menu',
  },
  {
    id: 'favorites',
    labelEs: 'Favoritos',
    labelEn: 'Favorites',
    icon: '❤️',
    href: '/simmerlovers',
  },
  {
    id: 'coupons',
    labelEs: 'Cupones',
    labelEn: 'Coupons',
    icon: '🎟️',
    href: '/events',
  },
  {
    id: 'login',
    labelEs: 'Ingresar',
    labelEn: 'Sign In',
    icon: '👤',
    href: '/auth/login',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const { locale } = useI18n()
  const router = useRouter()
  const cartCount = useCartStore((s) => s.getItemCount())

  const [orderType, setOrderType] = useState<OrderType>('delivery')
  const [activePromo, setActivePromo] = useState(0)
  const [activeTab, setActiveTab] = useState('menu')
  const [locationOpen, setLocationOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState('Santa Ana')
  const promoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-rotate promo carousel
  const startCarousel = useCallback(() => {
    promoIntervalRef.current = setInterval(() => {
      setActivePromo((prev) => (prev + 1) % PROMOS.length)
    }, 4000)
  }, [])

  useEffect(() => {
    startCarousel()
    return () => {
      if (promoIntervalRef.current) clearInterval(promoIntervalRef.current)
    }
  }, [startCarousel])

  const goToPromo = (index: number) => {
    if (promoIntervalRef.current) clearInterval(promoIntervalRef.current)
    setActivePromo(index)
    startCarousel()
  }

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/menu?category=${categoryId}`)
  }

  const locations = ['Santa Ana', 'San Benito', 'Lago de Coatepeque', 'Surf City', 'Simmer Garden']

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">

      {/* ─── STICKY HEADER ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logos/logo-full.svg"
              alt="Simmer Down"
              width={130}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Cart badge */}
            <Link href="/cart" className="relative p-1.5 text-gray-700 hover:text-red-600 transition-colors">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Search */}
            <button
              className="p-1.5 text-gray-700 hover:text-red-600 transition-colors"
              aria-label={locale === 'es' ? 'Buscar' : 'Search'}
              onClick={() => router.push('/menu')}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Hamburger */}
            <button
              className="p-1.5 text-gray-700 hover:text-red-600 transition-colors"
              aria-label={locale === 'es' ? 'Abrir menú' : 'Open menu'}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="max-w-lg mx-auto">

        {/* ── ORDER TYPE TOGGLE ────────────────────────────────────────────── */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex bg-gray-100 rounded-full p-1 gap-1">
            <button
              onClick={() => setOrderType('delivery')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full text-sm font-semibold transition-all duration-200 ${
                orderType === 'delivery'
                  ? 'bg-red-600 text-white shadow-md shadow-red-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-base">🛵</span>
              <span className="truncate">
                {locale === 'es' ? 'A DOMICILIO' : 'DELIVERY'}
              </span>
            </button>
            <button
              onClick={() => setOrderType('pickup')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full text-sm font-semibold transition-all duration-200 ${
                orderType === 'pickup'
                  ? 'bg-red-600 text-white shadow-md shadow-red-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-base">🏪</span>
              <span className="truncate">
                {locale === 'es' ? 'RECOGER EN TIENDA' : 'PICK UP'}
              </span>
            </button>
          </div>
        </div>

        {/* ── PROMO CAROUSEL ───────────────────────────────────────────────── */}
        <section className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-extrabold text-gray-900">
              {locale === 'es' ? 'Lo Más Hot 🔥' : 'Hottest Deals 🔥'}
            </h2>
          </div>

          {/* Carousel track */}
          <div className="relative overflow-hidden rounded-2xl h-40">
            <AnimatePresence mode="wait">
              {PROMOS.map((promo, index) =>
                index === activePromo ? (
                  <motion.div
                    key={promo.id}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className={`absolute inset-0 bg-gradient-to-r ${promo.gradient} flex items-center p-5 overflow-hidden`}
                  >
                    {/* Text side */}
                    <div className="flex-1 min-w-0 pr-4 z-10">
                      {/* Badge */}
                      <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full mb-2">
                        {locale === 'es' ? promo.badgeEs : promo.badgeEn}
                      </span>

                      <h3 className="text-white font-extrabold text-xl leading-tight mb-1">
                        {locale === 'es' ? promo.titleEs : promo.titleEn}
                      </h3>
                      <p className="text-white/80 text-xs leading-snug mb-3">
                        {locale === 'es' ? promo.subtitleEs : promo.subtitleEn}
                      </p>

                      {/* Price badge */}
                      <div className="inline-flex items-center bg-white rounded-xl px-3 py-1.5">
                        <span className="text-red-600 font-extrabold text-lg leading-none">
                          {promo.price}
                        </span>
                      </div>
                    </div>

                    {/* Image circle */}
                    <div className="relative flex-shrink-0 w-28 h-28">
                      {/* Decorative ring */}
                      <div className="absolute inset-0 rounded-full bg-white/10 scale-110" />
                      <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/30 shadow-xl relative z-10">
                        <Image
                          src={promo.image}
                          alt={locale === 'es' ? promo.titleEs : promo.titleEn}
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      </div>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
                    <div className="absolute -left-4 -top-4 w-20 h-20 rounded-full bg-white/5" />
                  </motion.div>
                ) : null
              )}
            </AnimatePresence>
          </div>

          {/* Dot navigation */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {PROMOS.map((_, index) => (
              <button
                key={index}
                onClick={() => goToPromo(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === activePromo
                    ? 'w-6 h-2 bg-red-600'
                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Promo ${index + 1}`}
              />
            ))}
          </div>
        </section>

        {/* ── MASCOT GREETING ──────────────────────────────────────────────── */}
        <section className="px-4 pt-2 pb-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            {/* Mascot avatar */}
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-yellow-400 flex items-center justify-center shadow-md">
              <Image
                src="/logos/logo-icon.svg"
                alt="Simmer Down mascot"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-gray-900 text-base leading-tight">
                {locale === 'es' ? '¡Hola!' : 'Hello!'}
              </p>
              <p className="text-gray-500 text-sm leading-tight mt-0.5 truncate">
                {locale === 'es' ? '¡Hoy es día de pizza! 🍕' : "Today is pizza day! 🍕"}
              </p>
            </div>

            {/* Chat button */}
            <a
              href="https://wa.me/50322455999?text=Hola!%20Quiero%20hacer%20un%20pedido%20en%20Simmer%20Down%20%F0%9F%8D%95"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-10 h-10 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-md transition-colors"
              aria-label={locale === 'es' ? 'Chatear por WhatsApp' : 'Chat on WhatsApp'}
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </a>
          </div>
        </section>

        {/* ── CATEGORY GRID ────────────────────────────────────────────────── */}
        <section className="px-4 pt-2 pb-4">
          <h2 className="text-lg font-extrabold text-gray-900 mb-3">
            {locale === 'es' ? 'Menú' : 'Menu'}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat, i) => (
              <motion.button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                whileTap={{ scale: 0.97 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-red-100 transition-all duration-200 text-left group"
              >
                {/* Image */}
                <div className="relative h-28 overflow-hidden">
                  <Image
                    src={cat.image}
                    alt={locale === 'es' ? cat.labelEs : cat.labelEn}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 512px) 50vw, 256px"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                  {/* Badge */}
                  {cat.badge && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide">
                        {cat.badge}
                      </span>
                    </div>
                  )}

                  {/* Emoji anchor */}
                  <div className="absolute bottom-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-lg shadow">
                    {cat.emoji}
                  </div>
                </div>

                {/* Label */}
                <div className="px-3 py-2.5">
                  <p className="font-extrabold text-gray-900 text-sm group-hover:text-red-600 transition-colors">
                    {locale === 'es' ? cat.labelEs : cat.labelEn}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ── QUICK ACCESS BANNER ──────────────────────────────────────────── */}
        <section className="px-4 pb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/50322455999?text=Hola!%20Quiero%20hacer%20un%20pedido%20en%20Simmer%20Down%20%F0%9F%8D%95"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3.5 bg-green-500 hover:bg-green-600 transition-colors"
            >
              <span className="text-xl">📞</span>
              <span className="text-white font-bold text-sm flex-1">
                {locale === 'es' ? 'Pedir por WhatsApp' : 'Order via WhatsApp'}
              </span>
              <span className="text-white/70 text-xs font-medium">
                {locale === 'es' ? 'Rápido y fácil →' : 'Fast & easy →'}
              </span>
            </a>

            {/* Location selector */}
            <div className="relative">
              <button
                onClick={() => setLocationOpen(!locationOpen)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-t border-gray-100"
              >
                <MapPin className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-gray-700 font-semibold text-sm flex-1 text-left">
                  {selectedLocation}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    locationOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {locationOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden border-t border-gray-100"
                  >
                    {locations.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => {
                          setSelectedLocation(loc)
                          setLocationOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-sm ${
                          selectedLocation === loc
                            ? 'text-red-600 font-bold'
                            : 'text-gray-600 font-medium'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        {loc}
                        {selectedLocation === loc && (
                          <span className="ml-auto text-red-600">✓</span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ── FEATURED DISH SPOTLIGHT ──────────────────────────────────────── */}
        <section className="px-4 pb-6">
          <h2 className="text-lg font-extrabold text-gray-900 mb-3">
            {locale === 'es' ? 'Plato Destacado' : 'Featured Dish'}
          </h2>
          <Link href="/menu?category=pizzas" className="block">
            <div className="relative rounded-2xl overflow-hidden h-48 group">
              <Image
                src="/images/menu/pizza-memoravel.jpg"
                alt="La Memoravel"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 512px) 100vw, 512px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide mb-2 inline-block">
                      {locale === 'es' ? '⭐ LA MÁS PEDIDA' : '⭐ MOST ORDERED'}
                    </span>
                    <h3 className="text-white font-extrabold text-xl leading-tight">
                      La Memoravel
                    </h3>
                    <p className="text-white/70 text-xs mt-0.5">
                      {locale === 'es'
                        ? 'Fajitas de res y pollo, BBQ, ajonjolí'
                        : 'Beef & chicken fajitas, BBQ, sesame'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 bg-white rounded-xl px-3 py-2 ml-3">
                    <p className="text-red-600 font-extrabold text-lg leading-none">$12.99</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* ── SURF & TURF SPOTLIGHT ─────────────────────────────────────────── */}
        <section className="px-4 pb-8">
          <div className="grid grid-cols-2 gap-3">
            {/* Terramar */}
            <Link href="/menu?category=mariscos" className="block group">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="relative h-32">
                  <Image
                    src="/images/menu/pro-IMG4591.jpg"
                    alt="Terramar al Maitre"
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 512px) 50vw, 256px"
                  />
                </div>
                <div className="p-3">
                  <p className="text-gray-900 font-extrabold text-xs leading-tight">Terramar al Maitre</p>
                  <p className="text-red-600 font-bold text-sm mt-0.5">$16.99</p>
                </div>
              </div>
            </Link>

            {/* Fettuccine */}
            <Link href="/menu?category=pastas" className="block group">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="relative h-32">
                  <Image
                    src="/images/menu/food-IMG20045.jpg"
                    alt="Fettuccine Calamardiña"
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 512px) 50vw, 256px"
                  />
                </div>
                <div className="p-3">
                  <p className="text-gray-900 font-extrabold text-xs leading-tight">Fettuccine Calamardiña</p>
                  <p className="text-red-600 font-bold text-sm mt-0.5">$13.99</p>
                </div>
              </div>
            </Link>
          </div>
        </section>

      </main>

      {/* ─── BOTTOM NAVIGATION (FIXED) ────────────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-red-600 safe-area-pb">
        <div className="max-w-lg mx-auto flex items-stretch h-16">
          {NAV_TABS.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-opacity ${
                activeTab === tab.id ? 'opacity-100' : 'opacity-60 hover:opacity-80'
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="text-white text-[10px] font-bold tracking-wide leading-none">
                {locale === 'es' ? tab.labelEs : tab.labelEn}
              </span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-white rounded-full" />
              )}
            </Link>
          ))}
        </div>
      </nav>

    </div>
  )
}
