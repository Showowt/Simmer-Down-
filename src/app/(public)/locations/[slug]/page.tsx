import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LOCATIONS, getLocationBySlug } from '@/lib/data'
import LocationDetailClient from '@/components/locations/LocationDetailClient'

// ─── Static Params ────────────────────────────────────────

export function generateStaticParams() {
  return LOCATIONS.map((location) => ({
    slug: location.slug,
  }))
}

// ─── Dynamic Metadata ─────────────────────────────────────

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const location = getLocationBySlug(slug)

  if (!location) {
    return {
      title: 'Ubicacion no encontrada | Simmer Down',
    }
  }

  return {
    title: `${location.name} — Horarios, Direcciones y Menu | Simmer Down`,
    description: `Visita ${location.name} en ${location.address}, ${location.city}. Horarios, telefono (${location.phone}), como llegar y nuestro menu de pizza artesanal.`,
    keywords: [
      `Simmer Down ${location.shortName}`,
      `pizza ${location.city}`,
      `restaurante ${location.city}`,
      `${location.name} horarios`,
      `${location.name} menu`,
      `donde comer ${location.city}`,
      'pizza artesanal El Salvador',
    ],
    alternates: {
      canonical: `https://simmerdownsv.com/locations/${location.slug}`,
    },
    openGraph: {
      title: `${location.name} | Simmer Down`,
      description: `${location.address}, ${location.city} — Pizza artesanal. Horarios, direcciones y menu.`,
      images: [
        {
          url: location.heroImage || location.image,
          width: 1200,
          height: 630,
          alt: location.name,
        },
      ],
      url: `https://simmerdownsv.com/locations/${location.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${location.name} | Simmer Down`,
      description: `${location.address}, ${location.city} — Pizza artesanal.`,
      images: [location.heroImage || location.image],
    },
  }
}

// ─── Page Component ───────────────────────────────────────

export default async function LocationPage({ params }: Props) {
  const { slug } = await params
  const location = getLocationBySlug(slug)

  if (!location) {
    notFound()
  }

  return <LocationDetailClient location={location} />
}
