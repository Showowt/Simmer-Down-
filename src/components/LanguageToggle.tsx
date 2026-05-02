'use client'

import { useI18n } from '@/lib/i18n'
import { Globe } from 'lucide-react'

export default function LanguageToggle() {
  const { locale, toggleLocale } = useI18n()

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#B8B0A8] hover:text-[#FFF8F0] transition-colors min-w-[44px] min-h-[44px]"
      aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a Espanol'}
      title={locale === 'es' ? 'Switch to English' : 'Cambiar a Espanol'}
    >
      <Globe className="w-4 h-4" />
      <span className="uppercase font-bold text-xs tracking-wider">
        {locale === 'es' ? 'EN' : 'ES'}
      </span>
    </button>
  )
}
