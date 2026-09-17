import type { Metadata } from 'next'
import EstadiaClient from '@/components/rooms/EstadiaClient'

export const metadata: Metadata = {
  title: 'Estadía — Lago de Coatepeque',
  description:
    'Reserva tu habitación frente al Lago de Coatepeque. Estadía en Simmer Down — vista al lago, actividades acuáticas y más. Confirmamos por WhatsApp.',
}

export default function EstadiaPage() {
  return <EstadiaClient />
}
