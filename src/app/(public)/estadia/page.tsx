import type { Metadata } from 'next'
import EstadiaClient from '@/components/rooms/EstadiaClient'

// Without its own canonical this page inherits the root layout's, which points
// at the homepage — Google would drop /estadia entirely.
export const metadata: Metadata = {
  title: 'Estadía — Habitaciones Frente al Lago de Coatepeque',
  description:
    'Reserva tu habitación frente al Lago de Coatepeque. Estadía en Simmer Down — vista al lago, actividades acuáticas y más. Confirmamos por WhatsApp.',
  keywords: [
    'hotel Lago de Coatepeque',
    'hospedaje Lago de Coatepeque',
    'habitaciones frente al lago El Salvador',
    'dónde dormir Lago de Coatepeque',
    'estadía Coatepeque',
    'Simmer Down Coatepeque',
    'turismo Lago de Coatepeque El Salvador',
  ],
  alternates: {
    canonical: 'https://simmerdownsv.com/estadia',
  },
  openGraph: {
    title: 'Estadía Frente al Lago de Coatepeque | Simmer Down',
    description:
      'Habitaciones frente al Lago de Coatepeque, con vista al lago y actividades acuáticas. Solicita tu estadía y te confirmamos por WhatsApp.',
    url: 'https://simmerdownsv.com/estadia',
    images: [
      {
        url: '/og/locations.jpg',
        width: 1200,
        height: 630,
        alt: 'Simmer Down Lago de Coatepeque — estadía frente al lago',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Estadía en el Lago de Coatepeque | Simmer Down',
    description: 'Habitaciones frente al Lago de Coatepeque. Confirmamos por WhatsApp.',
    images: ['/og/locations.jpg'],
  },
}

export default function EstadiaPage() {
  return <EstadiaClient />
}
