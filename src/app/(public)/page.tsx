'use client'

/**
 * SIMMER DOWN — Pizza Hut-Style Mobile Ordering Homepage
 *
 * White/light bg, red CTAs, rounded corners, mascot greeting,
 * colorful promo carousel, simple category grid, red bottom nav.
 * Wired to real integrations: i18n, cart store, auth, real photos.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { useCartStore } from '@/store/cart'
import { useAuth } from '@/hooks/useAuth'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type OrderType = 'delivery' | 'pickup'

interface Promo {
  id: number
  titleEs: string
  titleEn: string
  subtitleEs: string
  subtitleEn: string
  price: string
  badgeEs: string
  badgeEn: string
  image: string
  gradient: string
}

interface Category {
  id: string
  labelEs: string
  labelEn: string
  emoji: string
  image: string
  badge?: string
}

interface Signature {
  id: string
  name: string
  descEs: string
  descEn: string
  price: string
  image: string
  href: string
}

interface Location {
  id: string
  nameEs: string
  nameEn: string
  vibeEs: string
  vibeEn: string
  phone: string
  image: string
}

// ═══════════════════════════════════════════════════════════════
// DATA — Real Simmer Down menu, locations, promos
// ═══════════════════════════════════════════════════════════════

const PROMOS: Promo[] = [
  {
    id: 1,
    titleEs: 'COMBO FAMILIAR',
    titleEn: 'FAMILY COMBO',
    subtitleEs: '2 Pizzas Grandes + Breadsticks + Bebida',
    subtitleEn: '2 Large Pizzas + Breadsticks + Drink',
    price: '$24.99',
    badgeEs: 'HOT DEAL',
    badgeEn: 'HOT DEAL',
    image: '/images/menu/pizza-memoravel.jpg',
    gradient: 'from-orange-500 to-red-600',
  },
  {
    id: 2,
    titleEs: 'PIZZA DEL MES',
    titleEn: 'PIZZA OF THE MONTH',
    subtitleEs: 'La Memoravel — La más pedida desde 2013',
    subtitleEn: 'La Memoravel — Most ordered since 2013',
    price: '$12.99',
    badgeEs: 'NUEVO',
    badgeEn: 'NEW',
    image: '/images/menu/pizza-maradona.jpg',
    gradient: 'from-green-600 to-emerald-700',
  },
  {
    id: 3,
    titleEs: 'MARTES 2×1',
    titleEn: 'TUESDAY 2×1',
    subtitleEs: 'Todas las pizzas medianas',
    subtitleEn: 'All medium pizzas',
    price: '2×1',
    badgeEs: 'SOLO MARTES',
    badgeEn: 'TUE ONLY',
    image: '/images/menu/pizzas-hero.jpg',
    gradient: 'from-purple-600 to-pink-600',
  },
]

const CATEGORIES: Category[] = [
  { id: 'pizzas',         labelEs: 'Pizzas',         labelEn: 'Pizzas',    emoji: '🍕', image: '/images/menu/pizza-memoravel.jpg' },
  { id: 'combos',         labelEs: 'Combos',         labelEn: 'Combos',    emoji: '🍕🍟', image: '/images/menu/pro-IMG4632.jpg', badge: '🔥' },
  { id: 'entradas',       labelEs: 'Entradas',        labelEn: 'Starters',  emoji: '🥟', image: '/images/menu/entradas-cheese-balls.jpg' },
  { id: 'pastas',         labelEs: 'Pastas',          labelEn: 'Pastas',    emoji: '🍝', image: '/images/menu/food-IMG20045.jpg', badge: 'NUEVO' },
  { id: 'mariscos',       labelEs: 'Mariscos',        labelEn: 'Seafood',   emoji: '🦐', image: '/images/menu/entradas-seafood-trio.jpg' },
  { id: 'bebidas',        labelEs: 'Bebidas',         labelEn: 'Drinks',    emoji: '🍺', image: '/images/menu/cervezas.jpg' },
  { id: 'postres',        labelEs: 'Postres',         labelEn: 'Desserts',  emoji: '🍫', image: '/images/menu/brownie-helado.jpg' },
  { id: 'cafe',           labelEs: 'Café',            labelEn: 'Coffee',    emoji: '☕', image: '/images/menu/frozen-positive.jpg' },
]

const SIGNATURES: Signature[] = [
  {
    id: 'memoravel',
    name: 'La Memoravel',
    descEs: 'Fajitas de res y pollo, BBQ artesanal, ajonjolí tostado.',
    descEn: 'Beef & chicken fajitas, artisan BBQ, toasted sesame.',
    price: '$14.99',
    image: '/images/menu/pizza-memoravel.jpg',
    href: '/menu?category=pizzas',
  },
  {
    id: 'terramar',
    name: 'Terramar al Maître',
    descEs: 'Langostinos en mantequilla de hierbas finas y vino blanco.',
    descEn: 'Prawns in fine herb butter and white wine.',
    price: '$18.99',
    image: '/images/menu/pro-IMG4591.jpg',
    href: '/menu?category=mariscos',
  },
  {
    id: 'fettuccine',
    name: 'Fettuccine Calamardiña',
    descEs: 'Calamar fresco en salsa de tomate con albahaca.',
    descEn: 'Fresh squid in tomato sauce with basil.',
    price: '$15.99',
    image: '/images/menu/food-IMG20045.jpg',
    href: '/menu?category=pastas',
  },
]

const LOCATIONS: Location[] = [
  { id: 'santa-ana',  nameEs: 'Santa Ana',      nameEn: 'Santa Ana',      vibeEs: 'El Origen — Frente a la Catedral',       vibeEn: 'The Origin — Cathedral Square', phone: '+503 2441-3400', image: '/images/locations/santa-ana-cover.jpg' },
  { id: 'coatepeque', nameEs: 'Coatepeque',      nameEn: 'Coatepeque',     vibeEs: 'Frente al Lago — Vista al volcán',       vibeEn: 'Lakeside — Volcano views',       phone: '+503 2441-3401', image: '/images/locations/coatepeque-cover.jpg' },
  { id: 'san-benito', nameEs: 'San Benito',       nameEn: 'San Benito',     vibeEs: 'Jazz & Pizza — San Salvador',            vibeEn: 'Jazz & Pizza — San Salvador',    phone: '+503 2441-3402', image: '/images/locations/san-benito-cover.jpg' },
  { id: 'garden',     nameEs: 'Simmer Garden',   nameEn: 'Simmer Garden',  vibeEs: 'Al Aire Libre — Eventos privados',       vibeEn: 'Open Air — Private events',      phone: '+503 2441-3403', image: '/images/locations/santa-ana-aesthetic.jpg' },
  { id: 'surf-city',  nameEs: 'Surf City',        nameEn: 'Surf City',      vibeEs: 'Frente al Mar — El Tunco',               vibeEn: 'Oceanfront — El Tunco',          phone: '+503 2441-3404', image: '/images/locations/lago-real-01.jpg' },
]

const LOCATION_NAMES = ['Santa Ana', 'San Benito', 'Lago de Coatepeque', 'Surf City', 'Simmer Garden']

// ═══════════════════════════════════════════════════════════════
// ICONS — Simple inline SVGs
// ═══════════════════════════════════════════════════════════════

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function Home() {
  const { locale } = useI18n()
  const router = useRouter()
  const { user } = useAuth()
  const cartCount = useCartStore((s) => s.getItemCount())
  const isEs = locale === 'es'

  const [orderType, setOrderType] = useState<OrderType>('delivery')
  const [currentPromo, setCurrentPromo] = useState(0)
  const [selectedLocation, setSelectedLocation] = useState('Santa Ana')
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const promoRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-rotate promos
  const startCarousel = useCallback(() => {
    promoRef.current = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % PROMOS.length)
    }, 4000)
  }, [])

  useEffect(() => {
    startCarousel()
    return () => { if (promoRef.current) clearInterval(promoRef.current) }
  }, [startCarousel])

  const goToPromo = (index: number) => {
    if (promoRef.current) clearInterval(promoRef.current)
    setCurrentPromo(index)
    startCarousel()
  }

  // ─── RENDER ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* ══════════════════════════════════════════════════════════
          STICKY HEADER — White, logo, cart badge, search, menu
      ══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logos/logo-full.svg"
              alt="Simmer Down"
              width={150}
              height={44}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 hover:bg-gray-100 rounded-full transition"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
            {/* Search */}
            <button className="p-2 hover:bg-gray-100 rounded-full transition">
              <SearchIcon className="w-6 h-6 text-gray-700" />
            </button>
            {/* Hamburger */}
            <button className="p-2 hover:bg-gray-100 rounded-full transition">
              <HamburgerIcon className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          ORDER TYPE TOGGLE — A DOMICILIO / RECOGER EN TIENDA
      ══════════════════════════════════════════════════════════ */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex bg-gray-200 rounded-xl p-1">
            <button
              onClick={() => setOrderType('delivery')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
                orderType === 'delivery'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-300'
              }`}
            >
              <span className="text-lg">🛵</span>
              {isEs ? 'A DOMICILIO' : 'DELIVERY'}
            </button>
            <button
              onClick={() => setOrderType('pickup')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
                orderType === 'pickup'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-300'
              }`}
            >
              <span className="text-lg">🏪</span>
              {isEs ? 'RECOGER EN TIENDA' : 'PICK UP'}
            </button>
          </div>

          {/* Location selector */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-gray-400 text-xs">📍</span>
            <button
              onClick={() => setShowLocationPicker(!showLocationPicker)}
              className="text-sm text-gray-600 font-medium hover:text-red-600 transition flex items-center gap-1"
            >
              {selectedLocation}
              <svg className={`w-3.5 h-3.5 transition-transform ${showLocationPicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <span className="text-xs text-gray-400">—</span>
            <span className="text-xs text-red-600 font-semibold">
              {orderType === 'delivery' ? (isEs ? 'A Domicilio' : 'Delivery') : (isEs ? 'Recoger' : 'Pick Up')}
            </span>
            <button className="ml-auto text-xs text-red-600 font-semibold hover:underline">
              {isEs ? 'Cambiar' : 'Change'}
            </button>
          </div>

          {/* Location dropdown */}
          {showLocationPicker && (
            <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {LOCATION_NAMES.map((loc) => (
                <button
                  key={loc}
                  onClick={() => { setSelectedLocation(loc); setShowLocationPicker(false) }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-gray-50 ${
                    selectedLocation === loc ? 'text-red-600 font-bold bg-red-50' : 'text-gray-700'
                  }`}
                >
                  <span>📍</span>
                  {loc}
                  {selectedLocation === loc && <span className="ml-auto text-red-600">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          PROMO CAROUSEL — Colorful gradients, auto-rotate
      ══════════════════════════════════════════════════════════ */}
      <section className="px-4 py-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-black text-gray-900 mb-3">
          {isEs ? 'Lo Más Hot 🔥' : 'Hottest Deals 🔥'}
        </h2>

        <div className="relative overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentPromo * 100}%)` }}
          >
            {PROMOS.map((promo) => (
              <div key={promo.id} className="w-full flex-shrink-0">
                <div className={`bg-gradient-to-r ${promo.gradient} p-5 rounded-2xl min-h-[180px] relative overflow-hidden`}>
                  {/* Badge */}
                  <span className="absolute top-3 left-3 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded z-10">
                    {isEs ? promo.badgeEs : promo.badgeEn}
                  </span>

                  <div className="flex items-center h-full pt-4">
                    {/* Text */}
                    <div className="flex-1 pr-4">
                      <h3 className="text-white text-2xl font-black leading-tight mb-1">
                        {isEs ? promo.titleEs : promo.titleEn}
                      </h3>
                      <p className="text-white/80 text-sm mb-3">
                        {isEs ? promo.subtitleEs : promo.subtitleEn}
                      </p>
                      <span className="inline-block bg-white text-red-600 font-black text-xl px-4 py-1.5 rounded-lg shadow-lg">
                        {promo.price}
                      </span>
                    </div>

                    {/* Photo circle */}
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/30 flex-shrink-0 relative">
                      <Image
                        src={promo.image}
                        alt={isEs ? promo.titleEs : promo.titleEn}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-3">
            {PROMOS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToPromo(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentPromo ? 'w-6 bg-red-600' : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          MASCOT GREETING
      ══════════════════════════════════════════════════════════ */}
      <section className="px-4 py-4 border-b border-gray-200 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          {/* Mascot */}
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-200 flex-shrink-0">
            <span className="text-4xl">🍕</span>
          </div>

          {/* Greeting */}
          <div className="flex-1">
            <h2 className="text-2xl font-black text-gray-900">
              {isEs ? '¡Hola!' : 'Hey there!'}
            </h2>
            <p className="text-gray-500 text-sm">
              {isEs ? '¡Hoy es día de pizza! 🎉' : "It's pizza day! 🎉"}
            </p>
          </div>

          {/* WhatsApp chat button */}
          <a
            href="https://wa.me/50324413400"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-green-500 shadow-xl rounded-full flex items-center justify-center hover:scale-110 transition-transform flex-shrink-0"
          >
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CATEGORY GRID — 2-column, real food photos, rounded
      ══════════════════════════════════════════════════════════ */}
      <section className="px-4 py-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-black text-gray-900 mb-4">
          {isEs ? 'Menú' : 'Menu'}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => router.push(`/menu?category=${cat.id}`)}
              className="relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {/* Badge */}
              {cat.badge && (
                <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded z-10">
                  {cat.badge}
                </span>
              )}

              {/* Food photo */}
              <div className="aspect-[4/3] relative bg-gray-100">
                <Image
                  src={cat.image}
                  alt={isEs ? cat.labelEs : cat.labelEn}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>

              {/* Label */}
              <div className="p-3 text-center">
                <span className="font-bold text-gray-900 text-sm">
                  {cat.emoji} {isEs ? cat.labelEs : cat.labelEn}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Full menu link */}
        <Link
          href="/menu"
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition text-sm"
        >
          {isEs ? 'Ver Menú Completo' : 'View Full Menu'}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SIGNATURE DISHES — Photography-led showcase
      ══════════════════════════════════════════════════════════ */}
      <section className="px-4 py-6 bg-white max-w-5xl mx-auto">
        <p className="text-red-600 text-xs font-bold uppercase tracking-widest mb-1">
          {isEs ? 'Lo que nos define' : 'What defines us'}
        </p>
        <h2 className="text-2xl font-black text-gray-900 mb-4">
          {isEs ? 'Nuestras Especialidades' : 'Our Specialties'}
        </h2>

        <div className="space-y-3">
          {SIGNATURES.map((dish) => (
            <Link
              key={dish.id}
              href={dish.href}
              className="flex items-center gap-4 bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {/* Photo */}
              <div className="w-28 h-28 relative flex-shrink-0">
                <Image
                  src={dish.image}
                  alt={dish.name}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>

              {/* Info */}
              <div className="flex-1 py-3 pr-4">
                <h3 className="font-bold text-gray-900 text-base">{dish.name}</h3>
                <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">
                  {isEs ? dish.descEs : dish.descEn}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-red-600 font-black text-lg">{dish.price}</span>
                  <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-lg">
                    + {isEs ? 'Agregar' : 'Add'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          LOCATIONS — All 5, with photos and contact
      ══════════════════════════════════════════════════════════ */}
      <section className="px-4 py-6 max-w-5xl mx-auto">
        <p className="text-red-600 text-xs font-bold uppercase tracking-widest mb-1">
          {isEs ? '5 destinos únicos' : '5 unique destinations'}
        </p>
        <h2 className="text-2xl font-black text-gray-900 mb-4">
          {isEs ? 'Nuestras Ubicaciones' : 'Our Locations'}
        </h2>

        <div className="space-y-3">
          {LOCATIONS.map((loc) => (
            <Link
              key={loc.id}
              href={`/locations#${loc.id}`}
              className="flex items-center gap-4 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              {/* Photo */}
              <div className="w-24 h-24 relative flex-shrink-0">
                <Image
                  src={loc.image}
                  alt={isEs ? loc.nameEs : loc.nameEn}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>

              {/* Info */}
              <div className="flex-1 py-3 pr-4">
                <h3 className="font-bold text-gray-900 text-sm">
                  {isEs ? loc.nameEs : loc.nameEn}
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  {isEs ? loc.vibeEs : loc.vibeEn}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <a
                    href={`tel:${loc.phone.replace(/\s/g, '')}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-red-600 text-xs font-bold hover:underline"
                  >
                    📞 {isEs ? 'Llamar' : 'Call'}
                  </a>
                  <Link
                    href="/reservations"
                    onClick={(e) => e.stopPropagation()}
                    className="text-red-600 text-xs font-bold hover:underline"
                  >
                    📅 {isEs ? 'Reservar' : 'Reserve'}
                  </Link>
                </div>
              </div>

              {/* Arrow */}
              <svg className="w-5 h-5 text-gray-300 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        <Link
          href="/locations"
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-red-600 text-red-600 font-bold rounded-xl hover:bg-red-50 transition text-sm"
        >
          {isEs ? 'Ver Todas las Ubicaciones' : 'View All Locations'}
        </Link>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SIMMERLOVERS CTA — Loyalty program
      ══════════════════════════════════════════════════════════ */}
      <section className="px-4 py-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl p-6 text-center text-white shadow-lg">
          <span className="text-3xl mb-2 block">⭐</span>
          <h2 className="text-xl font-black mb-1">SimmerLovers</h2>
          <p className="text-white/80 text-sm mb-4">
            {isEs
              ? 'Gana puntos, desbloquea recompensas, recibe ofertas exclusivas.'
              : 'Earn points, unlock rewards, get exclusive offers.'}
          </p>
          <Link
            href="/simmerlovers"
            className="inline-block bg-white text-red-600 font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-gray-100 transition shadow-md"
          >
            {isEs ? 'Únete Gratis' : 'Join Free'}
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          WHATSAPP CTA BAR
      ══════════════════════════════════════════════════════════ */}
      <section className="px-4 py-4 max-w-5xl mx-auto">
        <a
          href="https://wa.me/50324413400"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 bg-green-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-600 transition"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {isEs ? '¿Necesitas ayuda? Escríbenos por WhatsApp' : 'Need help? Message us on WhatsApp'}
        </a>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="px-4 py-6 text-center border-t border-gray-200 max-w-5xl mx-auto">
        <p className="text-gray-400 text-xs">
          © 2026 Simmer Down — {isEs ? 'Todos los derechos reservados' : 'All rights reserved'}
        </p>
        <p className="text-gray-300 text-[10px] mt-1">
          Crafted by{' '}
          <a href="https://machinemind.co" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-500 transition">
            MachineMind
          </a>
        </p>
      </footer>

      {/* ══════════════════════════════════════════════════════════
          BOTTOM NAV — Red bar, fixed, mobile only
      ══════════════════════════════════════════════════════════ */}
      <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-red-600 text-white safe-area-pb">
        <div className="flex items-center justify-around py-2 max-w-5xl mx-auto">
          {/* Menu */}
          <Link href="/menu" className="flex flex-col items-center gap-1 px-4 py-1 opacity-100">
            <span className="text-xl">📍</span>
            <span className="text-[10px] font-medium">{isEs ? 'Menú' : 'Menu'}</span>
          </Link>

          {/* Favorites */}
          <Link href="/menu" className="flex flex-col items-center gap-1 px-4 py-1 opacity-70 hover:opacity-100 transition">
            <span className="text-xl">❤️</span>
            <span className="text-[10px] font-medium">{isEs ? 'Favoritos' : 'Favorites'}</span>
          </Link>

          {/* Cart */}
          <Link href="/cart" className="flex flex-col items-center gap-1 px-4 py-1 opacity-70 hover:opacity-100 transition relative">
            <span className="text-xl relative">
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[16px] h-4 bg-yellow-400 text-black text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium">{isEs ? 'Carrito' : 'Cart'}</span>
          </Link>

          {/* Cupones */}
          <Link href="/simmerlovers" className="flex flex-col items-center gap-1 px-4 py-1 opacity-70 hover:opacity-100 transition">
            <span className="text-xl">🎟️</span>
            <span className="text-[10px] font-medium">{isEs ? 'Cupones' : 'Coupons'}</span>
          </Link>

          {/* Account */}
          <Link
            href={user ? '/account' : '/auth/login'}
            className="flex flex-col items-center gap-1 px-4 py-1 opacity-70 hover:opacity-100 transition"
          >
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-medium">
              {user ? (isEs ? 'Cuenta' : 'Account') : (isEs ? 'Ingresar' : 'Sign In')}
            </span>
          </Link>
        </div>
      </nav>

    </div>
  )
}
