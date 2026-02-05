import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://simmer-down.vercel.app'),
  title: {
    default: 'Simmer Down | Wood-Fired Pizza & Good Vibes | San Salvador',
    template: '%s | Simmer Down Pizza'
  },
  description: 'El Salvador\'s #1 wood-fired pizza experience. Handcrafted artisan pizzas with fresh local ingredients. Order delivery or pickup in Zona Rosa & Escalón, San Salvador.',
  keywords: ['pizza', 'San Salvador', 'El Salvador', 'delivery', 'wood-fired pizza', 'artisan pizza', 'Zona Rosa', 'Escalon', 'pizza delivery'],
  authors: [{ name: 'Simmer Down Pizza' }],
  creator: 'Simmer Down Pizza',
  openGraph: {
    type: 'website',
    locale: 'es_SV',
    url: 'https://simmer-down.vercel.app',
    siteName: 'Simmer Down Pizza',
    title: 'Simmer Down | Wood-Fired Pizza & Good Vibes',
    description: 'Handcrafted artisan pizzas baked in wood-fired ovens. Fresh ingredients, bold flavors. Order now for delivery or pickup in San Salvador.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Simmer Down Pizza - Wood-fired artisan pizzas in El Salvador',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Simmer Down | Wood-Fired Pizza & Good Vibes',
    description: 'El Salvador\'s #1 wood-fired pizza. Order delivery or pickup in San Salvador.',
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
        <meta name="theme-color" content="#09090b" />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-zinc-950 text-white antialiased`}>
        {/* Skip Link for Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-orange-500 text-white px-4 py-2 rounded-lg z-[100] font-semibold"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
        <Analytics />

        {/* LocalBusiness + Restaurant Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Restaurant',
              name: 'Simmer Down Pizza',
              image: 'https://simmer-down.vercel.app/og-image.jpg',
              '@id': 'https://simmer-down.vercel.app',
              url: 'https://simmer-down.vercel.app',
              telephone: '+503-2263-7890',
              priceRange: '$$',
              servesCuisine: ['Pizza', 'Italian', 'Salvadoran'],
              acceptsReservations: 'True',
              menu: 'https://simmer-down.vercel.app/menu',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Boulevard del Hipódromo #510, Colonia San Benito',
                addressLocality: 'San Salvador',
                addressRegion: 'San Salvador',
                addressCountry: 'SV'
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 13.6929,
                longitude: -89.2365
              },
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                  opens: '11:00',
                  closes: '23:00'
                },
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Friday', 'Saturday'],
                  opens: '11:00',
                  closes: '00:00'
                },
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: 'Sunday',
                  opens: '11:00',
                  closes: '22:00'
                }
              ],
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                reviewCount: '1250'
              },
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Pizza Menu',
                itemListElement: [
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'MenuItem',
                      name: 'The Salvadoreño',
                      description: 'Local chorizo, queso fresco, jalapeños, cilantro',
                      offers: {
                        '@type': 'Offer',
                        price: '18.99',
                        priceCurrency: 'USD'
                      }
                    }
                  }
                ]
              }
            })
          }}
        />
      </body>
    </html>
  )
}
