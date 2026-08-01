'use client'

import { createContext, useContext, useCallback, useEffect, type ReactNode } from 'react'
import { useUIStore } from '@/lib/store'
import { type Locale, translations, t as translate } from './translations'

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  t: (obj: { es: string; en: string }) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

// Single source of truth for language is useUIStore ('simmerdown-ui-v2') —
// the header toggle writes there. This context is a thin adapter so that
// useI18n consumers (Footer, EventsClient, auth pages, …) stay in sync with
// the pages that read the store directly.
export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useUIStore((s) => s.language)
  const setLanguage = useUIStore((s) => s.setLanguage)
  const toggleLanguage = useUIStore((s) => s.toggleLanguage)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((newLocale: Locale) => setLanguage(newLocale), [setLanguage])

  const t = useCallback(
    (obj: { es: string; en: string }) => translate(obj, locale),
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, toggleLocale: toggleLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

// Re-export translations for direct import
export { translations }
export type { Locale }
