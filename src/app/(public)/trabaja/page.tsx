import type { Metadata } from 'next'
import TrabajaClient from '@/components/careers/TrabajaClient'

export const metadata: Metadata = {
  title: 'Trabaja con Nosotros — Empleos en Simmer Down',
  description:
    'Únete al equipo Simmer Down: empleos en nuestras 5 sucursales de El Salvador — Santa Ana, San Benito, Lago de Coatepeque, Surf City y Simmer Garden. Aplica en línea.',
  keywords: [
    'empleos Simmer Down',
    'trabajo restaurante El Salvador',
    'empleo Santa Ana',
    'trabajo mesero El Salvador',
    'empleos restaurante San Salvador',
    'trabaja con nosotros El Salvador',
  ],
  alternates: {
    canonical: 'https://simmerdownsv.com/trabaja',
  },
  openGraph: {
    title: 'Trabaja con Nosotros | Simmer Down El Salvador',
    description:
      'Únete al equipo Simmer Down en cualquiera de nuestras 5 sucursales. Aplica en línea.',
    url: 'https://simmerdownsv.com/trabaja',
    images: [
      {
        url: '/og/home.jpg',
        width: 1200,
        height: 630,
        alt: 'Trabaja con Nosotros — Simmer Down El Salvador',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trabaja con Nosotros | Simmer Down',
    description: 'Únete al equipo Simmer Down. Aplica en línea.',
    images: ['/og/home.jpg'],
  },
}

export default function TrabajaPage() {
  return <TrabajaClient />
}
