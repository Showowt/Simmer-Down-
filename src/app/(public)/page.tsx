'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'
import { MapPin, ChevronRight, MessageCircle, Star, Flame, Leaf } from 'lucide-react'
import { useTranslation, useCartStore } from '@/lib/store'
import {
  LOCATIONS,
  MENU_CATEGORIES,
  getFeaturedItems,
  formatPrice,
  isLocationOpen,
} from '@/lib/data'

// ─── Animation variants ────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
}

// ─── Location card covers ─────────────────────────────────────────────────

const LOCATION_COVER: Record<string, string> = {
  'santa-ana': '/images/locations/santa-ana-cover.jpg',
  'lago-coatepeque': '/images/locations/coatepeque-dock-wide.jpg',
  'san-benito': '/images/locations/san-benito-cover.jpg',
  'surf-city': '/images/locations/surf-city-cover.jpg',
  'simmer-garden': '/images/locations/simmer-garden-cover.jpg',
}

// ─── Pre-computed featured items (stable reference) ───────────────────────

const FEATURED_ITEMS = getFeaturedItems()

// ─── Homepage ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const { t, language: locale } = useTranslation()
  const addItem = useCartStore((s) => s.addItem)

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">

      {/* ══════════════════════════════════════════════════
          1. HERO — Full-viewport, image-led, bottom-left copy
      ══════════════════════════════════════════════════ */}
      <section
        aria-label="Hero"
        className="relative min-h-[100dvh] flex items-end overflow-hidden -mt-20"
      >
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/heroes/homepage-pizzas.jpg"
            alt="Simmer Down — pizza artesanal de horno de leña"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Gradient: opaque at bottom for text legibility, lighter at top */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
          {/* Left vignette */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
        </div>

        {/* Hero content — bottom-left */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-24 lg:pb-32 pt-36">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
          >
            {/* Badge */}
            <motion.p
              variants={fadeUp}
              className="text-[#FBBF24] text-xs font-semibold uppercase tracking-[0.25em] mb-5"
            >
              {t('hero.badge')}
            </motion.p>

            {/* Main title */}
            <motion.h1
              variants={fadeUp}
              className="font-display text-white leading-[0.92] mb-3"
              style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
            >
              {locale === 'es' ? 'PIZZA ARTESANAL' : 'HANDCRAFTED PIZZA'}
            </motion.h1>

            {/* Orange accent line */}
            <motion.p
              variants={fadeUp}
              className="font-display text-[#E85D04] leading-[0.95] mb-6"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              {locale === 'es' ? 'SOLO BUENAS VIBRAS' : 'GOOD VIBES ONLY'}
            </motion.p>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              className="text-white/65 text-base md:text-lg leading-relaxed max-w-lg mb-10"
            >
              {t('hero.subtitle')}
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Link
                href="/carta"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E85D04] to-[#C2410C] text-white px-7 py-3.5 rounded-full font-semibold text-sm uppercase tracking-wider transition-all hover:shadow-[0_0_24px_rgba(232,93,4,0.5)] hover:scale-[1.02] active:scale-[0.98]"
              >
                {locale === 'es' ? 'Ver Menú' : 'View Menu'}
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/restaurantes"
                className="inline-flex items-center gap-2 border border-white/30 text-white px-7 py-3.5 rounded-full font-semibold text-sm uppercase tracking-wider transition-all hover:border-white/70 hover:bg-white/10 backdrop-blur-sm"
              >
                <MapPin className="w-4 h-4" />
                {locale === 'es' ? 'Encontrar Ubicaciones' : 'Find Locations'}
              </Link>
            </motion.div>
          </motion.div>

          {/* Social proof strip */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="mt-14 flex flex-wrap gap-6 text-sm text-white/50"
          >
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-[#FBBF24] fill-[#FBBF24]" />
              <span className="text-white/80 font-medium">4.9</span>
              <span>{locale === 'es' ? '· +8,000 reseñas' : '· 8,000+ reviews'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
              <span>Est. 2013 &bull; El Salvador</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
              <span>{locale === 'es' ? '5 Ubicaciones' : '5 Locations'}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          2. CATEGORY CHIPS — Horizontal scroll row
      ══════════════════════════════════════════════════ */}
      <section aria-label="Categorías del menú" className="bg-[#0A0A0A] border-b border-white/5">
        <div
          className="flex gap-3 px-6 py-6 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {MENU_CATEGORIES.sort((a, b) => a.sortOrder - b.sortOrder).map((cat) => (
            <Link
              key={cat.id}
              href={`/carta?category=${cat.id}`}
              className="flex-shrink-0 flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-5 py-2.5 rounded-full text-sm text-white/70 font-medium whitespace-nowrap transition-all hover:border-[#E85D04] hover:text-white hover:bg-[#E85D04]/10"
            >
              <span className="text-base leading-none">{cat.icon}</span>
              <span>{locale === 'es' ? cat.nameEs : cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          3. FEATURED ITEMS — "Nuestras Especialidades"
      ══════════════════════════════════════════════════ */}
      <section aria-label="Especialidades" className="py-20 md:py-28 px-6 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-end justify-between mb-10"
          >
            <div>
              <p className="text-[#E85D04] text-xs font-semibold uppercase tracking-[0.2em] mb-2">
                {locale === 'es' ? 'Desde el horno' : 'From the oven'}
              </p>
              <h2
                className="font-display text-white leading-tight"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
              >
                {locale === 'es' ? 'NUESTRAS ESPECIALIDADES' : 'OUR SPECIALTIES'}
              </h2>
            </div>
            <Link
              href="/carta"
              className="hidden md:inline-flex items-center gap-2 text-white/50 text-sm font-medium uppercase tracking-wider hover:text-[#E85D04] transition-colors"
            >
              {locale === 'es' ? 'Ver todo' : 'View all'}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Items grid: 2 cols mobile, 4 cols desktop */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {FEATURED_ITEMS.slice(0, 8).map((item) => (
              <motion.div
                key={item.id}
                variants={fadeUp}
                className="group bg-[#1A1A1A] rounded-xl overflow-hidden border border-white/8 hover:border-[#E85D04]/40 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-[#252525]">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={locale === 'es' ? item.nameEs : item.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl select-none">
                      🍕
                    </div>
                  )}
                  {/* Dietary badges */}
                  {(item.isVegetarian || item.isSpicy) && (
                    <div className="absolute top-2 left-2 flex gap-1">
                      {item.isVegetarian && (
                        <span className="bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Leaf className="w-2.5 h-2.5" />
                        </span>
                      )}
                      {item.isSpicy && (
                        <span className="bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  )}
                  {item.isNew && (
                    <span className="absolute top-2 right-2 bg-[#FBBF24] text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {locale === 'es' ? 'Nuevo' : 'New'}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3.5 flex flex-col gap-2">
                  <p className="text-white font-semibold text-sm leading-tight line-clamp-1">
                    {locale === 'es' ? item.nameEs : item.name}
                  </p>
                  {(item.descriptionEs || item.description) && (
                    <p className="text-white/45 text-xs leading-relaxed line-clamp-2">
                      {locale === 'es' ? item.descriptionEs : item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[#E85D04] font-bold text-sm">
                      {locale === 'es' ? 'Desde ' : 'From '}
                      {formatPrice(item.basePrice)}
                    </p>
                    <button
                      onClick={() => addItem(item, 1)}
                      className="bg-[#E85D04] hover:bg-[#C2410C] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors active:scale-95"
                      aria-label={`${locale === 'es' ? 'Agregar' : 'Add'} ${locale === 'es' ? item.nameEs : item.name}`}
                    >
                      {locale === 'es' ? 'Agregar' : 'Add'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Mobile "ver todo" link */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 md:hidden text-center"
          >
            <Link
              href="/carta"
              className="inline-flex items-center gap-2 text-white/60 text-sm font-medium uppercase tracking-wider hover:text-[#E85D04] transition-colors"
            >
              {locale === 'es' ? 'Ver menú completo' : 'View full menu'}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          4. LOCATIONS PREVIEW — Horizontal scroll of 5 cards
      ══════════════════════════════════════════════════ */}
      <section aria-label="Ubicaciones" className="bg-[#1A1A1A] py-20 md:py-28">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-end justify-between mb-10 px-6"
          >
            <div>
              <p className="text-[#FBBF24] text-xs font-semibold uppercase tracking-[0.2em] mb-2">
                {locale === 'es' ? '5 destinos únicos' : '5 unique destinations'}
              </p>
              <h2
                className="font-display text-white leading-tight"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
              >
                {locale === 'es'
                  ? '5 UBICACIONES EN EL SALVADOR'
                  : '5 LOCATIONS IN EL SALVADOR'}
              </h2>
            </div>
            <Link
              href="/restaurantes"
              className="hidden md:inline-flex items-center gap-2 text-white/50 text-sm font-medium uppercase tracking-wider hover:text-[#FBBF24] transition-colors"
            >
              {locale === 'es' ? 'Ver todas' : 'View all'}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Horizontal scroll */}
          <div
            className="flex gap-4 px-6 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {LOCATIONS.map((loc, i) => {
              const open = isLocationOpen(loc)
              const coverImg = LOCATION_COVER[loc.id] || loc.heroImage

              return (
                <motion.div
                  key={loc.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="group flex-shrink-0 w-[280px] bg-[#0A0A0A] rounded-xl border border-white/8 overflow-hidden hover:border-[#FBBF24]/40 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={coverImg}
                      alt={loc.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="280px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    {/* Open / closed badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${
                          open
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-black/60 text-white/60 border border-white/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            open ? 'bg-white animate-pulse' : 'bg-white/40'
                          }`}
                        />
                        {open
                          ? locale === 'es' ? 'Abierto' : 'Open'
                          : locale === 'es' ? 'Cerrado' : 'Closed'}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4 flex flex-col gap-3">
                    <div>
                      <p className="text-white font-semibold text-sm leading-tight">
                        {loc.shortName}
                      </p>
                      <p className="text-white/45 text-xs mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {loc.city}
                      </p>
                    </div>
                    <p className="text-white/40 text-xs leading-relaxed">
                      {loc.hours.weekday !== 'Cerrado'
                        ? `${locale === 'es' ? 'Lun–Vie' : 'Mon–Fri'}: ${loc.hours.weekday}`
                        : `${locale === 'es' ? 'Fines de semana' : 'Weekends'}: ${loc.hours.weekend}`}
                    </p>
                    <Link
                      href={`/locations/${loc.slug}`}
                      className="flex items-center justify-between text-[#FBBF24] text-xs font-semibold uppercase tracking-wide hover:text-white transition-colors"
                    >
                      {locale === 'es' ? 'Ver Detalles' : 'View Details'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Bottom "ver todas" link */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 px-6 text-center"
          >
            <Link
              href="/restaurantes"
              className="inline-flex items-center gap-2 text-white/50 text-sm font-medium uppercase tracking-wider hover:text-[#FBBF24] transition-colors"
            >
              {locale === 'es' ? 'Ver Todas las Ubicaciones' : 'View All Locations'}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          5. WHATSAPP CTA — Orange gradient
      ══════════════════════════════════════════════════ */}
      <section aria-label="WhatsApp Order" className="py-16 px-6 bg-[#0A0A0A]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto bg-gradient-to-r from-[#E85D04] to-[#C2410C] rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="text-center md:text-left">
            <h2
              className="font-display text-white leading-tight mb-3"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}
            >
              {locale === 'es' ? '¿LISTO PARA ORDENAR?' : 'READY TO ORDER?'}
            </h2>
            <p className="text-white/80 text-base md:text-lg max-w-md leading-relaxed">
              {locale === 'es'
                ? 'Haz tu pedido por WhatsApp de forma rápida y fácil. Nuestro equipo estará listo para atenderte.'
                : 'Place your order via WhatsApp quickly and easily. Our team is ready to serve you.'}
            </p>
          </div>

          <a
            href="https://wa.me/50375764655?text=Hola%2C%20quiero%20hacer%20un%20pedido%20%F0%9F%8D%95"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-sm md:text-base px-8 py-4 rounded-full transition-all hover:shadow-[0_0_30px_rgba(37,211,102,0.4)] hover:scale-[1.03] active:scale-[0.97] uppercase tracking-wide"
          >
            <MessageCircle className="w-5 h-5" />
            {locale === 'es' ? 'Ordenar por WhatsApp' : 'Order via WhatsApp'}
          </a>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          6. SIMMERLOVERS BANNER — Loyalty program teaser
      ══════════════════════════════════════════════════ */}
      <section aria-label="SimmerLovers" className="py-16 px-6 bg-[#0A0A0A]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          <div className="relative bg-[#1A1A1A] rounded-2xl border border-[#FBBF24]/30 overflow-hidden p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Gold shimmer overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FBBF24]/5 via-transparent to-[#FBBF24]/5 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FBBF24]/60 to-transparent" />

            {/* Text */}
            <div className="relative text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-3">
                <span className="text-xl" aria-hidden="true">⭐</span>
                <p className="text-[#FBBF24] text-xs font-bold uppercase tracking-[0.2em]">
                  {locale === 'es' ? 'Programa de Lealtad' : 'Loyalty Program'}
                </p>
              </div>
              <h2
                className="font-display text-white leading-tight mb-3"
                style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)' }}
              >
                SIMMERLOVERS
              </h2>
              <p className="text-white/60 text-base md:text-lg max-w-md leading-relaxed">
                {locale === 'es'
                  ? 'Gana puntos con cada pedido, desbloquea recompensas exclusivas y recibe ofertas antes que nadie.'
                  : 'Earn points with every order, unlock exclusive rewards and receive offers before anyone else.'}
              </p>

              {/* Mini perks row */}
              <div className="flex flex-wrap gap-4 mt-5 justify-center md:justify-start">
                {[
                  {
                    icon: '🍕',
                    label: locale === 'es' ? 'Puntos por pedido' : 'Points per order',
                  },
                  {
                    icon: '🎁',
                    label: locale === 'es' ? 'Recompensas exclusivas' : 'Exclusive rewards',
                  },
                  {
                    icon: '🎉',
                    label: locale === 'es' ? 'Sorpresas de cumpleaños' : 'Birthday surprises',
                  },
                ].map((perk) => (
                  <div
                    key={perk.label}
                    className="flex items-center gap-1.5 text-white/50 text-sm"
                  >
                    <span aria-hidden="true">{perk.icon}</span>
                    <span>{perk.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="relative flex-shrink-0 flex flex-col items-center gap-3">
              <Link
                href="/simmerlovers"
                className="inline-flex items-center gap-2 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-bold text-sm px-8 py-4 rounded-full transition-all hover:shadow-[0_0_24px_rgba(251,191,36,0.4)] hover:scale-[1.03] active:scale-[0.97] uppercase tracking-wider"
              >
                {locale === 'es' ? 'Únete Gratis' : 'Join Free'}
                <ChevronRight className="w-4 h-4" />
              </Link>
              <p className="text-white/35 text-xs text-center">
                {locale === 'es' ? 'Sin tarjeta de crédito' : 'No credit card required'}
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── MachineMind credit ── */}
      <div className="py-5 text-center bg-[#0A0A0A]">
        <p className="text-white/20 text-xs tracking-widest uppercase">
          Crafted by{' '}
          <a
            href="https://machinemind.co"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/40 transition-colors"
          >
            MachineMind
          </a>
        </p>
      </div>
    </div>
  )
}
