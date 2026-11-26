import type { Metadata } from 'next'
import AdventCalendar from '@/components/advent/AdventCalendar'
import { isAdminRequest, loadAdventCalendar } from '@/lib/advent-server'
import { isIsoDate, svToday } from '@/lib/advent'

// Drawers open at midnight El Salvador time — never serve a cached day.
export const dynamic = 'force-dynamic'

const DESCRIPTION =
  'Este diciembre, Simmer Down tiene 12 sorpresas preparadas para ti. Abre la casilla del día, vive el reto en cualquiera de nuestros restaurantes y recibe tu premio.'

export const metadata: Metadata = {
  title: 'Calendario de Adviento',
  description: DESCRIPTION,
  alternates: { canonical: 'https://simmerdownsv.com/adviento' },
  openGraph: {
    title: 'Calendario de Adviento — Simmer Down',
    description: DESCRIPTION,
    url: 'https://simmerdownsv.com/adviento',
    images: [
      { url: '/adviento/portada.jpg', width: 1080, height: 1350, alt: 'Calendario de Adviento Simmer Down' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calendario de Adviento — Simmer Down',
    description: DESCRIPTION,
    images: ['/adviento/portada.jpg'],
  },
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdventPage({ searchParams }: PageProps) {
  const params = await searchParams
  const requested = typeof params.vista === 'string' ? params.vista : null

  // ?vista=YYYY-MM-DD previews any date — admins only. Everyone else gets
  // today in El Salvador, whatever they put in the URL.
  const preview = requested !== null && isIsoDate(requested) && (await isAdminRequest())
  const view = await loadAdventCalendar({
    today: preview && requested ? requested : svToday(),
    forceLive: preview,
  })

  return <AdventCalendar view={view} preview={preview} />
}
