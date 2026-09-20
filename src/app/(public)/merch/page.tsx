import type { Metadata } from 'next'
import SegmentPage, { type SegmentConfig } from '@/components/segments/SegmentPage'
import { getLocationWhatsAppUrl } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Merch Oficial — Camisetas y Gorras Simmer Down',
  description:
    'Merch oficial de Simmer Down El Salvador: camisetas, gorras, tote bags y ediciones limitadas con el sello Good Vibes Only. Muy pronto — escríbenos por WhatsApp y te avisamos cuando salga.',
  keywords: [
    'merch Simmer Down',
    'camisetas Simmer Down El Salvador',
    'gorras restaurante El Salvador',
    'merchandising restaurante San Salvador',
    'ropa Good Vibes Only El Salvador',
    'souvenirs El Salvador',
    'tote bag El Salvador',
  ],
  alternates: {
    canonical: 'https://simmerdownsv.com/merch',
  },
  openGraph: {
    title: 'Merch Oficial | Simmer Down El Salvador',
    description:
      'Camisetas, gorras y accesorios Good Vibes Only. Muy pronto — apúntate por WhatsApp.',
    url: 'https://simmerdownsv.com/merch',
    images: [
      {
        url: '/og/home.jpg',
        width: 1200,
        height: 630,
        alt: 'Merch oficial de Simmer Down El Salvador',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Merch Oficial | Simmer Down',
    description: 'Camisetas, gorras y accesorios Good Vibes Only. Muy pronto.',
    images: ['/og/home.jpg'],
  },
}

const config: SegmentConfig = {
  eyebrowEs: 'Simmer Down',
  eyebrowEn: 'Simmer Down',
  titleEs: 'Merch',
  titleEn: 'Merch',
  subtitleEs:
    'Lleva las buenas vibras contigo. Camisetas, gorras y accesorios con el sello Simmer Down.',
  subtitleEn:
    'Take the good vibes with you. Tees, caps and accessories with the Simmer Down mark.',
  comingSoon: true,
  sections: [
    {
      icon: 'shirt',
      titleEs: 'Camisetas',
      titleEn: 'Tees',
      bodyEs: 'Diseños Good Vibes Only en algodón premium.',
      bodyEn: 'Good Vibes Only designs in premium cotton.',
    },
    {
      icon: 'bag',
      titleEs: 'Gorras y Accesorios',
      titleEn: 'Caps & Accessories',
      bodyEs: 'Gorras, tote bags y más para el día a día.',
      bodyEn: 'Caps, tote bags and more for everyday.',
    },
    {
      icon: 'star',
      titleEs: 'Ediciones Limitadas',
      titleEn: 'Limited Drops',
      bodyEs: 'Colaboraciones y ediciones especiales por temporada.',
      bodyEn: 'Collabs and seasonal special editions.',
    },
  ],
  ctaLabelEs: 'Avísame cuando salga',
  ctaLabelEn: 'Notify me at launch',
  // Nothing to sell yet — this is the intent capture for the drop. Chain-wide
  // product, so it rides the main line.
  ctaHref: getLocationWhatsAppUrl(
    'santa-ana',
    'Hola! Quiero saber cuándo sale el merch de Simmer Down 👕 Avísenme cuando esté disponible.',
  ),
  ctaExternal: true,
}

export default function MerchPage() {
  return <SegmentPage config={config} />
}
