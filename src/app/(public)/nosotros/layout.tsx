import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nosotros',
  description:
    'Conoce la historia de Simmer Down. 12 años de pizza artesanal en El Salvador. 5 ubicaciones, +5,500 reseñas en Google.',
}

export default function NosotrosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
