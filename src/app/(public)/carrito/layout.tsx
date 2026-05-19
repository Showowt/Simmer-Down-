import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tu Pedido',
  description:
    'Revisa tu pedido y ordena por WhatsApp. Simmer Down — Pizza Artesanal El Salvador.',
}

export default function CarritoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
