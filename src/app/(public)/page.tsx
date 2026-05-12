'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, MapPin, Truck, Store, ChevronDown, Sparkles } from 'lucide-react'
import { useI18n, translations } from '@/lib/i18n'
import { useCartStore } from '@/store/cart'
import { useAuth } from '@/hooks/useAuth'
import { ScrollReveal } from '@/components/cinema/ScrollReveal'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderType = 'delivery' | 'pickup'

// ─── Static Data ──────────────────────────────────────────────────────────────

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
    image: '/images/menu/pizza-memoravel.jpg',
  },
  {
    id: 2,
    titleEs: 'PIZZA DEL MES',
    titleEn: 'PIZZA OF THE MONTH',
    subtitleEs: 'La Memoravel — Favorita de todos',
    subtitleEn: "La Memoravel — Everyone's Favorite",
    price: '$12.99',
    badgeEs: '⭐ NUEVO',
    badgeEn: '⭐ NEW',
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
    image: '/images/menu/pizzas-hero.jpg',
  },
]

const CATEGORIES = [
  { id: 'pizzas',        labelEs: 'Pizzas',         labelEn: 'Pizzas',    emoji: '🍕', image: '/images/menu/pizza-memoravel.jpg' },
  { id: 'pastas',        labelEs: 'Pastas',          labelEn: 'Pastas',    emoji: '🍝', image: '/images/menu/food-IMG20045.jpg' },
  { id: 'mariscos',      labelEs: 'Mariscos',        labelEn: 'Seafood',   emoji: '🦐', image: '/images/menu/entradas-seafood-trio.jpg' },
  { id: 'entradas',      labelEs: 'Entradas',        labelEn: 'Starters',  emoji: '🥟', image: '/images/menu/entradas-cheese-balls.jpg' },
  { id: 'platos-fuertes', labelEs: 'Platos Fuertes', labelEn: 'Mains',    emoji: '🍽️', image: '/images/menu/pro-IMG4591.jpg' },
  { id: 'bebidas',       labelEs: 'Bebidas',         labelEn: 'Drinks',    emoji: '🍺', image: '/images/menu/cervezas.jpg' },
  { id: 'postres',       labelEs: 'Postres',         labelEn: 'Desserts',  emoji: '🍫', image: '/images/menu/brownie-helado.jpg' },
  { id: 'cafe',          labelEs: 'Café',            labelEn: 'Coffee',    emoji: '☕', image: '/images/menu/frozen-positive.jpg' },
]

const SIGNATURES = [
  {
    id: 'memoravel',
    name: 'La Memoravel',
    descEs: 'Fajitas de res y pollo, BBQ artesanal, ajonjolí tostado. La más pedida desde 2013.',
    descEn: 'Beef & chicken fajitas, artisan BBQ, toasted sesame. Our most ordered since 2013.',
    image: '/images/menu/pizza-memoravel.jpg',
    href: '/menu?category=pizzas',
  },
  {
    id: 'terramar',
    name: 'Terramar al Maître',
    descEs: 'Langostinos salteados en mantequilla de hierbas finas y vino blanco.',
    descEn: 'Prawns sautéed in fine herb butter and white wine.',
    image: '/images/menu/pro-IMG4591.jpg',
    href: '/menu?category=mariscos',
  },
  {
    id: 'fettuccine',
    name: 'Fettuccine Calamardiña',
    descEs: 'Calamar fresco en salsa de tomate natural con albahaca y toque picante.',
    descEn: 'Fresh squid in natural tomato sauce with basil and a hint of spice.',
    image: '/images/menu/food-IMG20045.jpg',
    href: '/menu?category=pastas',
  },
]

const LOCATIONS = [
  { id: 'santa-ana',   nameEs: 'Santa Ana',       nameEn: 'Santa Ana',       vibeEs: 'Origen',         vibeEn: 'Origin',        image: '/images/locations/santa-ana-interior-2.jpg' },
  { id: 'coatepeque',  nameEs: 'Coatepeque',       nameEn: 'Coatepeque',      vibeEs: 'Frente al lago', vibeEn: 'Lakeside',       image: '/images/locations/coatepeque-2.jpg' },
  { id: 'san-benito',  nameEs: 'San Benito',        nameEn: 'San Benito',      vibeEs: 'Jazz & Pizza',   vibeEn: 'Jazz & Pizza',   image: '/images/locations/san-benito-1.jpg' },
  { id: 'garden',      nameEs: 'Simmer Garden',    nameEn: 'Simmer Garden',   vibeEs: 'Al aire libre',  vibeEn: 'Open Air',       image: '/images/locations/garden-4.jpg' },
  { id: 'surf-city',   nameEs: 'Surf City',         nameEn: 'Surf City',       vibeEs: 'Frente al mar',  vibeEn: 'Oceanfront',     image: '/images/locations/surf-city-exterior.jpg' },
]

const LOCATION_NAMES = ['Santa Ana', 'San Benito', 'Lago de Coatepeque', 'Surf City', 'Simmer Garden']

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const { locale, t } = useI18n()
  const router = useRouter()
  const { user } = useAuth()
  const cartCount = useCartStore((s) => s.getItemCount())

  const [orderType, setOrderType] = useState<OrderType>('delivery')
  const [activePromo, setActivePromo] = useState(0)
  const [locationOpen, setLocationOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState('Santa Ana')
  const [activeTab, setActiveTab] = useState('home')
  const promoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#1F1D1A] font-sans pb-20 lg:pb-0">

      {/* ════════════════════════════════════════════════════════════════════
          1. HERO — Full-viewport photo background
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[100vh] flex items-end overflow-hidden">

        {/* Photo background */}
        <div className="absolute inset-0">
          <Image
            src="/images/heroes/homepage-pizzas.jpg"
            alt="Simmer Down"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F1D1A] via-[#1F1D1A]/60 to-transparent" />
        </div>

        {/* Bottom-aligned content */}
        <div className="relative z-10 w-full px-6 pb-16 max-w-5xl mx-auto">
          {/* Est badge */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-[#C9A84C] text-xs font-semibold tracking-[0.25em] uppercase mb-5"
          >
            Est. 2013
          </motion.p>

          {/* Logo icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
            className="mb-6"
          >
            <Image
              src="/logos/logo-icon.svg"
              alt="Simmer Down icon"
              width={64}
              height={64}
              className="w-14 h-14 object-contain"
            />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="font-display text-[clamp(3rem,10vw,7rem)] font-bold text-[#FFF8F0] leading-none tracking-tight mb-4"
          >
            Simmer Down
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
            className="text-[#B8B0A8] text-base md:text-lg mb-10 max-w-md"
          >
            {t(translations.home.tagline)}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
            className="flex flex-wrap gap-3"
          >
            <Link
              href="/reservations"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#FFF8F0] text-[#FFF8F0] text-sm font-semibold tracking-wide uppercase hover:bg-[#FFF8F0] hover:text-[#1F1D1A] transition-all duration-300"
            >
              {t(translations.nav.reservations)}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white text-sm font-semibold tracking-wide uppercase hover:bg-[#E55A2B] transition-all duration-300"
            >
              {t(translations.nav.orderNow)}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          2. ORDER MODE STRIP
      ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#252320] border-t border-b border-[#3D3936]/30 py-3">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between gap-4 flex-wrap">

          {/* Delivery / Pickup toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOrderType('delivery')}
              className={`flex items-center gap-1.5 px-4 py-2 border text-xs font-semibold uppercase tracking-wide transition-all duration-200 ${
                orderType === 'delivery'
                  ? 'bg-[#FF6B35]/15 text-[#FF6B35] border-[#FF6B35]'
                  : 'text-[#6B6560] border-[#3D3936] hover:text-[#B8B0A8] hover:border-[#B8B0A8]/40'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              {locale === 'es' ? 'A Domicilio' : 'Delivery'}
            </button>
            <button
              onClick={() => setOrderType('pickup')}
              className={`flex items-center gap-1.5 px-4 py-2 border text-xs font-semibold uppercase tracking-wide transition-all duration-200 ${
                orderType === 'pickup'
                  ? 'bg-[#FF6B35]/15 text-[#FF6B35] border-[#FF6B35]'
                  : 'text-[#6B6560] border-[#3D3936] hover:text-[#B8B0A8] hover:border-[#B8B0A8]/40'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              {locale === 'es' ? 'Recoger' : 'Pick Up'}
            </button>
          </div>

          {/* Location dropdown */}
          <div className="relative">
            <button
              onClick={() => setLocationOpen(!locationOpen)}
              className="flex items-center gap-2 text-[#B8B0A8] hover:text-[#FFF8F0] transition-colors text-xs font-medium"
            >
              <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" />
              <span>{selectedLocation}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${locationOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {locationOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-full mt-2 bg-[#252320] border border-[#3D3936] shadow-2xl z-50 min-w-[180px]"
                >
                  {LOCATION_NAMES.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => { setSelectedLocation(loc); setLocationOpen(false) }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-left transition-colors hover:bg-[#3D3936]/40 ${
                        selectedLocation === loc ? 'text-[#FF6B35]' : 'text-[#B8B0A8]'
                      }`}
                    >
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {loc}
                      {selectedLocation === loc && <span className="ml-auto text-[#FF6B35]">✓</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          3. PROMO CAROUSEL
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-[#1F1D1A]">
        <div className="max-w-5xl mx-auto px-6">
          <ScrollReveal>
            <h2 className="font-display text-2xl md:text-3xl text-[#FFF8F0] mb-8">
              {locale === 'es' ? 'Lo Más Hot 🔥' : 'Hottest Deals 🔥'}
            </h2>
          </ScrollReveal>

          {/* Carousel */}
          <div className="relative overflow-hidden h-64 md:h-80 bg-[#252320] border border-[#3D3936]">
            <AnimatePresence mode="wait">
              {PROMOS.map((promo, index) =>
                index === activePromo ? (
                  <motion.div
                    key={promo.id}
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -60 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="absolute inset-0 flex"
                  >
                    {/* Text */}
                    <div className="flex-1 flex flex-col justify-center px-8 md:px-12 z-10">
                      <span className="inline-block bg-[#FF6B35]/20 text-[#FF6B35] text-[10px] font-bold px-3 py-1 uppercase tracking-widest mb-4 self-start">
                        {locale === 'es' ? promo.badgeEs : promo.badgeEn}
                      </span>
                      <h3 className="font-display text-2xl md:text-4xl text-[#FFF8F0] leading-tight mb-2">
                        {locale === 'es' ? promo.titleEs : promo.titleEn}
                      </h3>
                      <p className="text-[#B8B0A8] text-sm mb-5">
                        {locale === 'es' ? promo.subtitleEs : promo.subtitleEn}
                      </p>
                      <div className="inline-flex self-start">
                        <span className="bg-[#FF6B35] text-white font-bold text-xl px-5 py-2.5">
                          {promo.price}
                        </span>
                      </div>
                    </div>

                    {/* Photo */}
                    <div className="relative w-2/5 md:w-1/2 flex-shrink-0">
                      <Image
                        src={promo.image}
                        alt={locale === 'es' ? promo.titleEs : promo.titleEn}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 40vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#252320] via-[#252320]/30 to-transparent" />
                    </div>
                  </motion.div>
                ) : null
              )}
            </AnimatePresence>
          </div>

          {/* Dot navigation */}
          <div className="flex items-center gap-2 mt-5">
            {PROMOS.map((_, index) => (
              <button
                key={index}
                onClick={() => goToPromo(index)}
                className={`transition-all duration-300 ${
                  index === activePromo
                    ? 'w-8 h-2 bg-[#C9A84C]'
                    : 'w-2 h-2 bg-[#3D3936] hover:bg-[#6B6560]'
                }`}
                aria-label={`Promo ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          4. CATEGORY GRID
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#2D2A26]">
        <div className="max-w-5xl mx-auto px-6">
          <ScrollReveal>
            <h2 className="font-display text-2xl md:text-3xl text-[#FFF8F0] mb-10">
              {locale === 'es' ? 'Nuestro Menú' : 'Our Menu'}
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat, i) => (
              <ScrollReveal key={cat.id} delay={i * 60}>
                <button
                  onClick={() => router.push(`/menu?category=${cat.id}`)}
                  className="group w-full overflow-hidden border border-[#3D3936] hover:border-[#FF6B35]/50 transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={cat.image}
                      alt={locale === 'es' ? cat.labelEs : cat.labelEn}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1F1D1A]/90 via-[#1F1D1A]/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-[#FFF8F0] font-semibold text-sm leading-tight">
                        <span className="mr-1.5">{cat.emoji}</span>
                        {locale === 'es' ? cat.labelEs : cat.labelEn}
                      </p>
                    </div>
                  </div>
                </button>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          5. SIGNATURE DISHES
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#1F1D1A]">
        <div className="max-w-5xl mx-auto px-6">
          <ScrollReveal>
            <p className="text-[#C9A84C] text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              {locale === 'es' ? 'Lo que nos define' : 'What defines us'}
            </p>
            <h2 className="font-display text-2xl md:text-3xl text-[#FFF8F0] mb-12">
              {t(translations.home.specialties)}
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SIGNATURES.map((dish, i) => (
              <ScrollReveal key={dish.id} delay={i * 100}>
                <Link href={dish.href} className="group block overflow-hidden border border-[#3D3936] hover:border-[#FF6B35]/50 transition-all duration-300">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image
                      src={dish.image}
                      alt={dish.name}
                      fill
                      className="object-cover transition-transform duration-600 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1F1D1A]/95 via-[#1F1D1A]/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="font-display text-xl text-[#FFF8F0] mb-2">{dish.name}</h3>
                      <p className="text-[#B8B0A8] text-xs leading-relaxed">
                        {locale === 'es' ? dish.descEs : dish.descEn}
                      </p>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          6. LOCATIONS
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#2D2A26]">
        <div className="max-w-5xl mx-auto px-6">
          <ScrollReveal>
            <p className="text-[#C9A84C] text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              {t(translations.home.uniqueDestinations)}
            </p>
            <h2 className="font-display text-2xl md:text-3xl text-[#FFF8F0] mb-12">
              {t(translations.home.ourLocations)}
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {LOCATIONS.map((loc, i) => (
              <ScrollReveal key={loc.id} delay={i * 80}>
                <Link href={`/locations#${loc.id}`} className="group block overflow-hidden border border-[#3D3936] hover:border-[#C9A84C]/50 transition-all duration-300">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={loc.image}
                      alt={locale === 'es' ? loc.nameEs : loc.nameEn}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1F1D1A]/90 via-[#1F1D1A]/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-[#FFF8F0] font-semibold text-xs mb-0.5">
                        {locale === 'es' ? loc.nameEs : loc.nameEn}
                      </p>
                      <p className="text-[#C9A84C] text-[10px] font-medium tracking-wide">
                        {locale === 'es' ? loc.vibeEs : loc.vibeEn}
                      </p>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          7. BRAND STORY
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#252320]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Photo */}
            <ScrollReveal>
              <div className="relative aspect-[4/5] overflow-hidden border border-[#3D3936]">
                <Image
                  src="/images/menu/pizza-memoravel.jpg"
                  alt={locale === 'es' ? 'Nuestra historia' : 'Our story'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-[#1F1D1A]/20" />
              </div>
            </ScrollReveal>

            {/* Text */}
            <ScrollReveal delay={150}>
              <p className="text-[#C9A84C] text-xs font-semibold tracking-[0.2em] uppercase mb-4">
                {t(translations.home.ourStory)}
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-[#FFF8F0] leading-tight mb-8">
                {t(translations.home.moreThanRestaurant)}
              </h2>

              <div className="space-y-5 text-[#B8B0A8] text-sm leading-relaxed">
                <p>
                  {t(translations.home.story1)}{' '}
                  <strong className="text-[#FFF8F0]">Santa Ana</strong>
                  {t(translations.home.story1b)}
                </p>
                <p>
                  {t(translations.home.story2)}{' '}
                  <strong className="text-[#FFF8F0]">San Benito</strong>{' '}
                  {t(translations.home.story2b)}{' '}
                  <strong className="text-[#FFF8F0]">Surf City</strong>
                  {t(translations.home.story2c)}
                </p>
                <p className="text-[#FFF8F0] font-medium">
                  {t(translations.home.story3)}
                </p>
              </div>

              <Link
                href="/about"
                className="inline-flex items-center gap-2 mt-8 text-[#FF6B35] text-sm font-semibold hover:gap-3 transition-all duration-200"
              >
                {t(translations.home.fullStory)}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          8. SIMMERLOVERS CTA
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-[#1F1D1A]">
        <div className="max-w-5xl mx-auto px-6">
          <ScrollReveal>
            <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/20 p-10 md:p-14 text-center">
              <div className="flex justify-center mb-5">
                <Sparkles className="w-8 h-8 text-[#C9A84C]" />
              </div>
              <p className="text-[#C9A84C] text-xs font-semibold tracking-[0.2em] uppercase mb-3">
                SimmerLovers
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-[#FFF8F0] mb-4">
                {t(translations.home.joinFamily)}
              </h2>
              <p className="text-[#B8B0A8] text-sm max-w-md mx-auto mb-8 leading-relaxed">
                {t(translations.home.earnRewards)}
              </p>
              <Link
                href="/simmerlovers"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#C9A84C] text-[#1F1D1A] text-sm font-bold uppercase tracking-wide hover:bg-[#F5D47A] transition-all duration-300"
              >
                {t(translations.home.joinFree)}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          9. RESERVATION CTA
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#252320]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <ScrollReveal>
            <p className="text-[#C9A84C] text-xs font-semibold tracking-[0.2em] uppercase mb-4">
              {locale === 'es' ? 'Reservaciones' : 'Reservations'}
            </p>
            <h2 className="font-display text-3xl md:text-5xl text-[#FFF8F0] mb-3">
              {locale === 'es' ? 'Tu mesa te espera.' : 'Your table awaits.'}
            </h2>
            <p className="text-[#B8B0A8] text-sm mb-10 max-w-sm mx-auto">
              {locale === 'es'
                ? 'Reserva en segundos. Sin llamadas. Sin esperas.'
                : 'Reserve in seconds. No calls. No waiting.'}
            </p>
            <Link
              href="/reservations"
              className="inline-flex items-center gap-2 px-10 py-4 border border-[#FFF8F0] text-[#FFF8F0] text-sm font-semibold uppercase tracking-wide hover:bg-[#FFF8F0] hover:text-[#1F1D1A] transition-all duration-300"
            >
              {t(translations.nav.reservations)}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          FOOTER CREDIT
      ════════════════════════════════════════════════════════════════════ */}
      <footer className="py-6 bg-[#1F1D1A] border-t border-[#3D3936]/30 text-center">
        <p className="text-[#6B6560] text-[11px] tracking-wide">
          Crafted by{' '}
          <a
            href="https://machinemind.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#C9A84C] hover:text-[#F5D47A] transition-colors"
          >
            MachineMind
          </a>
        </p>
      </footer>

      {/* ════════════════════════════════════════════════════════════════════
          10. BOTTOM NAV — Mobile only
      ════════════════════════════════════════════════════════════════════ */}
      <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-[#1F1D1A] border-t border-[#3D3936]">
        <div className="flex items-stretch h-16 safe-area-pb">

          {/* Home */}
          <Link
            href="/"
            onClick={() => setActiveTab('home')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              activeTab === 'home' ? 'text-[#FF6B35]' : 'text-[#6B6560] hover:text-[#B8B0A8]'
            }`}
          >
            <span className="text-xl leading-none">🏠</span>
            <span className="text-[9px] font-semibold tracking-wide uppercase leading-none mt-0.5">
              {locale === 'es' ? 'Inicio' : 'Home'}
            </span>
          </Link>

          {/* Menu */}
          <Link
            href="/menu"
            onClick={() => setActiveTab('menu')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              activeTab === 'menu' ? 'text-[#FF6B35]' : 'text-[#6B6560] hover:text-[#B8B0A8]'
            }`}
          >
            <span className="text-xl leading-none">🍕</span>
            <span className="text-[9px] font-semibold tracking-wide uppercase leading-none mt-0.5">
              {locale === 'es' ? 'Menú' : 'Menu'}
            </span>
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            onClick={() => setActiveTab('cart')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
              activeTab === 'cart' ? 'text-[#FF6B35]' : 'text-[#6B6560] hover:text-[#B8B0A8]'
            }`}
          >
            <span className="text-xl leading-none relative">
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-[#FF6B35] text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </span>
            <span className="text-[9px] font-semibold tracking-wide uppercase leading-none mt-0.5">
              {locale === 'es' ? 'Ordenar' : 'Order'}
            </span>
          </Link>

          {/* SimmerLovers */}
          <Link
            href="/simmerlovers"
            onClick={() => setActiveTab('simmerlovers')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              activeTab === 'simmerlovers' ? 'text-[#FF6B35]' : 'text-[#6B6560] hover:text-[#B8B0A8]'
            }`}
          >
            <span className="text-xl leading-none">⭐</span>
            <span className="text-[9px] font-semibold tracking-wide uppercase leading-none mt-0.5">
              Lovers
            </span>
          </Link>

          {/* Account */}
          <Link
            href={user ? '/account' : '/auth/login'}
            onClick={() => setActiveTab('account')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              activeTab === 'account' ? 'text-[#FF6B35]' : 'text-[#6B6560] hover:text-[#B8B0A8]'
            }`}
          >
            <span className="text-xl leading-none">👤</span>
            <span className="text-[9px] font-semibold tracking-wide uppercase leading-none mt-0.5">
              {locale === 'es' ? 'Cuenta' : 'Account'}
            </span>
          </Link>
        </div>
      </nav>

    </div>
  )
}
