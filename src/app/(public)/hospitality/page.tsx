import type { Metadata } from 'next'
import SegmentPage, { type SegmentConfig } from '@/components/segments/SegmentPage'
import { getLocationWhatsAppUrl } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Hospitality — Eventos Privados y Catering en El Salvador',
  description:
    'Simmer Down Hospitality: eventos privados, catering y experiencias a la medida en Santa Ana, San Benito, Surf City, Simmer Garden y el Lago de Coatepeque — con actividades acuáticas, valet parking y estadía frente al lago.',
  keywords: [
    'eventos privados El Salvador',
    'catering El Salvador',
    'salón para eventos San Salvador',
    'eventos corporativos El Salvador',
    'cumpleaños restaurante Santa Ana',
    'eventos Lago de Coatepeque',
    'restaurante para eventos El Salvador',
    'catering Santa Ana El Salvador',
    'Simmer Down eventos',
  ],
  alternates: {
    canonical: 'https://simmerdownsv.com/hospitality',
  },
  openGraph: {
    title: 'Hospitality — Eventos Privados y Catering | Simmer Down',
    description:
      'Eventos privados, catering y experiencias a la medida en las 5 sucursales de Simmer Down, incluyendo el Lago de Coatepeque.',
    url: 'https://simmerdownsv.com/hospitality',
    images: [
      {
        url: '/og/events.jpg',
        width: 1200,
        height: 630,
        alt: 'Simmer Down Hospitality — eventos privados y catering en El Salvador',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hospitality | Simmer Down El Salvador',
    description: 'Eventos privados, catering y experiencias a la medida en El Salvador.',
    images: ['/og/events.jpg'],
  },
}

const config: SegmentConfig = {
  eyebrowEs: 'Simmer Down',
  eyebrowEn: 'Simmer Down',
  titleEs: 'Hospitality',
  titleEn: 'Hospitality',
  subtitleEs:
    'Eventos privados, catering y experiencias a la medida. Deja que Simmer Down reciba a tu gente.',
  subtitleEn:
    'Private events, catering and tailor-made experiences. Let Simmer Down host your people.',
  sections: [
    {
      icon: 'calendar',
      titleEs: 'Eventos Privados',
      titleEn: 'Private Events',
      bodyEs: 'Cumpleaños, empresas y celebraciones con reserva de zonas completas.',
      bodyEn: 'Birthdays, corporate and celebrations with full-zone bookings.',
    },
    {
      icon: 'truck',
      titleEs: 'Catering',
      titleEn: 'Catering',
      bodyEs: 'Llevamos la experiencia Simmer Down a tu lugar, con menú a tu medida.',
      bodyEn: 'We bring the Simmer Down experience to your venue, with a custom menu.',
    },
    {
      icon: 'sparkles',
      titleEs: 'Experiencias en el Lago',
      titleEn: 'Lake Experiences',
      bodyEs: 'En el Lago de Coatepeque: actividades acuáticas, valet parking y estadía.',
      bodyEn: 'At Lago de Coatepeque: water activities, valet parking and lodging.',
      // Venue-specific card — must reach the Coatepeque line, not Santa Ana.
      ctaHref: getLocationWhatsAppUrl(
        'lago-coatepeque',
        'Hola! Quiero información sobre las experiencias en Simmer Down Lago Coatepeque: actividades acuáticas, valet parking y estadía 🌊',
      ),
      ctaLabelEs: 'Escribir al Lago',
      ctaLabelEn: 'Message the Lake',
    },
  ],
  ctaLabelEs: 'Planear mi evento',
  ctaLabelEn: 'Plan my event',
  // Chain-wide: events and catering run at every venue, so this keeps the main
  // line — the message says so and asks which sucursal the client wants.
  ctaHref: getLocationWhatsAppUrl(
    'santa-ana',
    'Hola! Quiero información sobre eventos y catering de Simmer Down (disponible en las 5 sucursales) 🥂 ¿Me ayudan a elegir la sucursal y la fecha?',
  ),
  ctaExternal: true,
}

export default function HospitalityPage() {
  return <SegmentPage config={config} />
}
