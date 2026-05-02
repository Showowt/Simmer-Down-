import type { Metadata } from 'next'
import { Playfair_Display, Plus_Jakarta_Sans, Caveat } from 'next/font/google'
import '../globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Cocina | Simmer Down',
  description: 'Sistema de pantalla de cocina — Simmer Down',
  robots: { index: false, follow: false },
}

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <head>
        <meta name="theme-color" content="#1F1D1A" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body
        className={`${playfair.variable} ${jakarta.variable} ${caveat.variable} font-body bg-[#1F1D1A] text-[#FFF8F0] antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
