import type { Metadata } from 'next'
import GiftCardCheckout from '@/components/gift-cards/GiftCardCheckout'

const DESCRIPTION =
  'Regalá Simmer Down: gift cards digitales de $10, $15, $25, $50 o el monto que quieras. Pago seguro con tarjeta, llega al instante y se canjea en nuestras 5 sucursales.'

export const metadata: Metadata = {
  title: 'Gift Cards',
  description: DESCRIPTION,
  alternates: { canonical: 'https://simmerdownsv.com/giftcard' },
  openGraph: {
    title: 'Gift Cards — Simmer Down',
    description: DESCRIPTION,
    url: 'https://simmerdownsv.com/giftcard',
  },
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function GiftCardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const raw = typeof params.monto === 'string' ? Number(params.monto) : NaN
  const initialAmount = Number.isFinite(raw) ? raw : null

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-36 pb-24 px-4">
      <div className="max-w-lg mx-auto mb-8 text-center">
        <p className="text-[#E85D04] text-xs font-semibold uppercase tracking-[0.2em] mb-2">Gift Cards</p>
        <h1 className="font-display text-4xl md:text-5xl text-white leading-tight">REGALÁ SIMMER DOWN</h1>
        <p className="text-white/60 text-sm mt-2">
          Llega al instante: la recibes en tu teléfono lista para enviar por WhatsApp o imprimir. Se canjea en
          nuestras 5 sucursales.
        </p>
      </div>
      <GiftCardCheckout initialAmount={initialAmount} />
    </div>
  )
}
