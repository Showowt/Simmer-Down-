'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Instagram, Facebook } from 'lucide-react'
import { useI18n, translations } from '@/lib/i18n'

export default function Footer() {
  const { t, locale } = useI18n()

  const navigationLinks = [
    { label: t(translations.footer.menuSection), href: '/carta' },
    { label: t(translations.footer.reservations), href: '/reservations' },
    { label: t(translations.footer.locationsSection), href: '/restaurantes' },
    { label: t(translations.footer.ourStory), href: '/nosotros' },
    { label: t(translations.footer.events), href: '/events' },
    { label: t(translations.footer.simmerLovers), href: '/simmerlovers' },
    { label: t(translations.footer.contact), href: '/contact' },
  ]

  return (
    <footer className="bg-[#111]">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">

          {/* Column 1: Brand */}
          <div>
            <Link
              href="/"
              className="flex items-center gap-2.5 font-display text-2xl text-white tracking-[0.02em]"
            >
              <Image src="/logos/logo-simmer-light.svg" alt="Simmer Down — Pizzeria y Restaurante" width={120} height={40} className="h-10 w-auto" />
            </Link>
            <p className="mt-5 text-sm text-white/40 leading-relaxed max-w-xs">
              {t(translations.footer.description)}
            </p>
            <div className="flex gap-5 mt-8">
              <a
                href="https://instagram.com/simmerdownsv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-[#FBBF24] transition-colors duration-300"
                aria-label={t(translations.footer.followInstagram)}
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com/simmerdownsv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-[#FBBF24] transition-colors duration-300"
                aria-label={t(translations.footer.followFacebook)}
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="text-xs font-medium text-white uppercase tracking-[0.15em] mb-6">
              {locale === 'es' ? 'Navegaci\u00f3n' : 'Navigation'}
            </h4>
            <ul className="space-y-3">
              {navigationLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-[#FBBF24] transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h4 className="text-xs font-medium text-white uppercase tracking-[0.15em] mb-6">
              {t(translations.footer.contactSection)}
            </h4>
            <ul className="space-y-4 text-sm">
              <li>
                <a
                  href="tel:+50324554899"
                  className="text-white/60 hover:text-[#FBBF24] transition-colors duration-300"
                >
                  +503 2455-4899
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@simmerdownsv.com"
                  className="text-white/60 hover:text-[#FBBF24] transition-colors duration-300"
                >
                  info@simmerdownsv.com
                </a>
              </li>
              <li className="text-white/40 pt-1">
                5 {t(translations.footer.locationsInSV)}
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-6 pb-20 lg:pb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/20">
            &copy; 2026 Simmer Down &middot;{' '}
            <a
              href="https://machinemind.co"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/40 transition-colors"
            >
              Crafted by MachineMind
            </a>
          </p>
          <div className="flex gap-4">
            <Link
              href="/privacy"
              className="text-xs text-white/20 hover:text-white/40 transition-colors duration-300"
            >
              {t(translations.footer.privacy)}
            </Link>
            <span className="text-white/10 text-xs select-none">&middot;</span>
            <Link
              href="/terms"
              className="text-xs text-white/20 hover:text-white/40 transition-colors duration-300"
            >
              {t(translations.footer.terms)}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
