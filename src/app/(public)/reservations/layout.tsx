import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reservaciones — Reserva tu Mesa',
  description:
    'Reserva tu mesa en Simmer Down, la mejor pizzería de El Salvador. 5 ubicaciones disponibles: Santa Ana, Lago de Coatepeque, San Benito (San Salvador), Juayúa y Surf City. Reserva en línea o llama al +503 2455-4899.',
  keywords: [
    'reservaciones restaurante El Salvador',
    'reservar mesa pizza El Salvador',
    'Simmer Down reservaciones',
    'restaurante para cena El Salvador',
    'reserva restaurante Santa Ana',
    'reserva restaurante San Salvador',
    'mesa restaurante El Salvador',
  ],
  alternates: {
    canonical: 'https://simmerdownsv.com/reservations',
  },
  openGraph: {
    title: 'Reserva tu Mesa | Simmer Down El Salvador',
    description: 'Reserva en línea en la mejor pizzería de El Salvador. 5 ubicaciones, ⭐4.9 promedio.',
    images: [
      {
        url: '/og/contact.jpg',
        width: 1200,
        height: 630,
        alt: 'Reservaciones Simmer Down — La Mejor Pizza de El Salvador',
      },
    ],
    url: 'https://simmerdownsv.com/reservations',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reserva tu Mesa | Simmer Down',
    description: 'Reserva en la mejor pizzería de El Salvador. 5 ubicaciones disponibles.',
    images: ['/og/contact.jpg'],
  },
}

export default function ReservationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
