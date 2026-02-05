'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Instagram, Facebook, Send } from 'lucide-react'

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
    <footer className="bg-zinc-950 border-t border-zinc-800">
      {/* Newsletter Section */}
      <div className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Get 15% off your first order
              </h3>
              <p className="text-sm text-zinc-500">
                Subscribe for exclusive deals and pizza news.
              </p>
            </div>
            {subscribed ? (
              <div className="flex items-center gap-2 text-green-500 font-medium">
                <Send className="w-4 h-4" />
                Thanks! Check your inbox.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2 w-full md:w-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 md:w-64 px-4 py-3 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

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
