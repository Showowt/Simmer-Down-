import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nosotros',
  description:
    'Conoce la historia de Simmer Down. 14 años de pizza artesanal de horno de leña en El Salvador. 5 ubicaciones, +8,000 reseñas.',
}

export default function NosotrosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
