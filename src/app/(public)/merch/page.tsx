import type { Metadata } from 'next'
import SegmentPage, { type SegmentConfig } from '@/components/segments/SegmentPage'

export const metadata: Metadata = {
  title: 'Merch',
  description:
    'Merch oficial de Simmer Down — camisetas, gorras y accesorios con el sello Good Vibes Only.',
}

const config: SegmentConfig = {
  eyebrowEs: 'Simmer Down',
  eyebrowEn: 'Simmer Down',
  titleEs: 'Merch',
  titleEn: 'Merch',
  subtitleEs:
    'Lleva las buenas vibras contigo. Camisetas, gorras y accesorios con el sello Simmer Down.',
  subtitleEn:
    'Take the good vibes with you. Tees, caps and accessories with the Simmer Down mark.',
  comingSoon: true,
  sections: [
    {
      icon: 'shirt',
      titleEs: 'Camisetas',
      titleEn: 'Tees',
      bodyEs: 'Diseños Good Vibes Only en algodón premium.',
      bodyEn: 'Good Vibes Only designs in premium cotton.',
    },
    {
      icon: 'bag',
      titleEs: 'Gorras y Accesorios',
      titleEn: 'Caps & Accessories',
      bodyEs: 'Gorras, tote bags y más para el día a día.',
      bodyEn: 'Caps, tote bags and more for everyday.',
    },
    {
      icon: 'star',
      titleEs: 'Ediciones Limitadas',
      titleEn: 'Limited Drops',
      bodyEs: 'Colaboraciones y ediciones especiales por temporada.',
      bodyEn: 'Collabs and seasonal special editions.',
    },
  ],
  ctaLabelEs: 'Avísame cuando salga',
  ctaLabelEn: 'Notify me at launch',
  ctaHref:
    'https://wa.me/50376804434?text=' +
    encodeURIComponent('Hola! Quiero saber cuándo estará disponible el merch de Simmer Down 👕'),
  ctaExternal: true,
}

export default function MerchPage() {
  return <SegmentPage config={config} />
}
