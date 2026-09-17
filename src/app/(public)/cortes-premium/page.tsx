import type { Metadata } from 'next'
import SegmentPage, { type SegmentConfig } from '@/components/segments/SegmentPage'

export const metadata: Metadata = {
  title: 'Cortes Premium',
  description:
    'Cortes premium de Simmer Down — carnes selectas maduradas y preparadas a la parrilla. Coulotte, tuétano, medallón de lomito y más.',
}

const config: SegmentConfig = {
  eyebrowEs: 'Simmer Down',
  eyebrowEn: 'Simmer Down',
  titleEs: 'Cortes Premium',
  titleEn: 'Premium Cuts',
  subtitleEs:
    'Carnes selectas, maduradas con cuidado y selladas al fuego. La misma alma de Simmer Down, ahora en el corte perfecto.',
  subtitleEn:
    'Select cuts, carefully aged and fire-seared. The same Simmer Down soul, now in the perfect cut.',
  sections: [
    {
      icon: 'beef',
      titleEs: 'Coulotte y Tuétano',
      titleEn: 'Coulotte & Marrow',
      bodyEs: 'Nuestro molcajete de coulotte con tuétano asado, jugoso y lleno de sabor.',
      bodyEn: 'Our coulotte molcajete with roasted marrow — juicy and full of flavor.',
    },
    {
      icon: 'flame',
      titleEs: 'Medallón de Lomito',
      titleEn: 'Beef Medallion',
      bodyEs: 'Medallón de lomito al maître, tierno y sellado a la parrilla.',
      bodyEn: 'Maître-style beef medallion — tender and grill-seared.',
    },
    {
      icon: 'award',
      titleEs: 'Selección del Chef',
      titleEn: "Chef's Selection",
      bodyEs: 'Cortes rotativos según disponibilidad. Pregunta por el corte del día.',
      bodyEn: 'Rotating cuts by availability. Ask for the cut of the day.',
    },
  ],
  ctaLabelEs: 'Consultar por WhatsApp',
  ctaLabelEn: 'Ask on WhatsApp',
  ctaHref:
    'https://wa.me/50376804434?text=' +
    encodeURIComponent('Hola! Quiero información sobre los Cortes Premium 🔥'),
  ctaExternal: true,
}

export default function CortesPremiumPage() {
  return <SegmentPage config={config} />
}
