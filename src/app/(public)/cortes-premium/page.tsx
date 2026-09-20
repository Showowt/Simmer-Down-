import type { Metadata } from 'next'
import SegmentPage, { type SegmentConfig } from '@/components/segments/SegmentPage'
import { getLocationWhatsAppUrl } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Cortes Premium — Carnes a la Parrilla en El Salvador',
  description:
    'Cortes premium de Simmer Down: coulotte con tuétano asado, medallón de lomito al maître y la selección del chef. Carnes selectas a la parrilla en Santa Ana, San Benito, Lago de Coatepeque, Surf City y Simmer Garden.',
  keywords: [
    'cortes premium El Salvador',
    'carnes a la parrilla El Salvador',
    'mejor corte de carne San Salvador',
    'coulotte El Salvador',
    'tuétano asado El Salvador',
    'medallón de lomito San Salvador',
    'restaurante de carnes Santa Ana',
    'steakhouse El Salvador',
    'Simmer Down cortes',
  ],
  alternates: {
    canonical: 'https://simmerdownsv.com/cortes-premium',
  },
  openGraph: {
    title: 'Cortes Premium | Simmer Down El Salvador',
    description:
      'Coulotte con tuétano, medallón de lomito y la selección del chef. Carnes selectas selladas al fuego en las 5 sucursales de Simmer Down.',
    url: 'https://simmerdownsv.com/cortes-premium',
    images: [
      {
        url: '/og/menu.jpg',
        width: 1200,
        height: 630,
        alt: 'Cortes Premium Simmer Down — carnes a la parrilla en El Salvador',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cortes Premium | Simmer Down',
    description: 'Coulotte con tuétano, medallón de lomito y la selección del chef.',
    images: ['/og/menu.jpg'],
  },
}

const config: SegmentConfig = {
  eyebrowEs: 'Simmer Down',
  eyebrowEn: 'Simmer Down',
  titleEs: 'Cortes Premium',
  titleEn: 'Premium Cuts',
  subtitleEs:
    'Carnes selectas, maduradas con cuidado y selladas al fuego. La misma alma de Simmer Down, ahora en el corte perfecto.',
  subtitleEn:
    'Select cuts, carefully aged and fire-seared. The same Simmer Down soul, now in the perfect cut.',
  sections: [
    {
      icon: 'beef',
      titleEs: 'Coulotte y Tuétano',
      titleEn: 'Coulotte & Marrow',
      bodyEs: 'Nuestro molcajete de coulotte con tuétano asado, jugoso y lleno de sabor.',
      bodyEn: 'Our coulotte molcajete with roasted marrow — juicy and full of flavor.',
    },
    {
      icon: 'flame',
      titleEs: 'Medallón de Lomito',
      titleEn: 'Beef Medallion',
      bodyEs: 'Medallón de lomito al maître, tierno y sellado a la parrilla.',
      bodyEn: 'Maître-style beef medallion — tender and grill-seared.',
    },
    {
      icon: 'award',
      titleEs: 'Selección del Chef',
      titleEn: "Chef's Selection",
      bodyEs: 'Cortes rotativos según disponibilidad. Pregunta por el corte del día.',
      bodyEn: 'Rotating cuts by availability. Ask for the cut of the day.',
    },
  ],
  ctaLabelEs: 'Consultar por WhatsApp',
  ctaLabelEn: 'Ask on WhatsApp',
  // Chain-wide: the cuts are on the carta at every venue, so this keeps the
  // main Santa Ana line — but the message says so, and asks which sucursal.
  ctaHref: getLocationWhatsAppUrl(
    'santa-ana',
    'Hola! Quiero información sobre los Cortes Premium de Simmer Down (disponibles en las 5 sucursales) 🔥 ¿Me confirman disponibilidad y en qué sucursal?',
  ),
  ctaExternal: true,
}

export default function CortesPremiumPage() {
  return <SegmentPage config={config} />
}
