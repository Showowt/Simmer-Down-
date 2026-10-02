'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Beef,
  Flame,
  Award,
  Sparkles,
  Users,
  CalendarHeart,
  Building2,
  ShoppingBag,
  Shirt,
  Star,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'

// Reusable scaffold for the brand segment pages (Cortes Premium, Hospitality,
// Merch). Content is bilingual; the client can expand each section later.

const ICONS: Record<string, LucideIcon> = {
  beef: Beef,
  flame: Flame,
  award: Award,
  sparkles: Sparkles,
  users: Users,
  calendar: CalendarHeart,
  building: Building2,
  bag: ShoppingBag,
  shirt: Shirt,
  star: Star,
  truck: Truck,
}

export interface SegmentSection {
  icon: keyof typeof ICONS
  titleEs: string
  titleEn: string
  bodyEs: string
  bodyEn: string
  /**
   * Optional per-card WhatsApp link. A card that sells one specific venue
   * (e.g. the Lago de Coatepeque experiences) must reach THAT venue's line,
   * not the page-level chain number.
   */
  ctaHref?: string
  ctaLabelEs?: string
  ctaLabelEn?: string
  /**
   * Optional per-card INTERNAL link (a Next route, e.g. /estadia). Rendered as a
   * primary button above the WhatsApp line, so a card can send the guest to an
   * on-site flow while keeping its "message us" fallback. Added so the Lake card
   * reaches the Estadía booking page (it was only linked from the Coatepeque
   * location page — guests browsing Hospitality could not find it).
   */
  ctaInternalHref?: string
  ctaInternalLabelEs?: string
  ctaInternalLabelEn?: string
}

export interface SegmentConfig {
  eyebrowEs: string
  eyebrowEn: string
  titleEs: string
  titleEn: string
  subtitleEs: string
  subtitleEn: string
  comingSoon?: boolean
  sections: SegmentSection[]
  ctaLabelEs: string
  ctaLabelEn: string
  ctaHref: string
  ctaExternal?: boolean
}

export default function SegmentPage({ config }: { config: SegmentConfig }) {
  const { locale } = useI18n()
  const es = locale === 'es'

  const pick = (a: string, b: string) => (es ? a : b)

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-32 md:pt-40 pb-28 lg:pb-16">
      {/* Hero */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block text-[#E85D04] font-semibold uppercase tracking-[0.2em] text-xs mb-5"
          >
            {pick(config.eyebrowEs, config.eyebrowEn)}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-4xl md:text-6xl uppercase tracking-tight text-white mb-6"
          >
            {pick(config.titleEs, config.titleEn)}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto"
          >
            {pick(config.subtitleEs, config.subtitleEn)}
          </motion.p>

          {config.comingSoon && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 mt-6 px-4 py-2 border border-[#E85D04]/30 bg-[#E85D04]/10 text-[#F5D47A] text-sm font-medium uppercase tracking-wider"
            >
              <Flame className="w-4 h-4" />
              {pick('Muy pronto', 'Coming soon')}
            </motion.div>
          )}
        </div>
      </section>

      {/* Sections */}
      <section className="px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {config.sections.map((s, i) => {
            const Icon = ICONS[s.icon] ?? Star
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group bg-[#141414] border border-white/10 p-6 hover:border-[#E85D04]/40 transition-colors"
              >
                <div className="w-11 h-11 bg-[#E85D04]/10 border border-[#E85D04]/20 flex items-center justify-center mb-5 group-hover:bg-[#E85D04]/20 transition-colors">
                  <Icon className="w-5 h-5 text-[#E85D04]" />
                </div>
                <h3 className="text-white font-display text-lg uppercase tracking-wide mb-2">
                  {pick(s.titleEs, s.titleEn)}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {pick(s.bodyEs, s.bodyEn)}
                </p>
                {(s.ctaInternalHref || s.ctaHref) && (
                  <div className="mt-5 flex flex-col items-start gap-3">
                    {s.ctaInternalHref && (
                      <Link
                        href={s.ctaInternalHref}
                        className="inline-flex items-center gap-2 bg-[#E85D04] hover:bg-[#C2410C] text-white px-5 py-2.5 text-sm font-semibold transition-colors min-h-[44px]"
                      >
                        {pick(
                          s.ctaInternalLabelEs ?? 'Reservar',
                          s.ctaInternalLabelEn ?? 'Book',
                        )}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                    {s.ctaHref && (
                      <a
                        href={s.ctaHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[#E85D04] hover:text-[#F5D47A] text-sm font-semibold transition-colors min-h-[44px]"
                      >
                        {pick(
                          s.ctaLabelEs ?? 'Escríbenos',
                          s.ctaLabelEn ?? 'Message us',
                        )}
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-3xl mx-auto text-center bg-[#141414] border border-white/10 p-10 md:p-14">
          <h2 className="font-display text-2xl md:text-3xl uppercase text-white mb-4">
            {pick('¿Te interesa?', 'Interested?')}
          </h2>
          <p className="text-white/50 mb-8 max-w-xl mx-auto">
            {pick(
              'Escríbenos y nuestro equipo te dará todos los detalles.',
              'Reach out and our team will get you all the details.',
            )}
          </p>
          {config.ctaExternal ? (
            <a
              href={config.ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#E85D04] hover:bg-[#C2410C] text-white px-8 py-4 font-semibold transition-colors min-h-[56px]"
            >
              {pick(config.ctaLabelEs, config.ctaLabelEn)}
              <ArrowRight className="w-5 h-5" />
            </a>
          ) : (
            <Link
              href={config.ctaHref}
              className="inline-flex items-center gap-2 bg-[#E85D04] hover:bg-[#C2410C] text-white px-8 py-4 font-semibold transition-colors min-h-[56px]"
            >
              {pick(config.ctaLabelEs, config.ctaLabelEn)}
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
