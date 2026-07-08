'use client'

import Link from 'next/link'
import { Home, Search } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useI18n } from '@/lib/i18n'

export default function RootNotFound() {
  const { locale } = useI18n()

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#2D2A26] flex items-center justify-center px-4 pt-32">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 bg-[#E85D04]/10 border border-[#E85D04]/20 flex items-center justify-center mx-auto mb-8">
            <span className="text-7xl">🍕</span>
          </div>

          <div className="text-8xl font-black mb-4 select-none">
            <span className="inline-block text-[#6B6560]">4</span>
            <span className="inline-block text-[#E85D04]">0</span>
            <span className="inline-block text-[#6B6560]">4</span>
          </div>

          <h2 className="text-2xl font-bold text-[#FFF8F0] mb-4">
            {locale === 'es' ? '¡Ups! Esta página fue devorada' : 'Oops! This page was devoured'}
          </h2>
          <p className="text-[#B8B0A8] mb-8">
            {locale === 'es'
              ? 'La página que buscas no existe o ha sido movida.'
              : 'The page you are looking for does not exist or has been moved.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-[#E85D04] hover:bg-[#E55A2B] text-white px-6 py-4 font-semibold transition-colors min-h-[56px]"
            >
              <Home className="w-5 h-5" />
              {locale === 'es' ? 'Volver al Inicio' : 'Back to Home'}
            </Link>
            <Link
              href="/carta"
              className="flex items-center justify-center gap-2 bg-[white/10] hover:bg-[#4A4642] text-[#FFF8F0] px-6 py-4 font-semibold transition-colors min-h-[56px]"
            >
              <Search className="w-5 h-5" />
              {locale === 'es' ? 'Ver Menú' : 'View Menu'}
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
