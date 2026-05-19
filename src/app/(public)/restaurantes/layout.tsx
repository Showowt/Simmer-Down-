import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ubicaciones',
  description:
    'Encuentra tu Simmer Down más cercano. 5 ubicaciones en El Salvador: Santa Ana, Lago de Coatepeque, San Benito, Surf City y Simmer Garden.',
}

export default function RestaurantesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
