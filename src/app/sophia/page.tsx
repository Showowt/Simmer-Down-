'use client'

import { SophiaProvider } from '@/components/Sophia'

export default function SophiaPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <span className="text-8xl">🌿</span>
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-7xl font-bold mb-4 tracking-tight">
            SOPHIA
          </h1>
          <p className="text-2xl md:text-3xl text-emerald-200 mb-6">
            Tu guía gastronómica en Simmer Garden
          </p>

          {/* Tagline */}
          <p className="text-xl text-emerald-300 mb-12">
            ¡Escapa de la ciudad! 🌿
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => {
                const btn = document.querySelector('[aria-label="Abrir chat con Sophia"]') as HTMLButtonElement
                btn?.click()
              }}
              className="px-8 py-4 bg-white text-emerald-800 font-bold text-lg hover:bg-emerald-50 transition-colors"
            >
              Hablar con Sophia
            </button>
            <a
              href="https://wa.me/50369904674"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-emerald-800 transition-colors"
            >
              WhatsApp Directo
            </a>
          </div>

          {/* Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white/10 backdrop-blur p-6">
              <div className="text-3xl mb-3">🍕</div>
              <h3 className="text-lg font-bold mb-2">Explora el Menú</h3>
              <p className="text-emerald-200 text-sm">Pizzas, pastas, platos fuertes y más. Pregúntale a Sophia qué te recomienda.</p>
            </div>
            <div className="bg-white/10 backdrop-blur p-6">
              <div className="text-3xl mb-3">🛵</div>
              <h3 className="text-lg font-bold mb-2">Pide Delivery</h3>
              <p className="text-emerald-200 text-sm">Conecta directo con WhatsApp para hacer tu pedido. Rápido y fácil.</p>
            </div>
            <div className="bg-white/10 backdrop-blur p-6">
              <div className="text-3xl mb-3">⭐</div>
              <h3 className="text-lg font-bold mb-2">Best Sellers</h3>
              <p className="text-emerald-200 text-sm">Descubre los favoritos: Medallón de Lomito, Panna Cotta, y más.</p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Menu Preview Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Nuestro Menú</h2>
          <p className="text-center text-gray-600 mb-12">Pregúntale a Sophia sobre cualquiera de estas categorías</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: '🥗', name: 'Entradas', count: 6 },
              { emoji: '🥬', name: 'Ensaladas', count: 3 },
              { emoji: '🍝', name: 'Pastas', count: 4 },
              { emoji: '🍕', name: 'Pizzas', count: 21 },
              { emoji: '🥩', name: 'Platos Fuertes', count: 4 },
              { emoji: '☕', name: 'Bebidas Calientes', count: 11 },
              { emoji: '🍺', name: 'Cervezas', count: 15 },
              { emoji: '🍰', name: 'Postres', count: 4 },
            ].map((cat) => (
              <div key={cat.name} className="bg-emerald-50 p-6 text-center hover:bg-emerald-100 transition-colors cursor-pointer">
                <div className="text-4xl mb-2">{cat.emoji}</div>
                <h3 className="font-bold text-gray-900">{cat.name}</h3>
                <p className="text-sm text-emerald-600">{cat.count} items</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-6 bg-emerald-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Simmer Garden</h2>
          <p className="text-2xl text-emerald-200 mb-8">La Majada</p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a
              href="https://wa.me/50369904674"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              6990 4674
            </a>
          </div>

          <p className="mt-12 text-emerald-300">
            ¡Escapa de la ciudad! 🌿
          </p>
        </div>
      </section>

      {/* Sophia Chat Component */}
      <SophiaProvider />
    </main>
  )
}
