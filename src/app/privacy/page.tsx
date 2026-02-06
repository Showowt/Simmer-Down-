'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#2D2A26] pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#B8B0A8] hover:text-[#FFF8F0] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Inicio
          </Link>

          <h1 className="font-display text-4xl text-[#FFF8F0] mb-4">Política de Privacidad</h1>
          <p className="text-[#6B6560] mb-12">Última actualización: Febrero 2025</p>

          <div className="prose prose-invert max-w-none">
            <div className="space-y-8 text-[#B8B0A8]">
              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">1. Información que Recopilamos</h2>
                <p className="mb-4">
                  En Simmer Down, recopilamos información para brindarte el mejor servicio posible:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-[#FFF8F0]">Información de contacto:</strong> Nombre, correo electrónico, número de teléfono y dirección de entrega.</li>
                  <li><strong className="text-[#FFF8F0]">Información de pedidos:</strong> Historial de compras, preferencias alimentarias y métodos de pago.</li>
                  <li><strong className="text-[#FFF8F0]">Programa SimmerLovers:</strong> Puntos acumulados, recompensas canjeadas y preferencias.</li>
                  <li><strong className="text-[#FFF8F0]">Datos de navegación:</strong> Cookies y datos analíticos para mejorar tu experiencia.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">2. Cómo Usamos tu Información</h2>
                <p className="mb-4">Utilizamos tu información para:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Procesar y entregar tus pedidos</li>
                  <li>Gestionar tu cuenta de SimmerLovers</li>
                  <li>Enviarte actualizaciones sobre tu pedido</li>
                  <li>Mejorar nuestros productos y servicios</li>
                  <li>Enviarte ofertas promocionales (solo si lo autorizas)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">3. Compartir Información</h2>
                <p>
                  No vendemos tu información personal. Solo compartimos datos con proveedores
                  de servicios necesarios (procesadores de pago, servicios de entrega) y cuando
                  la ley lo requiera.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">4. Seguridad de Datos</h2>
                <p>
                  Implementamos medidas de seguridad técnicas y organizativas para proteger
                  tu información personal contra acceso no autorizado, pérdida o alteración.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">5. Tus Derechos</h2>
                <p className="mb-4">Tienes derecho a:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Acceder a tu información personal</li>
                  <li>Corregir datos inexactos</li>
                  <li>Solicitar la eliminación de tus datos</li>
                  <li>Oponerte al procesamiento de tu información</li>
                  <li>Retirar tu consentimiento en cualquier momento</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">6. Cookies</h2>
                <p>
                  Utilizamos cookies para mejorar tu experiencia de navegación, recordar tus
                  preferencias y analizar el uso del sitio. Puedes gestionar las cookies en
                  la configuración de tu navegador.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">7. Contacto</h2>
                <p className="mb-4">
                  Para preguntas sobre privacidad, contáctanos:
                </p>
                <ul className="list-none space-y-2">
                  <li>Email: <a href="mailto:privacidad@simmerdown.sv" className="text-[#FF6B35] hover:underline">privacidad@simmerdown.sv</a></li>
                  <li>Teléfono: <a href="tel:+50324455999" className="text-[#FF6B35] hover:underline">+503 2445-5999</a></li>
                </ul>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
