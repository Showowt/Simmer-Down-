import type { Metadata } from 'next'
import SegmentPage, { type SegmentConfig } from '@/components/segments/SegmentPage'

export const metadata: Metadata = {
  title: 'Hospitality',
  description:
    'Simmer Down Hospitality — eventos privados, catering y experiencias a la medida en nuestras sucursales de El Salvador, incluyendo el Lago de Coatepeque.',
}

const config: SegmentConfig = {
  eyebrowEs: 'Simmer Down',
  eyebrowEn: 'Simmer Down',
  titleEs: 'Hospitality',
  titleEn: 'Hospitality',
  subtitleEs:
    'Eventos privados, catering y experiencias a la medida. Deja que Simmer Down reciba a tu gente.',
  subtitleEn:
    'Private events, catering and tailor-made experiences. Let Simmer Down host your people.',
  sections: [
    {
      icon: 'calendar',
      titleEs: 'Eventos Privados',
      titleEn: 'Private Events',
      bodyEs: 'Cumpleaños, empresas y celebraciones con reserva de zonas completas.',
      bodyEn: 'Birthdays, corporate and celebrations with full-zone bookings.',
    },
    {
      icon: 'truck',
      titleEs: 'Catering',
      titleEn: 'Catering',
      bodyEs: 'Llevamos la experiencia Simmer Down a tu lugar, con menú a tu medida.',
      bodyEn: 'We bring the Simmer Down experience to your venue, with a custom menu.',
    },
    {
      icon: 'sparkles',
      titleEs: 'Experiencias en el Lago',
      titleEn: 'Lake Experiences',
      bodyEs: 'En el Lago de Coatepeque: actividades acuáticas, valet parking y estadía.',
      bodyEn: 'At Lago de Coatepeque: water activities, valet parking and lodging.',
    },
  ],
  ctaLabelEs: 'Planear mi evento',
  ctaLabelEn: 'Plan my event',
  ctaHref:
    'https://wa.me/50376804434?text=' +
    encodeURIComponent('Hola! Quiero información sobre eventos y hospitality 🥂'),
  ctaExternal: true,
}

export default function HospitalityPage() {
  return <SegmentPage config={config} />
}
