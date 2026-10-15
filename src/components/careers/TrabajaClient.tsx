'use client'

/**
 * Trabaja con Nosotros — careers page body.
 *
 * Team photos + intro + application link are owner-editable in
 * /admin/contenido (settings key 'careers'). While no Google Forms link is
 * configured the apply button falls back to the main WhatsApp line so the
 * page is never a dead end.
 */

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Flame, Heart, MessageCircle, Users } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useSiteContent } from '@/lib/use-site-content'
import { getLocationWhatsAppUrl } from '@/lib/data'

const PERKS = [
  {
    icon: Flame,
    titleEs: 'Crece con nosotros',
    titleEn: 'Grow with us',
    bodyEs: 'Muchos de nuestros gerentes empezaron como meseros.',
    bodyEn: 'Many of our managers started as servers.',
  },
  {
    icon: Users,
    titleEs: '5 sucursales',
    titleEn: '5 locations',
    bodyEs: 'Santa Ana, San Benito, Lago de Coatepeque, Surf City y Simmer Garden.',
    bodyEn: 'Santa Ana, San Benito, Lago de Coatepeque, Surf City and Simmer Garden.',
  },
  {
    icon: Heart,
    titleEs: 'Buenas vibras',
    titleEn: 'Good vibes',
    bodyEs: 'Una cultura de respeto, creatividad y pasión por servir.',
    bodyEn: 'A culture of respect, creativity and a passion for service.',
  },
]

const FALLBACK_WHATSAPP = getLocationWhatsAppUrl(
  'santa-ana',
  'Hola! Quiero aplicar para trabajar en Simmer Down 💼 ¿Me comparten el proceso?',
)

export default function TrabajaClient() {
  const { locale } = useI18n()
  const { careers } = useSiteContent()
  const es = locale === 'es'
  const pick = (a: string, b: string) => (es ? a : b)

  const intro =
    (es ? careers.intro_es : careers.intro_en || careers.intro_es) ||
    pick(
      'En Simmer Down creemos en crecer juntos. Si compartes nuestra pasión por el fuego, el sabor y las buenas vibras, queremos conocerte.',
      'At Simmer Down we believe in growing together. If you share our passion for fire, flavor and good vibes, we want to meet you.',
    )

  const applyHref = careers.form_url || FALLBACK_WHATSAPP
  const applyIsForm = Boolean(careers.form_url)

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
            Simmer Down
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-4xl md:text-6xl uppercase tracking-tight text-white mb-6"
          >
            {pick('Trabaja con Nosotros', 'Work With Us')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto"
          >
            {intro}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-10"
          >
            <a
              href={applyHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-8 py-4 font-semibold transition-colors min-h-[56px] ${
                applyIsForm
                  ? 'bg-[#E85D04] hover:bg-[#C2410C] text-white'
                  : 'bg-[#25D366] hover:bg-[#128C7E] text-white'
              }`}
            >
              {applyIsForm ? null : <MessageCircle className="w-5 h-5" />}
              {applyIsForm
                ? pick('Aplicar Ahora', 'Apply Now')
                : pick('Aplicar por WhatsApp', 'Apply via WhatsApp')}
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Team photos — owner-uploaded */}
      {careers.photos.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 mt-16">
          <div className="max-w-5xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-2xl md:text-3xl uppercase text-white mb-8 text-center"
            >
              {pick('Nuestro Equipo', 'Our Team')}
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {careers.photos.map((photo, i) => (
                <motion.div
                  key={`${photo}-${i}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className={`relative overflow-hidden group ${i % 3 === 1 ? 'aspect-[3/4]' : 'aspect-square'}`}
                >
                  <Image
                    src={photo}
                    alt={pick('Equipo Simmer Down', 'Simmer Down team')}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover group-hover:scale-[1.05] transition-transform duration-500"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Perks */}
      <section className="px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {PERKS.map((perk, i) => {
            const Icon = perk.icon
            return (
              <motion.div
                key={perk.titleEn}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#141414] border border-white/10 p-6"
              >
                <div className="w-11 h-11 bg-[#E85D04]/10 border border-[#E85D04]/20 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-[#E85D04]" />
                </div>
                <h3 className="text-white font-display text-lg uppercase tracking-wide mb-2">
                  {pick(perk.titleEs, perk.titleEn)}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {pick(perk.bodyEs, perk.bodyEn)}
                </p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-3xl mx-auto text-center bg-[#141414] border border-white/10 p-10 md:p-14">
          <h2 className="font-display text-2xl md:text-3xl uppercase text-white mb-4">
            {pick('¿Listo para unirte?', 'Ready to join?')}
          </h2>
          <p className="text-white/50 mb-8 max-w-xl mx-auto">
            {pick(
              'Completa tu aplicación y nuestro equipo se pondrá en contacto contigo.',
              'Complete your application and our team will get in touch.',
            )}
          </p>
          <a
            href={applyHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#E85D04] hover:bg-[#C2410C] text-white px-8 py-4 font-semibold transition-colors min-h-[56px]"
          >
            {applyIsForm
              ? pick('Aplicar Ahora', 'Apply Now')
              : pick('Aplicar por WhatsApp', 'Apply via WhatsApp')}
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>
    </div>
  )
}
