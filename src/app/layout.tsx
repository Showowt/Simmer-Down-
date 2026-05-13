import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import ToastContainer from '@/components/Toast'
import ClientProviders from '@/components/ClientProviders'
import AppProviders from '@/components/AppProviders'
import { Analytics } from '@vercel/analytics/react'
import { FilmGrain } from '@/components/cinema/FilmGrain'
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateAllLocationSchemas,
  generateFAQSchema,
  RESTAURANT_FAQS,
} from '@/lib/seo/structured-data'

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

// Caveat removed — using Playfair Display italic for accent text

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#2D2A26',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://simmerdownsv.com'),
  title: {
    default: 'Simmer Down | Pizzería & Restaurante | El Salvador',
    template: '%s | Simmer Down — Pizza Artesanal El Salvador'
  },
  description: 'La mejor pizza artesanal de horno de leña en El Salvador. 14 años, 5 ubicaciones, +8,000 reseñas. Pizzas, pastas, cortes y mariscos en Santa Ana, Coatepeque, San Benito, Juayúa y Surf City. Reserva ahora.',
  keywords: [
    // Primary — pizza dominance
    'mejor pizza El Salvador',
    'pizza artesanal El Salvador',
    'pizza horno de leña El Salvador',
    'pizzería El Salvador',
    'mejor restaurante pizza El Salvador',
    // Brand
    'Simmer Down',
    'Simmer Down El Salvador',
    'Simmer Down Santa Ana',
    'Simmer Down San Salvador',
    'Simmer Down menu',
    // Location-specific pizza queries
    'pizza Santa Ana El Salvador',
    'pizza San Salvador',
    'pizza Lago de Coatepeque',
    'pizza Surf City El Salvador',
    'pizza Juayúa Ruta de las Flores',
    'pizza San Benito Zona Rosa',
    // Food types
    'pizza artesanal',
    'pizza de horno de leña',
    'pizza gourmet El Salvador',
    'pasta artesanal El Salvador',
    'restaurante italiano El Salvador',
    'mariscos El Salvador',
    // Experience queries
    'restaurante romántico El Salvador',
    'restaurante con vista El Salvador',
    'restaurante frente al mar El Salvador',
    'restaurante gastro-musical',
    'mejor restaurante El Salvador',
    'restaurantes en Santa Ana',
    'restaurantes Zona Rosa San Salvador',
    'dónde comer en El Salvador',
    // Delivery & ordering
    'pizza delivery El Salvador',
    'pizza a domicilio El Salvador',
    'reservaciones restaurante El Salvador',
    'restaurante para eventos El Salvador',
  ],
  authors: [{ name: 'Simmer Down' }],
  creator: 'Simmer Down',
  publisher: 'Simmer Down SV',
  category: 'restaurant',
  alternates: {
    canonical: 'https://simmerdownsv.com',
    languages: {
      'es-SV': 'https://simmerdownsv.com',
      'en-US': 'https://simmerdownsv.com',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_SV',
    alternateLocale: 'en_US',
    url: 'https://simmerdownsv.com',
    siteName: 'Simmer Down — La Mejor Pizza de El Salvador',
    title: 'Simmer Down | La Mejor Pizza Artesanal de Horno de Leña en El Salvador',
    description: 'La pizza #1 de El Salvador. 14 años, 5 ubicaciones, +8,000 reseñas ⭐ 4.9. Horno de leña, ingredientes premium. Santa Ana, Coatepeque, San Benito, Juayúa, Surf City.',
    images: [
      {
        url: 'https://simmerdownsv.com/og/home.jpg',
        width: 1200,
        height: 630,
        alt: 'Simmer Down - La Mejor Pizza Artesanal de Horno de Leña en El Salvador — 5 Ubicaciones',
        type: 'image/jpeg',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@simmerdownsv',
    creator: '@simmerdownsv',
    title: 'Simmer Down | La Mejor Pizza de El Salvador',
    description: 'Pizza artesanal de horno de leña. 14 años, 5 ubicaciones, +8,000 reseñas. Santa Ana, Coatepeque, San Salvador, Juayúa, Surf City.',
    images: {
      url: 'https://simmerdownsv.com/og/home.jpg',
      alt: 'Simmer Down — Pizza Artesanal de Horno de Leña',
    },
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
  verification: {
    google: 'pending-verification-code',
  },
  other: {
    'geo.region': 'SV',
    'geo.placename': 'Santa Ana, El Salvador',
    'geo.position': '13.9946;-89.5597',
    'ICBM': '13.9946, -89.5597',
    'rating': 'general',
    'revisit-after': '3 days',
    'distribution': 'global',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // lang="es" is the default. The I18nProvider updates document.documentElement.lang
  // on the client when the user toggles locale, but SSR always renders "es".
  return (
    <html lang="es" className="dark">
      <head>
        {/* Preconnect to critical third-party origins for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://qusvynxzslpmjoqfabyq.supabase.co" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className={`${playfair.variable} ${jakarta.variable} font-body bg-[#2D2A26] text-[#FFF8F0] antialiased`}>
        <AppProviders>
          {/* Skip Link for Accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 bg-[#FF6B35] text-white px-6 py-3 z-[9999] font-semibold focus:outline-none focus:ring-2 focus:ring-white"
          >
            Saltar al contenido principal
          </a>
          {children}
          <FilmGrain />
          <ToastContainer />
          <ClientProviders />
          <Analytics />

        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateOrganizationSchema()) }}
        />
        {/* WebSite Schema with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateWebSiteSchema()) }}
        />
        {/* All 5 Restaurant Location Schemas */}
        {generateAllLocationSchemas().map((schema, i) => (
          <script
            key={`location-schema-${i}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        {/* FAQ Schema — targets "mejor pizza El Salvador" featured snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQSchema(RESTAURANT_FAQS)) }}
        />
        </AppProviders>
      </body>
    </html>
  )
}
