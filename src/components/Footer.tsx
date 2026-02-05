'use client'

import Link from 'next/link'
import { Instagram, Facebook } from 'lucide-react'

const footerLinks = {
  menu: [
    { label: 'Pizzas', href: '/menu' },
    { label: 'Sides', href: '/menu' },
    { label: 'Drinks', href: '/menu' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Locations', href: '/locations' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold text-white tracking-tight">
              Simmer Down
            </Link>
            <p className="mt-4 text-sm text-zinc-500 leading-relaxed">
              Wood-fired artisan pizza in San Salvador, El Salvador.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="https://instagram.com/simmerdownsv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-white transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com/simmerdownsv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-white transition-colors"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Menu Links */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Menu</h4>
            <ul className="space-y-3">
              {footerLinks.menu.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-500 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-500 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-zinc-500">
              <li>
                <a href="tel:+50322637890" className="hover:text-white transition-colors">
                  +503 2263-7890
                </a>
              </li>
              <li>
                <a href="mailto:hello@simmerdown.sv" className="hover:text-white transition-colors">
                  hello@simmerdown.sv
                </a>
              </li>
              <li>San Salvador, El Salvador</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} Simmer Down. All rights reserved.
          </p>
          <div className="flex gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
