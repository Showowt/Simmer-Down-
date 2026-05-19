import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mis Pedidos',
  description: 'Rastrea tu pedido de Simmer Down en tiempo real.',
}

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
