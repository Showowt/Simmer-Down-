import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
})

export const metadata: Metadata = {
  title: 'Simmer Down | Pizza & Good Vibes | El Salvador',
  description: 'El Salvador\'s premier pizza destination. Handcrafted artisan pizzas, craft drinks, and unforgettable vibes. Order online for delivery or dine with us.',
  keywords: 'pizza, El Salvador, San Salvador, restaurant, delivery, artisan pizza, good vibes',
  openGraph: {
    title: 'Simmer Down | Pizza & Good Vibes',
    description: 'El Salvador\'s premier pizza destination',
    type: 'website',
    locale: 'en_US',
    siteName: 'Simmer Down',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-zinc-950 text-white antialiased`}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
