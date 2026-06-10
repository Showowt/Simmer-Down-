'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'
import {
  Flame,
  Leaf,
  Heart,
  Users,
  Star,
  MapPin,
  ChevronRight,
  MessageCircle,
} from 'lucide-react'
import { useTranslation } from '@/lib/store'
import { LOCATIONS } from '@/lib/data'

// ─── Animation variants (matching homepage) ──────────────────────────────

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
  visible: { transition: { staggerChildren: 0.12 } },
}

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
}

// ─── Values data ─────────────────────────────────────────────────────────

const VALUES = [
  {
    icon: Flame,
    titleEs: 'Masa Artesanal',
    titleEn: 'Artisan Dough',
    descEs:
      'Cada pizza se prepara con masa artesanal, alcanzando el punto perfecto para lograr una corteza crujiente por fuera y suave por dentro.',
    descEn:
      'Every pizza is crafted with artisan dough, reaching the perfect point for a crust that is crispy outside and soft inside.',
    accent: '#E85D04',
  },
  {
    icon: Leaf,
    titleEs: 'Ingredientes Frescos',
    titleEn: 'Fresh Ingredients',
    descEs:
      'Seleccionamos ingredientes locales de la mas alta calidad. Desde la mozzarella hasta las hierbas frescas, cada sabor cuenta.',
    descEn:
      'We source the highest quality local ingredients. From mozzarella to fresh herbs, every flavor matters.',
    accent: '#22C55E',
  },
  {
    icon: Users,
    titleEs: 'Comunidad',
    titleEn: 'Community',
    descEs:
      'Somos mas que un restaurante. Somos el punto de encuentro de familias, amigos, viajeros y locales que buscan un lugar donde sentirse en casa.',
    descEn:
      'We are more than a restaurant. We are the meeting point for families, friends, travelers and locals looking for a place that feels like home.',
    accent: '#FBBF24',
  },
  {
    icon: Heart,
    titleEs: 'Pasion',
    titleEn: 'Passion',
    descEs:
      'Cada plato que sale de nuestra cocina lleva detras anos de dedicacion, creatividad y amor por la gastronomia. Esa pasion es lo que nos hace diferentes.',
    descEn:
      'Every dish that leaves our kitchen carries years of dedication, creativity and love for gastronomy. That passion is what sets us apart.',
    accent: '#EF4444',
  },
]

// ─── Milestones data ─────────────────────────────────────────────────────

const MILESTONES = [
  {
    year: '2014',
    titleEs: 'Nace Simmer Down',
    titleEn: 'Simmer Down is Born',
    descEs: 'Abrimos nuestras puertas en Santa Ana, frente a la historica catedral.',
    descEn: 'We opened our doors in Santa Ana, facing the historic cathedral.',
  },
  {
    year: '2016',
    titleEs: 'Lago de Coatepeque',
    titleEn: 'Lake Coatepeque',
    descEs: 'Segunda ubicacion con vista al lago mas hermoso de El Salvador.',
    descEn: 'Second location overlooking the most beautiful lake in El Salvador.',
  },
  {
    year: '2019',
    titleEs: 'San Benito, San Salvador',
    titleEn: 'San Benito, San Salvador',
    descEs: 'Expansion a la capital con nuestra experiencia de clase mundial.',
    descEn: 'Expansion to the capital with our world-class experience.',
  },
  {
    year: '2022',
    titleEs: 'Simmer Garden, Juayua',
    titleEn: 'Simmer Garden, Juayua',
    descEs: 'Un jardin magico en la Ruta de las Flores.',
    descEn: 'A magical garden on the Ruta de las Flores.',
  },
  {
    year: '2024',
    titleEs: 'Surf City',
    titleEn: 'Surf City',
    descEs: 'Nuestra quinta ubicacion frente al mar en La Libertad.',
    descEn: 'Our fifth location by the sea in La Libertad.',
  },
]

// ─── Stats data ──────────────────────────────────────────────────────────

const STATS = [
  { valueEs: '+14', valueEn: '14+', labelEs: 'Anos de historia', labelEn: 'Years of history' },
  { valueEs: '5', valueEn: '5', labelEs: 'Ubicaciones', labelEn: 'Locations' },
  { valueEs: '+8,000', valueEn: '8,000+', labelEs: 'Resenas', labelEn: 'Reviews' },
  { valueEs: '4.9', valueEn: '4.9', labelEs: 'Estrellas', labelEn: 'Stars' },
]

// ─── Page ────────────────────────────────────────────────────────────────

export default function NosotrosPage() {
  const { language: locale } = useTranslation()

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden pb-24 lg:pb-0">

      {/* ══════════════════════════════════════════════════
          1. HERO — Full-viewport, image background
      ══════════════════════════════════════════════════ */}
      <section
        aria-label="Hero"
        className="relative min-h-[70dvh] md:min-h-[80dvh] flex items-center justify-center overflow-hidden -mt-20"
      >
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/locations/santa-ana-interior.jpg"
            alt="Interior Simmer Down — restaurante artesanal"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/70 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        </div>

        {/* Hero content — centered */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-32 pb-20 text-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.p
              variants={fadeUp}
              className="text-[#FBBF24] text-xs font-semibold uppercase tracking-[0.3em] mb-6"
            >
              {locale === 'es' ? 'Desde 2014 en El Salvador' : 'Since 2014 in El Salvador'}
            </motion.p>

            {/* Main title */}
            <motion.h1
              variants={fadeUp}
              className="font-display text-white leading-[0.92] mb-4"
              style={{ fontSize: 'clamp(3rem, 9vw, 7rem)' }}
            >
              {locale === 'es' ? 'NUESTRA HISTORIA' : 'OUR STORY'}
            </motion.h1>

            {/* Orange accent line */}
            <motion.p
              variants={fadeUp}
              className="font-display text-[#E85D04] leading-[0.95] mb-8"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}
            >
              {locale === 'es' ? 'FUEGO, SABOR Y COMUNIDAD' : 'FIRE, FLAVOR & COMMUNITY'}
            </motion.p>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              className="text-white/60 text-base md:text-lg leading-relaxed max-w-2xl mx-auto"
            >
              {locale === 'es'
                ? 'Lo que empezo como un sueno frente a la catedral de Santa Ana se convirtio en el referente gastronomico de El Salvador. Esta es nuestra historia.'
                : 'What started as a dream in front of the Santa Ana cathedral became the gastronomic landmark of El Salvador. This is our story.'}
            </motion.p>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10"
          >
            {STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-display text-[#E85D04] text-3xl md:text-4xl leading-tight">
                  {locale === 'es' ? stat.valueEs : stat.valueEn}
                </p>
                <p className="text-white/50 text-xs uppercase tracking-wider mt-1">
                  {locale === 'es' ? stat.labelEs : stat.labelEn}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          2. STORY — Our origins
      ══════════════════════════════════════════════════ */}
      <section aria-label="Nuestra historia" className="py-20 md:py-28 px-6 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Text column */}
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-[#E85D04] text-xs font-semibold uppercase tracking-[0.2em] mb-3">
                {locale === 'es' ? 'Donde todo empezo' : 'Where it all began'}
              </p>
              <h2
                className="font-display text-white leading-tight mb-6"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
              >
                {locale === 'es' ? 'DE SANTA ANA PARA EL SALVADOR' : 'FROM SANTA ANA TO EL SALVADOR'}
              </h2>

              <div className="space-y-5 text-white/65 text-base md:text-lg leading-relaxed">
                <p>
                  {locale === 'es' ? (
                    <>
                      En <strong className="text-white">2014</strong>, abrimos nuestras puertas frente
                      a la catedral de Santa Ana con una idea simple: crear un lugar donde el tiempo
                      bajara la velocidad, la conversacion fluyera y la comida se disfrutara sin prisa.
                    </>
                  ) : (
                    <>
                      In <strong className="text-white">2014</strong>, we opened our doors facing
                      the Santa Ana cathedral with a simple idea: create a place where time slows down,
                      conversation flows and food is enjoyed without rush.
                    </>
                  )}
                </p>
                <p>
                  {locale === 'es'
                    ? 'Nuestra cocina se convirtio en el corazon de todo. Pizzas artesanales, pastas, carnes, platos para compartir: cada receta respeta el ingrediente y celebra el sabor.'
                    : 'Our kitchen became the heart of everything. Artisan pizzas, pastas, meats, sharing plates: every recipe respects the ingredient and celebrates flavor.'}
                </p>
                <p>
                  {locale === 'es'
                    ? 'Hoy somos 5 ubicaciones en El Salvador. Cada restaurante es unico, pero todos comparten la misma esencia: fuego, sabor y comunidad.'
                    : 'Today we are 5 locations across El Salvador. Each restaurant is unique, but they all share the same essence: fire, flavor and community.'}
                </p>
                <p className="italic text-white/80 border-l-2 border-[#E85D04] pl-4">
                  {locale === 'es'
                    ? 'Simmer Down no es solo lo que servimos en la mesa. Es el ambiente. Es la musica. Es la vista. Es la sensacion de estar exactamente donde debes estar.'
                    : 'Simmer Down is not just what we serve at the table. It is the atmosphere. It is the music. It is the view. It is the feeling of being exactly where you should be.'}
                </p>
              </div>
            </motion.div>

            {/* Image grid column */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
                <Image
                  src="/images/menu/pizza-maradona.jpg"
                  alt="Pizza Maradona — chorizo argentino y chimichurri"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden mt-8">
                <Image
                  src="/images/locations/gallery-santa-ana/santa-ana-awards.jpg"
                  alt="Simmer Down Santa Ana — TripAdvisor #1"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
                <Image
                  src="/images/menu/molcajete-coulotte.jpg"
                  alt="Molcajete Coulotte — corte de res con tuetano"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden mt-8">
                <Image
                  src="/images/locations/santa-ana-interior.jpg"
                  alt="Interior del restaurante Simmer Down"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          3. VALUES — 4 cards
      ══════════════════════════════════════════════════ */}
      <section aria-label="Nuestros valores" className="py-20 md:py-28 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <p className="text-[#FBBF24] text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              {locale === 'es' ? 'Lo que nos define' : 'What defines us'}
            </p>
            <h2
              className="font-display text-white leading-tight"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
            >
              {locale === 'es' ? 'NUESTROS VALORES' : 'OUR VALUES'}
            </h2>
          </motion.div>

          {/* Values grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {VALUES.map((value) => {
              const Icon = value.icon
              return (
                <motion.div
                  key={value.titleEn}
                  variants={fadeUp}
                  className="group bg-[#0A0A0A] rounded-xl border border-white/8 p-6 hover:border-white/20 transition-all duration-300"
                >
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${value.accent}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: value.accent }} />
                  </div>

                  {/* Title */}
                  <h3 className="text-white font-semibold text-base mb-2">
                    {locale === 'es' ? value.titleEs : value.titleEn}
                  </h3>

                  {/* Description */}
                  <p className="text-white/45 text-sm leading-relaxed">
                    {locale === 'es' ? value.descEs : value.descEn}
                  </p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          4. TIMELINE — Milestones
      ══════════════════════════════════════════════════ */}
      <section aria-label="Nuestra trayectoria" className="py-20 md:py-28 px-6 bg-[#0A0A0A]">
        <div className="max-w-3xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <p className="text-[#E85D04] text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              {locale === 'es' ? 'Nuestro camino' : 'Our path'}
            </p>
            <h2
              className="font-display text-white leading-tight"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
            >
              {locale === 'es' ? 'DE 1 A 5 UBICACIONES' : 'FROM 1 TO 5 LOCATIONS'}
            </h2>
          </motion.div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[23px] top-4 bottom-4 w-px bg-gradient-to-b from-[#E85D04]/60 via-white/10 to-transparent" />

            <div className="space-y-8">
              {MILESTONES.map((milestone, i) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="relative flex gap-5 items-start"
                >
                  {/* Dot */}
                  <div className="relative z-10 flex-shrink-0 w-[48px] h-[48px] rounded-full bg-[#1A1A1A] border border-[#E85D04]/50 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-[#E85D04]" />
                  </div>

                  {/* Content */}
                  <div className="pt-1">
                    <p className="text-[#E85D04] text-xs font-bold uppercase tracking-wider mb-1">
                      {milestone.year}
                    </p>
                    <h3 className="text-white font-semibold text-base mb-1">
                      {locale === 'es' ? milestone.titleEs : milestone.titleEn}
                    </h3>
                    <p className="text-white/45 text-sm leading-relaxed">
                      {locale === 'es' ? milestone.descEs : milestone.descEn}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          5. TEAM / CULTURE
      ══════════════════════════════════════════════════ */}
      <section aria-label="Nuestro equipo" className="py-20 md:py-28 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden"
            >
              <Image
                src="/images/heroes/homepage-pizzas.jpg"
                alt={locale === 'es' ? 'Equipo Simmer Down' : 'Simmer Down Team'}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              {/* Floating badge */}
              <div className="absolute bottom-5 left-5 flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                <Star className="w-4 h-4 text-[#FBBF24] fill-[#FBBF24]" />
                <span className="text-white text-sm font-medium">
                  {locale === 'es' ? 'TripAdvisor #1 en Santa Ana' : 'TripAdvisor #1 in Santa Ana'}
                </span>
              </div>
            </motion.div>

            {/* Text column */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <p className="text-[#FBBF24] text-xs font-semibold uppercase tracking-[0.2em] mb-3">
                {locale === 'es' ? 'La gente detras del fuego' : 'The people behind the fire'}
              </p>
              <h2
                className="font-display text-white leading-tight mb-6"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
              >
                {locale === 'es' ? 'NUESTRO EQUIPO' : 'OUR TEAM'}
              </h2>

              <div className="space-y-5 text-white/65 text-base md:text-lg leading-relaxed">
                <p>
                  {locale === 'es'
                    ? 'Detras de cada pizza, cada plato y cada sonrisa hay un equipo que vive y respira Simmer Down. Desde nuestros pizzaiolos que dominan el arte de la pizza artesanal, hasta los meseros que te hacen sentir en casa desde el primer momento.'
                    : 'Behind every pizza, every dish and every smile is a team that lives and breathes Simmer Down. From our pizzaiolos who master the art of artisan pizza, to the servers who make you feel at home from the very first moment.'}
                </p>
                <p>
                  {locale === 'es'
                    ? 'Creemos en crecer juntos. Muchos de nuestros gerentes empezaron como meseros. Nuestra cultura se basa en el respeto, la creatividad y la pasion por servir.'
                    : 'We believe in growing together. Many of our managers started as servers. Our culture is built on respect, creativity and a passion for service.'}
                </p>
              </div>

              {/* Mini stats */}
              <div className="flex flex-wrap gap-6 mt-8">
                {[
                  { num: '80+', labelEs: 'Colaboradores', labelEn: 'Team Members' },
                  { num: '5', labelEs: 'Restaurantes', labelEn: 'Restaurants' },
                  { num: '1', labelEs: 'Gran familia', labelEn: 'Big family' },
                ].map((stat) => (
                  <div key={stat.labelEn} className="text-center">
                    <p className="font-display text-[#E85D04] text-2xl leading-tight">
                      {stat.num}
                    </p>
                    <p className="text-white/40 text-xs uppercase tracking-wider mt-0.5">
                      {locale === 'es' ? stat.labelEs : stat.labelEn}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          6. LOCATIONS TEASER — Link to /restaurantes
      ══════════════════════════════════════════════════ */}
      <section aria-label="Ubicaciones" className="py-20 md:py-28 px-6 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-[#FBBF24] text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              {locale === 'es' ? '5 destinos unicos' : '5 unique destinations'}
            </p>
            <h2
              className="font-display text-white leading-tight mb-4"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
            >
              {locale === 'es' ? 'VISITANOS EN CUALQUIER UBICACION' : 'VISIT US AT ANY LOCATION'}
            </h2>
            <p className="text-white/50 text-base max-w-xl mx-auto">
              {locale === 'es'
                ? 'Desde las montanas de Santa Ana hasta las olas de Surf City. Elige tu Simmer Down favorito.'
                : 'From the mountains of Santa Ana to the waves of Surf City. Choose your favorite Simmer Down.'}
            </p>
          </motion.div>

          {/* Location pills */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            {LOCATIONS.map((loc) => (
              <motion.div key={loc.id} variants={fadeUp}>
                <Link
                  href={`/locations/${loc.slug}`}
                  className="inline-flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-5 py-3 rounded-full text-sm text-white/70 font-medium transition-all hover:border-[#FBBF24] hover:text-white hover:bg-[#FBBF24]/10"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#FBBF24]" />
                  {loc.shortName}
                  <span className="text-white/30">|</span>
                  <span className="text-white/40 text-xs">{loc.city}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA link */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Link
              href="/restaurantes"
              className="inline-flex items-center gap-2 text-[#FBBF24] text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors"
            >
              {locale === 'es' ? 'Ver Todas las Ubicaciones' : 'View All Locations'}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          7. CTA — WhatsApp order
      ══════════════════════════════════════════════════ */}
      <section aria-label="WhatsApp" className="py-16 px-6 bg-[#0A0A0A]">
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
              {locale === 'es' ? 'SE PARTE DE NUESTRA HISTORIA' : 'BE PART OF OUR STORY'}
            </h2>
            <p className="text-white/80 text-base md:text-lg max-w-md leading-relaxed">
              {locale === 'es'
                ? 'Haz tu pedido por WhatsApp o visitanos en cualquiera de nuestras 5 ubicaciones. Siempre estamos listos para recibirte.'
                : 'Place your order via WhatsApp or visit us at any of our 5 locations. We are always ready to welcome you.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
            <a
              href="https://wa.me/50375764655?text=Hola%2C%20quiero%20hacer%20un%20pedido%20%F0%9F%8D%95"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-sm px-8 py-4 rounded-full transition-all hover:shadow-[0_0_30px_rgba(37,211,102,0.4)] hover:scale-[1.03] active:scale-[0.97] uppercase tracking-wide"
            >
              <MessageCircle className="w-5 h-5" />
              {locale === 'es' ? 'Ordenar por WhatsApp' : 'Order via WhatsApp'}
            </a>
            <Link
              href="/carta"
              className="inline-flex items-center gap-2 border border-white/40 text-white px-7 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:bg-white/10 hover:border-white/70"
            >
              {locale === 'es' ? 'Ver Menu' : 'View Menu'}
              <ChevronRight className="w-4 h-4" />
            </Link>
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
