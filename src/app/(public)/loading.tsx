import Image from 'next/image'
import { BRAND_LOGO, logoHeightClass } from '@/lib/brand'

export default function PublicLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center pt-24">
      <div className="text-center">
        {/* Animated Spinner */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-white/10" />
          <div className="absolute inset-0 border-4 border-transparent border-t-[#E85D04] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Image src={BRAND_LOGO.src} alt="Simmer Down" width={BRAND_LOGO.width} height={BRAND_LOGO.height} className={`${logoHeightClass('h-8', 'h-7')} w-auto animate-pulse`} />
          </div>
        </div>

        {/* Loading Text */}
        <p className="text-white/60 font-medium">Cargando...</p>
        <p className="text-white/40 text-sm mt-1">Loading...</p>
      </div>
    </div>
  );
}
