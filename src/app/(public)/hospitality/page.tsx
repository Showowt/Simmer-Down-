import type { Metadata } from 'next'
import HospitalityExperience from '@/components/hospitality/HospitalityExperience'

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

export default function HospitalityPage() {
  return <HospitalityExperience />
}
