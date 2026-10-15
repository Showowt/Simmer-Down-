'use client'

import Link from 'next/link'
import Image from 'next/image'
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
  Wine,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useSiteContent } from '@/lib/use-site-content'
import {
  MERCH_CATEGORIES,
  itemName,
  itemDescription,
  type SegmentItem,
  type SegmentKey,
} from '@/lib/site-content'
import { formatPrice, getLocationWhatsAppUrl } from '@/lib/data'

// Reusable scaffold for the brand segment pages (Cortes Premium, Hospitality,
// Merch). The static config is the fallback; when the owner has published
// items in the segment CMS (/admin/contenido) those render instead, with
// photos and prices.

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
  wine: Wine,
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

/** A render card: either a static config section or an owner-published item. */
interface Card {
  key: string
  title: string
  body: string | null
  icon: keyof typeof ICONS
  image?: string | null
  price?: number | null
  ctaHref?: string
  ctaLabel?: string
  ctaInternalHref?: string
  ctaInternalLabel?: string
}

const DEFAULT_ICON_BY_SEGMENT: Record<SegmentKey, keyof typeof ICONS> = {
  cortes: 'beef',
  maridaje: 'wine',
  hospitality: 'sparkles',
  merch: 'bag',
}

function SectionCard({ card, index }: { card: Card; index: number }) {
  const Icon = ICONS[card.icon] ?? Star
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="group bg-[#141414] border border-white/10 overflow-hidden hover:border-[#E85D04]/40 transition-colors flex flex-col"
    >
      {card.image ? (
        <div className="relative aspect-[4/3] overflow-hidden bg-[#1A1A1A]">
          <Image
            src={card.image}
            alt={card.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
          />
          {card.price != null && (
            <span className="absolute top-3 right-3 bg-[#E85D04] text-white text-sm font-bold px-3 py-1">
              {formatPrice(card.price)}
            </span>
          )}
        </div>
      ) : null}
      <div className="p-6 flex flex-col flex-1">
        {!card.image && (
          <div className="w-11 h-11 bg-[#E85D04]/10 border border-[#E85D04]/20 flex items-center justify-center mb-5 group-hover:bg-[#E85D04]/20 transition-colors">
            <Icon className="w-5 h-5 text-[#E85D04]" />
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-white font-display text-lg uppercase tracking-wide mb-2">
            {card.title}
          </h3>
          {!card.image && card.price != null && (
            <span className="text-[#FBBF24] font-bold whitespace-nowrap">{formatPrice(card.price)}</span>
          )}
        </div>
        {card.body && (
          <p className="text-white/50 text-sm leading-relaxed">{card.body}</p>
        )}
        {(card.ctaInternalHref || card.ctaHref) && (
          <div className="mt-auto pt-5 flex flex-col items-start gap-3">
            {card.ctaInternalHref && (
              <Link
                href={card.ctaInternalHref}
                className="inline-flex items-center gap-2 bg-[#E85D04] hover:bg-[#C2410C] text-white px-5 py-2.5 text-sm font-semibold transition-colors min-h-[44px]"
              >
                {card.ctaInternalLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            {card.ctaHref && (
              <a
                href={card.ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#E85D04] hover:text-[#F5D47A] text-sm font-semibold transition-colors min-h-[44px]"
              >
                {card.ctaLabel}
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function SegmentPage({
  config,
  segment,
}: {
  config: SegmentConfig
  /** Segment CMS key — when set, owner-published items replace the static cards. */
  segment?: SegmentKey
}) {
  const { locale } = useI18n()
  const content = useSiteContent()
  const es = locale === 'es'

  const pick = (a: string, b: string) => (es ? a : b)

  const dbItems: SegmentItem[] = segment ? content.segments[segment] : []

  // Static sections keyed by ES title: an owner item with the same name
  // inherits that card's CTAs (keeps the Estadía / venue WhatsApp links alive
  // on the seeded hospitality cards).
  const staticByName = new Map(
    config.sections.map((s) => [s.titleEs.trim().toLowerCase(), s]),
  )

  const itemToCard = (item: SegmentItem, withWhatsApp = false): Card => {
    const match = staticByName.get(item.name_es.trim().toLowerCase())
    return {
      key: item.id,
      title: itemName(item, locale),
      body: itemDescription(item, locale),
      icon: match?.icon ?? DEFAULT_ICON_BY_SEGMENT[item.segment],
      image: item.image_url,
      price: item.price,
      ctaHref: withWhatsApp
        ? getLocationWhatsAppUrl(
            'santa-ana',
            `Hola! Me interesa "${item.name_es}" de Simmer Down 🛍️ ¿Está disponible?`,
          )
        : match?.ctaHref,
      ctaLabel: withWhatsApp
        ? pick('Pedir por WhatsApp', 'Order on WhatsApp')
        : match
          ? pick(match.ctaLabelEs ?? 'Escríbenos', match.ctaLabelEn ?? 'Message us')
          : undefined,
      ctaInternalHref: match?.ctaInternalHref,
      ctaInternalLabel: match
        ? pick(match.ctaInternalLabelEs ?? 'Reservar', match.ctaInternalLabelEn ?? 'Book')
        : undefined,
    }
  }

  const staticCards: Card[] = config.sections.map((s, i) => ({
    key: `static-${i}`,
    title: pick(s.titleEs, s.titleEn),
    body: pick(s.bodyEs, s.bodyEn),
    icon: s.icon,
    ctaHref: s.ctaHref,
    ctaLabel: pick(s.ctaLabelEs ?? 'Escríbenos', s.ctaLabelEn ?? 'Message us'),
    ctaInternalHref: s.ctaInternalHref,
    ctaInternalLabel: pick(s.ctaInternalLabelEs ?? 'Reservar', s.ctaInternalLabelEn ?? 'Book'),
  }))

  // ── Per-segment composition ──────────────────────────────
  const isMerch = segment === 'merch'
  const hospitalityServices = dbItems.filter((i) => i.category !== 'galeria')
  const hospitalityGallery =
    segment === 'hospitality'
      ? dbItems.filter((i) => i.category === 'galeria' && i.image_url)
      : []

  let mainCards: Card[] = staticCards
  if (segment === 'hospitality' && hospitalityServices.length > 0) {
    mainCards = hospitalityServices.map((i) => itemToCard(i))
  } else if (!isMerch && segment && dbItems.length > 0) {
    mainCards = dbItems.map((i) => itemToCard(i))
  }

  const merchByCategory = isMerch
    ? MERCH_CATEGORIES.map((cat) => ({
        ...cat,
        items: dbItems.filter((i) => i.category === cat.id),
      }))
    : []
  const merchHasProducts = merchByCategory.some((c) => c.items.length > 0)

  const maridajeItems = segment === 'cortes' ? content.segments.maridaje : []

  const showComingSoon = Boolean(config.comingSoon) && !(isMerch && merchHasProducts)

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

          {showComingSoon && (
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
          {isMerch && merchHasProducts && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-6 inline-flex items-center gap-2 text-white/40 text-sm"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              {pick(
                'Compra en línea muy pronto — por ahora, pide por WhatsApp.',
                'Online checkout coming soon — for now, order via WhatsApp.',
              )}
            </motion.p>
          )}
        </div>
      </section>

      {/* Sections / products */}
      {!isMerch && (
        <section className="px-4 sm:px-6 lg:px-8 mt-16">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {mainCards.map((card, i) => (
              <SectionCard key={card.key} card={card} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Merch — grouped by the 3 client categories */}
      {isMerch && (
        <section className="px-4 sm:px-6 lg:px-8 mt-16 space-y-16">
          {merchHasProducts
            ? merchByCategory
                .filter((c) => c.items.length > 0)
                .map((cat) => (
                  <div key={cat.id} className="max-w-5xl mx-auto">
                    <h2 className="font-display text-2xl md:text-3xl uppercase text-white mb-6">
                      {pick(cat.es, cat.en)}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {cat.items.map((item, i) => (
                        <SectionCard key={item.id} card={itemToCard(item, true)} index={i} />
                      ))}
                    </div>
                  </div>
                ))
            : (
              <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {mainCards.map((card, i) => (
                  <SectionCard key={card.key} card={card} index={i} />
                ))}
              </div>
            )}
        </section>
      )}

      {/* El Maridaje Perfecto — wines & drinks published from the admin panel */}
      {maridajeItems.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 mt-20">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <span className="inline-flex items-center gap-2 text-[#FBBF24] font-semibold uppercase tracking-[0.2em] text-xs mb-4">
                <Wine className="w-4 h-4" />
                {pick('Vinos y bebidas', 'Wines & drinks')}
              </span>
              <h2 className="font-display text-3xl md:text-5xl uppercase tracking-tight text-white mb-4">
                {pick('El Maridaje Perfecto', 'The Perfect Pairing')}
              </h2>
              <p className="text-white/50 max-w-2xl mx-auto">
                {pick(
                  'Nuestros vinos y la variedad de bebidas que acompañan cada corte.',
                  'Our wines and the drinks selection that pairs with every cut.',
                )}
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {maridajeItems.map((item, i) => (
                <SectionCard key={item.id} card={itemToCard(item)} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hospitality gallery — event photos published from the admin panel */}
      {hospitalityGallery.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 mt-20">
          <div className="max-w-5xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-2xl md:text-3xl uppercase text-white mb-8 text-center"
            >
              {pick('Nuestros Eventos', 'Our Events')}
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {hospitalityGallery.map((item, i) => (
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
