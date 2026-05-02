import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function RootNotFound() {
  return (
    <div className="min-h-screen bg-[#2D2A26] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-32 h-32 bg-[#FF6B35]/10 border border-[#FF6B35]/20 flex items-center justify-center mx-auto mb-8">
          <span className="text-7xl">🍕</span>
        </div>

        <div className="text-8xl font-black mb-4 select-none">
          <span className="inline-block text-[#6B6560]">4</span>
          <span className="inline-block text-[#FF6B35]">0</span>
          <span className="inline-block text-[#6B6560]">4</span>
        </div>

        <h2 className="text-2xl font-bold text-[#FFF8F0] mb-4">
          Página no encontrada
        </h2>
        <p className="text-[#B8B0A8] mb-8">
          La página que buscas no existe o ha sido movida.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-6 py-4 font-semibold transition-colors min-h-[56px]"
          >
            <Home className="w-5 h-5" />
            Volver al Inicio
          </Link>
          <Link
            href="/menu"
            className="flex items-center justify-center gap-2 bg-[#3D3936] hover:bg-[#4A4642] text-[#FFF8F0] px-6 py-4 font-semibold transition-colors min-h-[56px]"
          >
            <Search className="w-5 h-5" />
            Ver Menú
          </Link>
        </div>
      </div>
    </div>
  )
}
