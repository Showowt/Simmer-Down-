import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mi Cuenta',
  description:
    'Gestiona tu cuenta SimmerLovers, historial de pedidos y puntos de lealtad.',
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
