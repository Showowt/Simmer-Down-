'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Instagram, Facebook, Send, Flame, Heart, MapPin, Phone } from 'lucide-react'
import { useI18n, translations } from '@/lib/i18n'

export default function Footer() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const footerLinks = {
    menu: [
      { label: t(translations.footer.pizzas), href: '/menu' },
      { label: t(translations.footer.pastas), href: '/menu' },
      { label: t(translations.footer.sides), href: '/menu' },
      { label: t(translations.footer.drinks), href: '/menu' },
    ],
    locations: [
      { label: 'Santa Ana', href: '/locations' },
      { label: 'Coatepeque', href: '/locations' },
      { label: 'San Benito', href: '/locations' },
      { label: 'Juayúa', href: '/locations' },
      { label: 'Surf City', href: '/locations' },
    ],
    company: [
      { label: t(translations.footer.ourStory), href: '/about' },
      { label: t(translations.footer.events), href: '/events' },
      { label: t(translations.footer.simmerLovers), href: '/simmerlovers' },
      { label: t(translations.footer.reservations), href: '/reservations' },
      { label: t(translations.footer.contact), href: '/contact' },
    ],
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail('')
    }
  }

  return (
    <footer className="bg-[#1F1D1A] border-t border-[#3D3936]">
      {/* Newsletter Section */}
      <div className="border-b border-[#3D3936]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="font-display text-xl text-[#FFF8F0] mb-1">
                {t(translations.footer.joinFamily)}
              </h3>
              <p className="text-sm text-[#6B6560]">
                {t(translations.footer.newsletterDesc)}
              </p>
            </div>
            {subscribed ? (
              <div className="flex items-center gap-2 text-[#4CAF50] font-medium">
                <Send className="w-4 h-4" />
                {t(translations.footer.subscribed)}
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2 w-full md:w-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t(translations.footer.emailPlaceholder)}
                  required
                  className="flex-1 md:w-64 px-4 py-3 bg-[#252320] border border-[#3D3936] text-[#FFF8F0] placeholder-[#6B6560] text-sm focus:outline-none focus:border-[#FF6B35] transition-colors"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#FF6B35] hover:bg-[#E55A2B] text-white text-sm font-semibold transition-colors min-h-[48px]"
                >
                  {t(translations.footer.subscribe)}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-display text-xl text-[#FFF8F0]">
              <Flame className="w-5 h-5 text-[#FF6B35]" />
              Simmer Down
            </Link>
            <p className="mt-4 text-sm text-[#6B6560] leading-relaxed">
              {t(translations.footer.description)}
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="https://instagram.com/simmerdownsv"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 flex items-center justify-center bg-[#252320] text-[#6B6560] hover:text-[#FFF8F0] hover:bg-[#3D3936] transition-colors"
                aria-label={t(translations.footer.followInstagram)}
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com/simmerdownsv"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 flex items-center justify-center bg-[#252320] text-[#6B6560] hover:text-[#FFF8F0] hover:bg-[#3D3936] transition-colors"
                aria-label={t(translations.footer.followFacebook)}
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Menu Links */}
          <div>
            <h4 className="text-sm font-semibold text-[#FFF8F0] mb-4 uppercase tracking-wider">{t(translations.footer.menuSection)}</h4>
            <ul className="space-y-3">
              {footerLinks.menu.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#6B6560] hover:text-[#FF6B35] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h4 className="text-sm font-semibold text-[#FFF8F0] mb-4 uppercase tracking-wider">{t(translations.footer.locationsSection)}</h4>
            <ul className="space-y-3">
              {footerLinks.locations.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#6B6560] hover:text-[#FF6B35] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold text-[#FFF8F0] mb-4 uppercase tracking-wider">{t(translations.footer.companySection)}</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#6B6560] hover:text-[#FF6B35] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-[#FFF8F0] mb-4 uppercase tracking-wider">{t(translations.footer.contactSection)}</h4>
            <ul className="space-y-3 text-sm text-[#6B6560]">
              <li>
                <a href="tel:+50324455999" className="flex items-center gap-2 hover:text-[#FF6B35] transition-colors">
                  <Phone className="w-4 h-4" />
                  +503 2445-5999
                </a>
              </li>
              <li>
                <a href="tel:+50374877792" className="flex items-center gap-2 hover:text-[#FF6B35] transition-colors">
                  <Phone className="w-4 h-4" />
                  +503 7487-7792
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                5 {t(translations.footer.locationsInSV)}
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-[#3D3936] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#4A4642] flex items-center gap-1">
            &copy; {new Date().getFullYear()} Simmer Down. {t(translations.footer.madeWith)}
            <Heart className="w-4 h-4 text-[#FF6B35] fill-[#FF6B35]" />
            {t(translations.footer.inElSalvador)}
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-[#4A4642] hover:text-[#6B6560] transition-colors">
              {t(translations.footer.privacy)}
            </Link>
            <Link href="/terms" className="text-sm text-[#4A4642] hover:text-[#6B6560] transition-colors">
              {t(translations.footer.terms)}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
