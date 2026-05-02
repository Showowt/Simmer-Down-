import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reservaciones',
  description: 'Reserva tu mesa en Simmer Down. 5 ubicaciones en El Salvador.',
  openGraph: {
    title: 'Simmer Down · Reservaciones',
    description: 'Reserva tu mesa y vive la experiencia Simmer Down.',
    images: ['/og/contact.jpg'],
  },
}

export default function ReservationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
