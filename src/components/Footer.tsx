'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Instagram, Facebook, Send, Flame, Heart, MapPin, Phone } from 'lucide-react'

const footerLinks = {
  menu: [
    { label: 'Pizzas', href: '/menu' },
    { label: 'Pastas', href: '/menu' },
    { label: 'Acompañamientos', href: '/menu' },
    { label: 'Bebidas', href: '/menu' },
  ],
  locations: [
    { label: 'Santa Ana', href: '/locations' },
    { label: 'Coatepeque', href: '/locations' },
    { label: 'San Benito', href: '/locations' },
    { label: 'Juayúa', href: '/locations' },
    { label: 'Surf City', href: '/locations' },
  ],
  company: [
    { label: 'Nuestra Historia', href: '/about' },
    { label: 'Eventos', href: '/events' },
    { label: 'SimmerLovers', href: '/simmerlovers' },
    { label: 'Contacto', href: '/contact' },
  ],
}

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

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
                Únete a la familia
              </h3>
              <p className="text-sm text-[#6B6560]">
                Ofertas exclusivas, eventos y más directo a tu inbox.
              </p>
            </div>
            {subscribed ? (
              <div className="flex items-center gap-2 text-[#4CAF50] font-medium">
                <Send className="w-4 h-4" />
                ¡Gracias! Revisa tu bandeja.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2 w-full md:w-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tu correo electrónico"
                  required
                  className="flex-1 md:w-64 px-4 py-3 bg-[#252320] border border-[#3D3936] text-[#FFF8F0] placeholder-[#6B6560] text-sm focus:outline-none focus:border-[#FF6B35] transition-colors"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#FF6B35] hover:bg-[#E55A2B] text-white text-sm font-semibold transition-colors min-h-[48px]"
                >
                  Suscribirse
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
              Restaurante y Destino Gastro-Musical. 12 años creando memorias en El Salvador.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="https://instagram.com/simmerdownsv"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-[#252320] text-[#6B6560] hover:text-[#FFF8F0] hover:bg-[#3D3936] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com/simmerdownsv"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-[#252320] text-[#6B6560] hover:text-[#FFF8F0] hover:bg-[#3D3936] transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Menu Links */}
          <div>
            <h4 className="text-sm font-semibold text-[#FFF8F0] mb-4 uppercase tracking-wider">Menú</h4>
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
            <h4 className="text-sm font-semibold text-[#FFF8F0] mb-4 uppercase tracking-wider">Ubicaciones</h4>
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
            <h4 className="text-sm font-semibold text-[#FFF8F0] mb-4 uppercase tracking-wider">Compañía</h4>
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
            <h4 className="text-sm font-semibold text-[#FFF8F0] mb-4 uppercase tracking-wider">Contacto</h4>
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
                5 Ubicaciones en El Salvador
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-[#3D3936] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#4A4642] flex items-center gap-1">
            &copy; {new Date().getFullYear()} Simmer Down. Hecho con
            <Heart className="w-4 h-4 text-[#FF6B35] fill-[#FF6B35]" />
            en El Salvador.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-[#4A4642] hover:text-[#6B6560] transition-colors">
              Privacidad
            </Link>
            <Link href="/terms" className="text-sm text-[#4A4642] hover:text-[#6B6560] transition-colors">
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
