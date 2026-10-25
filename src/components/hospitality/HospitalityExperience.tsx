'use client'

/**
 * Hospitality — full experience page (client's "build it out complete" ask,
 * Oct 2026). Rich, cinematic sections for the three services, an events gallery
 * (owner-editable via the segment CMS), a trust strip and a working
 * events/catering inquiry form wired to /api/hospitality-inquiry → the admin
 * "Consultas" inbox + a Telegram ping.
 *
 * Service title / description / photo stay owner-editable: they're pulled from
 * the hospitality 'servicio' items in /admin/contenido and layered over the
 * static detail (what's included, zones, process) that the CMS can't express.
 */

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarHeart,
  Truck,
  Waves,
  Check,
  MessageCircle,
  Star,
  MapPin,
  Users,
  Sparkles,
  BedDouble,
  Loader2,
  PartyPopper,
  Send,
  type LucideIcon,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useSiteContent } from '@/lib/use-site-content'
import { itemName, itemDescription } from '@/lib/site-content'
import { LOCATIONS, getLocationWhatsAppUrl } from '@/lib/data'

type Locale = 'es' | 'en'

interface ServiceDef {
  key: string
  matchName: string
  icon: LucideIcon
  eyebrowEs: string
  eyebrowEn: string
  titleEs: string
  titleEn: string
  leadEs: string
  leadEn: string
  includesEs: string[]
  includesEn: string[]
  footEs?: string
  footEn?: string
  waVenue: string
  waMsgEs: string
  waLabelEs: string
  waLabelEn: string
  internalHref?: string
  internalLabelEs?: string
  internalLabelEn?: string
  fallbackImage?: string
}

const SERVICES: ServiceDef[] = [
  {
    key: 'eventos',
    matchName: 'Eventos Privados',
    icon: CalendarHeart,
    eyebrowEs: 'Para tu gente',
    eyebrowEn: 'For your people',
    titleEs: 'Eventos Privados',
    titleEn: 'Private Events',
    leadEs:
      'Cumpleaños, reuniones de empresa, aniversarios y celebraciones con zonas completas reservadas solo para tu grupo. Nosotros ponemos el fuego, el sabor y las buenas vibras.',
    leadEn:
      'Birthdays, company gatherings, anniversaries and celebrations with full zones reserved just for your group. We bring the fire, the flavor and the good vibes.',
    includesEs: [
      'Zona o salón reservado solo para tu grupo',
      'Menú personalizado: cortes, pizzas y parrilla',
      'Atención dedicada de nuestro equipo',
      'Desde grupos íntimos hasta salones completos',
    ],
    includesEn: [
      'A zone or hall reserved just for your group',
      'Custom menu: cuts, pizzas and grill',
      'Dedicated attention from our team',
      'From intimate groups to full halls',
    ],
    footEs:
      'Zonas disponibles — Santa Ana: Planta Baja, Vista Iglesia, Vista Parque y Salas VIP · Simmer Garden: Salón M, Salón J, Terraza y Barra.',
    footEn:
      'Available zones — Santa Ana: Ground Floor, Church View, Park View and VIP Rooms · Simmer Garden: Hall M, Hall J, Terrace and Bar.',
    waVenue: 'santa-ana',
    waMsgEs:
      'Hola! Quiero organizar un evento privado en Simmer Down 🥂 ¿Me ayudan con la sucursal, fecha y menú?',
    waLabelEs: 'Escríbenos por WhatsApp',
    waLabelEn: 'Message us on WhatsApp',
  },
  {
    key: 'catering',
    matchName: 'Catering',
    icon: Truck,
    eyebrowEs: 'Te llevamos la experiencia',
    eyebrowEn: 'We come to you',
    titleEs: 'Catering',
    titleEn: 'Catering',
    leadEs:
      'Llevamos la parrilla y el sabor de Simmer Down a tu lugar. Menú a tu medida, montaje y servicio de nuestro equipo — ideal para empresas, bodas y grandes celebraciones.',
    leadEn:
      'We bring the Simmer Down grill and flavor to your venue. A custom menu, setup and service from our team — perfect for companies, weddings and big celebrations.',
    includesEs: [
      'Menú a tu medida y por presupuesto',
      'Montaje y servicio de nuestro equipo',
      'Ideal para empresas, bodas y eventos grandes',
      'Cobertura en Santa Ana, San Salvador y alrededores',
    ],
    includesEn: [
      'A menu tailored to your taste and budget',
      'Setup and service from our team',
      'Perfect for companies, weddings and large events',
      'Coverage in Santa Ana, San Salvador and surroundings',
    ],
    footEs: 'Cómo funciona: cuéntanos → diseñamos el menú → cotización → tu evento.',
    footEn: 'How it works: tell us → we design the menu → quote → your event.',
    waVenue: 'santa-ana',
    waMsgEs:
      'Hola! Quiero cotizar catering de Simmer Down 🚚 Les cuento la fecha, el lugar y cuántas personas.',
    waLabelEs: 'Cotizar catering',
    waLabelEn: 'Quote catering',
  },
  {
    key: 'lago',
    matchName: 'Experiencias en el Lago',
    icon: Waves,
    eyebrowEs: 'Lago de Coatepeque',
    eyebrowEn: 'Lake Coatepeque',
    titleEs: 'Experiencias en el Lago',
    titleEn: 'Lake Experiences',
    leadEs:
      'En el Lago de Coatepeque la experiencia va más allá de la mesa: actividades acuáticas, valet parking y estadía frente al lago. Perfecto para una escapada o una celebración distinta.',
    leadEn:
      'At Lake Coatepeque the experience goes beyond the table: water activities, valet parking and lakefront lodging. Perfect for a getaway or a different kind of celebration.',
    includesEs: [
      'Actividades acuáticas: lancha, jet ski y kayak',
      'Valet parking',
      'Estadía frente al Lago de Coatepeque',
      'Perfecto para escapadas y celebraciones',
    ],
    includesEn: [
      'Water activities: boat, jet ski and kayak',
      'Valet parking',
      'Lakefront lodging at Lake Coatepeque',
      'Perfect for getaways and celebrations',
    ],
    waVenue: 'lago-coatepeque',
    waMsgEs:
      'Hola! Quiero información sobre las experiencias en Simmer Down Lago de Coatepeque: actividades acuáticas, valet parking y estadía 🌊',
    waLabelEs: 'Escribir al Lago',
    waLabelEn: 'Message the Lake',
    internalHref: '/estadia',
    internalLabelEs: 'Reservar Estadía',
    internalLabelEn: 'Book a Stay',
  },
]

const STEPS = [
  { icon: MessageCircle, titleEs: 'Cuéntanos', titleEn: 'Tell us', bodyEs: 'Tipo de evento, fecha y cuántas personas.', bodyEn: 'Event type, date and how many guests.' },
  { icon: Sparkles, titleEs: 'Diseñamos', titleEn: 'We design', bodyEs: 'Menú y espacio a tu medida.', bodyEn: 'A menu and space tailored to you.' },
  { icon: Check, titleEs: 'Confirmamos', titleEn: 'We confirm', bodyEs: 'Cotización y detalles claros.', bodyEn: 'A clear quote and details.' },
  { icon: PartyPopper, titleEs: 'Celebramos', titleEn: 'We celebrate', bodyEs: 'Tu equipo se encarga de todo.', bodyEn: 'Our team takes care of everything.' },
]

const EVENT_TYPES: { value: string; es: string; en: string }[] = [
  { value: 'cumpleanos', es: 'Cumpleaños', en: 'Birthday' },
  { value: 'empresa', es: 'Evento de empresa', en: 'Company event' },
  { value: 'aniversario', es: 'Aniversario / Celebración', en: 'Anniversary / Celebration' },
  { value: 'catering', es: 'Catering', en: 'Catering' },
  { value: 'boda', es: 'Boda', en: 'Wedding' },
  { value: 'lago', es: 'Experiencia en el Lago', en: 'Lake experience' },
  { value: 'otro', es: 'Otro', en: 'Other' },
]

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  )
}

const inputCls =
  'w-full bg-[#0F0F0F] border border-white/10 px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#E85D04] transition-colors'
const labelCls = 'block text-xs uppercase tracking-wider text-white/40 mb-1.5'

export default function HospitalityExperience() {
  const { locale } = useI18n()
  const es = locale === 'es'
  const pick = (a: string, b: string) => (es ? a : b)
  const content = useSiteContent()

  // Owner-editable service items keyed by their ES name, so the static detail
  // below can borrow each service's CMS photo / title / description.
  const cmsByName = useMemo(() => {
    const byName = new Map<string, { image?: string | null; name: string; desc: string | null }>()
    for (const it of content.segments.hospitality) {
      if (it.category === 'galeria') continue
      byName.set(it.name_es.trim().toLowerCase(), {
        image: it.image_url,
        name: itemName(it, locale),
        desc: itemDescription(it, locale),
      })
    }
    return byName
  }, [content.segments.hospitality, locale])

  const gallery = content.segments.hospitality.filter(
    (i) => i.category === 'galeria' && i.image_url,
  )

  const historia = content.historia

  // ── Inquiry form ───────────────────────────────────────────
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    eventType: 'cumpleanos',
    venue: '',
    eventDate: '',
    guests: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'ok' | 'err'>('idle')
  const [errMsg, setErrMsg] = useState('')
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) {
      setStatus('err')
      setErrMsg(pick('Escribe tu nombre y teléfono.', 'Enter your name and phone.'))
      return
    }
    setStatus('submitting')
    setErrMsg('')
    try {
      const res = await fetch('/api/hospitality-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          eventType: form.eventType,
          venue: form.venue || undefined,
          eventDate: form.eventDate || undefined,
          guests: form.guests ? Number(form.guests) : undefined,
          message: form.message || undefined,
        }),
      })
      if (res.ok) {
        setStatus('ok')
        return
      }
      if (res.status === 429) {
        setStatus('err')
        setErrMsg(pick('Demasiados intentos. Intenta en unos minutos.', 'Too many attempts. Try again in a few minutes.'))
        return
      }
      const json = await res.json().catch(() => null)
      setStatus('err')
      setErrMsg(json?.error || pick('No se pudo enviar. Intenta de nuevo.', 'Could not send. Try again.'))
    } catch {
      setStatus('err')
      setErrMsg(pick('Error de conexión. Intenta de nuevo.', 'Connection error. Try again.'))
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-32 md:pt-40 pb-28 lg:pb-16">
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block text-[#E85D04] font-semibold uppercase tracking-[0.2em] text-xs mb-5"
          >
            Simmer Down Hospitality
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-4xl md:text-6xl uppercase tracking-tight text-white mb-6"
          >
            {pick('Eventos, catering y experiencias', 'Events, catering & experiences')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto"
          >
            {pick(
              'Deja que Simmer Down reciba a tu gente. Eventos privados, catering a tu medida y experiencias frente al lago — en nuestras 5 sucursales.',
              'Let Simmer Down host your people. Private events, custom catering and lakefront experiences — across our 5 locations.',
            )}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap items-center justify-center gap-3 mt-8"
          >
            <a
              href="#cotizar"
              className="inline-flex items-center gap-2 bg-[#E85D04] hover:bg-[#C2410C] text-white px-7 py-3.5 font-semibold transition-colors min-h-[52px]"
            >
              {pick('Planear mi evento', 'Plan my event')} <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={getLocationWhatsAppUrl(
                'santa-ana',
                'Hola! Quiero información sobre eventos y catering de Simmer Down 🥂',
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/15 hover:border-[#25D366]/60 text-white px-7 py-3.5 font-semibold transition-colors min-h-[52px]"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" /> WhatsApp
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Services (rich, alternating) ───────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 mt-24 space-y-20 md:space-y-28">
        {SERVICES.map((svc, idx) => {
          const cms = cmsByName.get(svc.matchName.toLowerCase())
          const image = cms?.image || svc.fallbackImage || null
          const title = cms?.name || pick(svc.titleEs, svc.titleEn)
          const lead = cms?.desc || pick(svc.leadEs, svc.leadEn)
          const includes = es ? svc.includesEs : svc.includesEn
          const Icon = svc.icon
          const flip = idx % 2 === 1
          return (
            <div key={svc.key} className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
                {/* Media */}
                <Reveal delay={0.05}>
                  <div className={`relative aspect-[4/3] overflow-hidden bg-[#141414] border border-white/10 ${flip ? 'lg:order-2' : ''}`}>
                    {image ? (
                      <Image
                        src={image}
                        alt={title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="w-16 h-16 text-[#E85D04]/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                </Reveal>

                {/* Copy */}
                <Reveal delay={0.1}>
                  <div className={flip ? 'lg:order-1' : ''}>
                    <div className="flex items-center gap-2 text-[#E85D04] mb-3">
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                        {pick(svc.eyebrowEs, svc.eyebrowEn)}
                      </span>
                    </div>
                    <h2 className="font-display text-3xl md:text-4xl uppercase tracking-tight text-white mb-4">
                      {title}
                    </h2>
                    <p className="text-white/60 leading-relaxed mb-6">{lead}</p>
                    <ul className="space-y-2.5 mb-7">
                      {includes.map((line) => (
                        <li key={line} className="flex items-start gap-3 text-white/80 text-sm">
                          <Check className="w-4 h-4 text-[#E85D04] mt-0.5 shrink-0" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                    {(svc.footEs || svc.footEn) && (
                      <p className="text-xs text-white/40 border-l-2 border-[#E85D04]/40 pl-3 mb-7">
                        {pick(svc.footEs ?? '', svc.footEn ?? '')}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      {svc.internalHref ? (
                        <Link
                          href={svc.internalHref}
                          className="inline-flex items-center gap-2 bg-[#E85D04] hover:bg-[#C2410C] text-white px-6 py-3 text-sm font-semibold transition-colors min-h-[48px]"
                        >
                          <BedDouble className="w-4 h-4" />
                          {pick(svc.internalLabelEs ?? 'Reservar', svc.internalLabelEn ?? 'Book')}
                        </Link>
                      ) : (
                        <a
                          href="#cotizar"
                          className="inline-flex items-center gap-2 bg-[#E85D04] hover:bg-[#C2410C] text-white px-6 py-3 text-sm font-semibold transition-colors min-h-[48px]"
                        >
                          {pick('Solicitar cotización', 'Request a quote')} <ArrowRight className="w-4 h-4" />
                        </a>
                      )}
                      <a
                        href={getLocationWhatsAppUrl(svc.waVenue, svc.waMsgEs)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[#25D366] hover:text-[#4ded85] text-sm font-semibold transition-colors min-h-[48px]"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {pick(svc.waLabelEs, svc.waLabelEn)}
                      </a>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          )
        })}
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 mt-28">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <h2 className="font-display text-2xl md:text-3xl uppercase text-white text-center mb-3">
              {pick('Cómo funciona', 'How it works')}
            </h2>
            <p className="text-white/50 text-center max-w-xl mx-auto mb-12">
              {pick('De la idea a la celebración en cuatro pasos.', 'From the idea to the celebration in four steps.')}
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <Reveal key={step.titleEs} delay={i * 0.06}>
                  <div className="bg-[#141414] border border-white/10 p-6 h-full">
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-11 h-11 bg-[#E85D04]/10 border border-[#E85D04]/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#E85D04]" />
                      </div>
                      <span className="font-display text-3xl text-white/10">{i + 1}</span>
                    </div>
                    <h3 className="text-white font-semibold mb-1.5">{pick(step.titleEs, step.titleEn)}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{pick(step.bodyEs, step.bodyEn)}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Gallery (owner-published event photos) ────────── */}
      {gallery.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 mt-28">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <h2 className="font-display text-2xl md:text-3xl uppercase text-white mb-8 text-center">
                {pick('Nuestros Eventos', 'Our Events')}
              </h2>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {gallery.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="relative aspect-square overflow-hidden group"
                >
                  <Image
                    src={item.image_url as string}
                    alt={itemName(item, locale)}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-[1.05] transition-transform duration-500"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Trust strip ───────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 mt-28">
        <div className="max-w-5xl mx-auto bg-[#141414] border border-white/10 p-8 md:p-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="font-display text-3xl md:text-4xl text-white tabular-nums">
                +{historia.reviews.toLocaleString('en-US')}
              </p>
              <p className="text-white/50 text-sm mt-1">{pick('reseñas en Google', 'Google reviews')}</p>
            </div>
            <div>
              <p className="font-display text-3xl md:text-4xl text-white tabular-nums inline-flex items-center gap-1">
                {historia.stars.toFixed(1)} <Star className="w-5 h-5 text-[#FBBF24] fill-[#FBBF24]" />
              </p>
              <p className="text-white/50 text-sm mt-1">{pick('promedio', 'average')}</p>
            </div>
            <div>
              <p className="font-display text-3xl md:text-4xl text-white tabular-nums">{historia.locations}</p>
              <p className="text-white/50 text-sm mt-1">{pick('sucursales', 'locations')}</p>
            </div>
            <div>
              <p className="font-display text-3xl md:text-4xl text-white tabular-nums">+{historia.years}</p>
              <p className="text-white/50 text-sm mt-1">{pick('años de historia', 'years of history')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Inquiry form ──────────────────────────────────── */}
      <section id="cotizar" className="px-4 sm:px-6 lg:px-8 mt-28 scroll-mt-28">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <span className="inline-block text-[#E85D04] font-semibold uppercase tracking-[0.2em] text-xs mb-4">
                {pick('Cuéntanos tu evento', 'Tell us about your event')}
              </span>
              <h2 className="font-display text-3xl md:text-5xl uppercase tracking-tight text-white mb-4">
                {pick('Planeemos juntos', "Let's plan it")}
              </h2>
              <p className="text-white/50 max-w-xl mx-auto">
                {pick(
                  'Déjanos los detalles y nuestro equipo te contacta con una propuesta a tu medida.',
                  'Leave us the details and our team will reach out with a tailor-made proposal.',
                )}
              </p>
            </div>
          </Reveal>

          {status === 'ok' ? (
            <Reveal>
              <div className="bg-[#141414] border border-[#4CAF50]/30 p-10 text-center">
                <div className="w-14 h-14 bg-[#4CAF50]/10 border border-[#4CAF50]/30 flex items-center justify-center mx-auto mb-5">
                  <Check className="w-7 h-7 text-[#4CAF50]" />
                </div>
                <h3 className="font-display text-2xl uppercase text-white mb-2">
                  {pick('¡Solicitud enviada!', 'Request sent!')}
                </h3>
                <p className="text-white/60 max-w-md mx-auto">
                  {pick(
                    'Gracias. Nuestro equipo te contactará muy pronto para afinar los detalles.',
                    'Thank you. Our team will contact you very soon to finalize the details.',
                  )}
                </p>
              </div>
            </Reveal>
          ) : (
            <form onSubmit={submit} className="bg-[#141414] border border-white/10 p-6 md:p-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>{pick('Nombre', 'Name')} *</label>
                  <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={pick('Tu nombre', 'Your name')} />
                </div>
                <div>
                  <label className={labelCls}>{pick('Teléfono / WhatsApp', 'Phone / WhatsApp')} *</label>
                  <input className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="7000 0000" inputMode="tel" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>{pick('Correo (opcional)', 'Email (optional)')}</label>
                  <input className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="tu@correo.com" inputMode="email" />
                </div>
                <div>
                  <label className={labelCls}>{pick('Tipo de evento', 'Event type')}</label>
                  <select className={inputCls} value={form.eventType} onChange={(e) => set('eventType', e.target.value)}>
                    {EVENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{pick(t.es, t.en)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className={labelCls}>{pick('Sucursal', 'Location')}</label>
                  <select className={inputCls} value={form.venue} onChange={(e) => set('venue', e.target.value)}>
                    <option value="">{pick('Sin preferencia', 'No preference')}</option>
                    {LOCATIONS.map((l) => (
                      <option key={l.id} value={l.shortName}>{l.shortName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{pick('Fecha', 'Date')}</label>
                  <input type="date" className={`${inputCls} [color-scheme:dark]`} value={form.eventDate} onChange={(e) => set('eventDate', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>{pick('Invitados', 'Guests')}</label>
                  <input type="number" min={1} className={inputCls} value={form.guests} onChange={(e) => set('guests', e.target.value)} placeholder="50" />
                </div>
              </div>
              <div>
                <label className={labelCls}>{pick('Cuéntanos más (opcional)', 'Tell us more (optional)')}</label>
                <textarea className={`${inputCls} resize-none`} rows={4} value={form.message} onChange={(e) => set('message', e.target.value)} placeholder={pick('Ideas, menú, presupuesto...', 'Ideas, menu, budget...')} />
              </div>

              {status === 'err' && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-4 py-2.5">{errMsg}</p>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#E85D04] hover:bg-[#C2410C] text-white px-8 py-3.5 font-semibold transition-colors min-h-[52px] disabled:opacity-60"
                >
                  {status === 'submitting' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                  {pick('Enviar solicitud', 'Send request')}
                </button>
                <p className="text-xs text-white/35 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> {pick('Te respondemos dentro de 24 horas.', 'We reply within 24 hours.')}
                </p>
              </div>
            </form>
          )}

          {/* Venue chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <span className="text-white/35 text-xs inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {pick('Disponible en', 'Available at')}
            </span>
            {LOCATIONS.map((l) => (
              <span key={l.id} className="text-xs text-white/60 border border-white/10 px-2.5 py-1">
                {l.shortName}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
