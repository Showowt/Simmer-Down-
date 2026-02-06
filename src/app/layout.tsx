import type { Metadata } from 'next'
import { Playfair_Display, Plus_Jakarta_Sans, Caveat } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ToastContainer from '@/components/Toast'
import ClientProviders from '@/components/ClientProviders'
import { Analytics } from '@vercel/analytics/react'

// ANIMA Typography System
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
  metadataBase: new URL('https://simmer-down.vercel.app'),
  title: {
    default: 'Simmer Down | Restaurante y Destino Gastro-Musical | El Salvador',
    template: '%s | Simmer Down'
  },
  description: 'Restaurante y destino gastro-musical en El Salvador. 12 años, 5 ubicaciones. Pizzas artesanales, pastas, carnes y experiencias únicas en Santa Ana, Coatepeque, San Benito, Juayúa y Surf City.',
  keywords: ['Simmer Down', 'restaurante El Salvador', 'pizza artesanal', 'Santa Ana', 'Coatepeque', 'San Benito', 'Surf City', 'Juayúa', 'gastro-musical', 'wood-fired pizza'],
  authors: [{ name: 'Simmer Down' }],
  creator: 'Simmer Down',
  openGraph: {
    type: 'website',
    locale: 'es_SV',
    url: 'https://simmer-down.vercel.app',
    siteName: 'Simmer Down',
    title: 'Simmer Down | Restaurante y Destino Gastro-Musical',
    description: 'Hay lugares que se visitan. Y hay lugares que se recuerdan. Simmer Down es parte de la memoria de El Salvador.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Simmer Down - Restaurante y Destino Gastro-Musical en El Salvador',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Simmer Down | Restaurante y Destino Gastro-Musical',
    description: '12 años creando memorias. 5 ubicaciones en El Salvador.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <head>
        <meta name="theme-color" content="#2D2A26" />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className={`${playfair.variable} ${jakarta.variable} ${caveat.variable} font-body bg-[#2D2A26] text-[#FFF8F0] antialiased`}>
        {/* Skip Link for Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 bg-[#FF6B35] text-white px-6 py-3 z-[9999] font-semibold focus:outline-none focus:ring-2 focus:ring-white"
        >
          Saltar al contenido principal
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
        <ToastContainer />
        <ClientProviders />
        <Analytics />

        {/* LocalBusiness + Restaurant Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Restaurant',
              name: 'Simmer Down',
              image: 'https://simmer-down.vercel.app/og-image.jpg',
              '@id': 'https://simmer-down.vercel.app',
              url: 'https://simmer-down.vercel.app',
              telephone: '+503-2445-5999',
              priceRange: '$$',
              servesCuisine: ['Pizza', 'Italian', 'International', 'Salvadoran'],
              acceptsReservations: 'True',
              menu: 'https://simmer-down.vercel.app/menu',
              address: {
                '@type': 'PostalAddress',
                streetAddress: '1ra Calle Pte y Callejuela Sur Catedral',
                addressLocality: 'Santa Ana',
                addressRegion: 'Santa Ana',
                addressCountry: 'SV'
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 13.9946,
                longitude: -89.5597
              },
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                  opens: '11:00',
                  closes: '21:00'
                },
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Friday', 'Saturday'],
                  opens: '11:00',
                  closes: '22:00'
                }
              ],
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                reviewCount: '2500'
              }
            })
          }}
        />
      </body>
    </html>
  )
}
