'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useI18n, translations } from '@/lib/i18n'

// Location data — minimal
const locations = [
  {
    name: 'Santa Ana',
    vibe: 'El Origen',
    description: { es: 'Frente a la catedral, donde todo comenzó.', en: 'Facing the cathedral, where it all began.' },
    image: '/images/locations/gallery-santa-ana/santa-ana-interior-2.jpg',
  },
  {
    name: 'Lago de Coatepeque',
    vibe: 'Vista al Lago',
    description: { es: 'Pizza con la mejor vista del volcán.', en: 'Pizza with the best volcano view.' },
    image: '/images/locations/gallery-coatepeque/coatepeque-2.jpg',
  },
  {
    name: 'San Benito',
    vibe: 'San Salvador',
    description: { es: 'El corazón cosmopolita de la ciudad.', en: 'The cosmopolitan heart of the city.' },
    image: '/images/locations/gallery-san-benito/san-benito-1.jpg',
  },
  {
    name: 'Simmer Garden',
    vibe: 'Ruta de las Flores',
    description: { es: 'Naturaleza, café de altura y el encanto de Juayúa.', en: 'Nature, altitude coffee and the charm of Juayúa.' },
    image: '/images/locations/gallery-garden/garden-4.jpg',
  },
  {
    name: 'Surf City',
    vibe: 'Frente al Mar',
    description: { es: 'Atardecer, surf y libertad.', en: 'Sunsets, surf and freedom.' },
    image: '/images/locations/surf-city-exterior.jpg',
  },
]

// Signature dishes — let the photography speak
const signatureDishes = [
  {
    name: 'La Memoravel',
    description: { es: 'Fajitas de res y pollo, cebolla marinada, salsa BBQ, ajonjolí', en: 'Beef & chicken fajitas, marinated onion, BBQ sauce, sesame' },
    image: '/images/menu/pizza-memoravel.jpg',
  },
  {
    name: 'Terramar al Maitre',
    description: { es: 'Lomito con camarones jumbo, mantequilla maitre, vegetales de temporada', en: 'Tenderloin with jumbo shrimp, maitre butter, seasonal vegetables' },
    image: '/images/menu/pro-IMG4591.jpg',
  },
  {
    name: 'Fettuccine Calamardiña',
    description: { es: 'Calamares, camarones jumbo, almejas, mejillones en salsa marinera', en: 'Calamari, jumbo shrimp, clams, mussels in marinara sauce' },
    image: '/images/menu/food-IMG20045.jpg',
  },
]

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.15 } },
}

export default function Home() {
  const { t, locale } = useI18n()

  return (
    <div className="min-h-screen bg-[#1F1D1A]">

      {/* ─── HERO — Photography-led, minimal text ─── */}
      <section className="relative min-h-[85vh] md:min-h-[100vh] flex items-end overflow-hidden -mt-20">
        {/* Background */}
        <div className="absolute inset-0 bg-[#1F1D1A]">
          <Image
            src="/images/heroes/homepage-pizzas.jpg"
            alt="Simmer Down — artisan wood-fired pizzas"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F1D1A] via-[#1F1D1A]/60 to-transparent" />
        </div>

        {/* Content — bottom-aligned, restrained */}
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="relative z-10 max-w-6xl mx-auto px-6 pb-12 md:pb-28 pt-24 md:pt-0 w-full"
        >
          <motion.p
            variants={fadeUp}
            className="text-[#B8B0A8] text-sm uppercase tracking-[0.2em] mb-4"
          >
            Est. 2013 &mdash; El Salvador
          </motion.p>

          <motion.div variants={fadeUp} className="mb-6">
            <Image src="/logos/logo-brand-full.svg" alt="Simmer Down flame logo" width={48} height={48} className="mb-4" />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display text-4xl md:text-7xl lg:text-8xl text-[#FFF8F0] tracking-tight leading-[0.95] mb-4 md:mb-6"
          >
            Simmer Down
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-base md:text-xl text-[#B8B0A8] max-w-lg mb-6 md:mb-10 leading-relaxed"
          >
            {t(translations.home.subtitle)}
          </motion.p>

          <motion.div variants={fadeUp} className="flex gap-4">
            <Link
              href="/reservations"
              className="inline-flex items-center gap-2 bg-[#FFF8F0] text-[#1F1D1A] px-7 py-4 text-sm uppercase tracking-[0.1em] font-semibold transition-all hover:bg-white min-h-[52px]"
            >
              {t(translations.nav.reservations)}
            </Link>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 border border-[#FFF8F0]/30 text-[#FFF8F0] px-7 py-4 text-sm uppercase tracking-[0.1em] font-semibold transition-all hover:border-[#FFF8F0]/60 min-h-[52px]"
            >
              {t(translations.nav.menu)}
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── SIGNATURE DISHES — Photography grid, no badges ─── */}
      <section className="py-28 md:py-36 bg-[#1F1D1A]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <p className="text-[#6B6560] text-sm uppercase tracking-[0.2em] mb-4">
              {t(translations.home.fromOven)}
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-[#FFF8F0] tracking-tight">
              {t(translations.home.specialties)}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {signatureDishes.map((dish, i) => (
              <motion.div
                key={dish.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="group"
              >
                <Link href="/menu" className="block">
                  <div className="aspect-[4/5] overflow-hidden mb-5 relative bg-[#252320]">
                    <Image
                      src={dish.image}
                      alt={dish.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <h3 className="font-display text-lg text-[#FFF8F0] mb-1 group-hover:text-[#C9A84C] transition-colors">
                    {dish.name}
                  </h3>
                  <p className="text-sm text-[#6B6560] leading-relaxed">
                    {dish.description[locale]}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-14"
          >
            <Link
              href="/menu"
              className="inline-flex items-center gap-3 text-[#FFF8F0] text-sm uppercase tracking-[0.15em] font-medium hover:text-[#C9A84C] transition-colors group"
            >
              {t(translations.home.viewFullMenu)}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── STORY — One image, one paragraph ─── */}
      <section className="py-28 md:py-36 bg-[#252320]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative aspect-[4/5] bg-[#252320]">
                <Image
                  src="/images/menu/terramar-maitre.jpg"
                  alt="Terramar al Maitre — surf & turf"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <p className="text-[#6B6560] text-sm uppercase tracking-[0.2em] mb-4">
                {t(translations.home.ourStory)}
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-[#FFF8F0] tracking-tight mb-8">
                {t(translations.home.moreThanRestaurant)}
              </h2>
              <div className="space-y-5 text-[#B8B0A8] leading-relaxed">
                <p>
                  {t(translations.home.storyParagraph1)}
                </p>
                <p>
                  {t(translations.home.storyParagraph2)}
                </p>
                <p className="font-display italic text-[#FFF8F0] text-lg">
                  {t(translations.home.story3)}
                </p>
              </div>
              <Link
                href="/about"
                className="inline-flex items-center gap-3 mt-10 text-[#FFF8F0] text-sm uppercase tracking-[0.15em] font-medium hover:text-[#C9A84C] transition-colors group"
              >
                {t(translations.home.fullStory)}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── LOCATIONS — Photography grid ─── */}
      <section className="py-28 md:py-36 bg-[#1F1D1A]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-end justify-between mb-16"
          >
            <div>
              <p className="text-[#6B6560] text-sm uppercase tracking-[0.2em] mb-4">
                {locale === 'es' ? '5 destinos' : '5 destinations'}
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-[#FFF8F0] tracking-tight">
                {t(translations.home.ourLocations)}
              </h2>
            </div>
            <Link
              href="/locations"
              className="hidden md:inline-flex items-center gap-3 text-[#6B6560] text-sm uppercase tracking-[0.15em] font-medium hover:text-[#FFF8F0] transition-colors group"
            >
              {t(translations.home.viewAll)}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {locations.map((location, i) => (
              <motion.div
                key={location.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
              >
                <Link href="/locations" className="block group">
                  <div className="aspect-[3/4] overflow-hidden mb-4 relative bg-[#252320]">
                    <Image
                      src={location.image}
                      alt={`Simmer Down ${location.name}`}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1F1D1A]/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <p className="text-[#FFF8F0] font-display text-lg">{location.name}</p>
                      <p className="text-[#B8B0A8] text-xs uppercase tracking-wider">{location.vibe}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <Link
            href="/locations"
            className="md:hidden inline-flex items-center gap-3 mt-10 text-[#6B6560] text-sm uppercase tracking-[0.15em] font-medium hover:text-[#FFF8F0] transition-colors group"
          >
            {t(translations.home.viewAll)}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ─── RESERVE CTA — Understated, confident ─── */}
      <section className="py-28 md:py-36 bg-[#252320] border-t border-[#3D3936]/30">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[#6B6560] text-sm uppercase tracking-[0.2em] mb-4">
              {locale === 'es' ? '5 ubicaciones en El Salvador' : '5 locations in El Salvador'}
            </p>
            <h2 className="font-display text-3xl md:text-5xl text-[#FFF8F0] tracking-tight mb-6">
              {locale === 'es' ? 'Tu mesa te espera' : 'Your table awaits'}
            </h2>
            <p className="text-[#B8B0A8] text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              {locale === 'es'
                ? 'Reserva tu experiencia en cualquiera de nuestras ubicaciones.'
                : 'Reserve your experience at any of our locations.'}
            </p>
            <Link
              href="/reservations"
              className="inline-flex items-center gap-3 bg-[#FFF8F0] text-[#1F1D1A] px-8 py-4 text-sm uppercase tracking-[0.1em] font-semibold transition-all hover:bg-white min-h-[52px]"
            >
              {t(translations.nav.reservations)}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
