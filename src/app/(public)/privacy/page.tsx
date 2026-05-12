'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function PrivacyPage() {
  const { locale } = useI18n()

  const isEs = locale === 'es'

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
            {isEs ? 'Volver al Inicio' : 'Back to Home'}
          </Link>

          <h1 className="font-display text-4xl text-[#FFF8F0] mb-4">
            {isEs ? 'Pol\u00edtica de Privacidad' : 'Privacy Policy'}
          </h1>
          <p className="text-[#6B6560] mb-12">
            {isEs ? '\u00daltima actualizaci\u00f3n: Febrero 2025' : 'Last updated: February 2025'}
          </p>

          <div className="prose prose-invert max-w-none">
            <div className="space-y-8 text-[#B8B0A8]">
              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '1. Informaci\u00f3n que Recopilamos' : '1. Information We Collect'}
                </h2>
                <p className="mb-4">
                  {isEs
                    ? 'En Simmer Down, recopilamos informaci\u00f3n para brindarte el mejor servicio posible:'
                    : 'At Simmer Down, we collect information to provide you with the best possible service:'}
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  {isEs ? (
                    <>
                      <li><strong className="text-[#FFF8F0]">Informaci\u00f3n de contacto:</strong> Nombre, correo electr\u00f3nico, n\u00famero de tel\u00e9fono y direcci\u00f3n de entrega.</li>
                      <li><strong className="text-[#FFF8F0]">Informaci\u00f3n de pedidos:</strong> Historial de compras, preferencias alimentarias y m\u00e9todos de pago.</li>
                      <li><strong className="text-[#FFF8F0]">Programa SimmerLovers:</strong> Puntos acumulados, recompensas canjeadas y preferencias.</li>
                      <li><strong className="text-[#FFF8F0]">Datos de navegaci\u00f3n:</strong> Cookies y datos anal\u00edticos para mejorar tu experiencia.</li>
                    </>
                  ) : (
                    <>
                      <li><strong className="text-[#FFF8F0]">Contact information:</strong> Name, email address, phone number, and delivery address.</li>
                      <li><strong className="text-[#FFF8F0]">Order information:</strong> Purchase history, dietary preferences, and payment methods.</li>
                      <li><strong className="text-[#FFF8F0]">SimmerLovers program:</strong> Accumulated points, redeemed rewards, and preferences.</li>
                      <li><strong className="text-[#FFF8F0]">Browsing data:</strong> Cookies and analytics data to improve your experience.</li>
                    </>
                  )}
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '2. C\u00f3mo Usamos tu Informaci\u00f3n' : '2. How We Use Your Information'}
                </h2>
                <p className="mb-4">
                  {isEs ? 'Utilizamos tu informaci\u00f3n para:' : 'We use your information to:'}
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  {isEs ? (
                    <>
                      <li>Procesar y entregar tus pedidos</li>
                      <li>Gestionar tu cuenta de SimmerLovers</li>
                      <li>Enviarte actualizaciones sobre tu pedido</li>
                      <li>Mejorar nuestros productos y servicios</li>
                      <li>Enviarte ofertas promocionales (solo si lo autorizas)</li>
                    </>
                  ) : (
                    <>
                      <li>Process and deliver your orders</li>
                      <li>Manage your SimmerLovers account</li>
                      <li>Send you updates about your order</li>
                      <li>Improve our products and services</li>
                      <li>Send you promotional offers (only with your consent)</li>
                    </>
                  )}
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '3. Compartir Informaci\u00f3n' : '3. Sharing Information'}
                </h2>
                <p>
                  {isEs
                    ? 'No vendemos tu informaci\u00f3n personal. Solo compartimos datos con proveedores de servicios necesarios (procesadores de pago, servicios de entrega) y cuando la ley lo requiera.'
                    : 'We do not sell your personal information. We only share data with necessary service providers (payment processors, delivery services) and when required by law.'}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '4. Seguridad de Datos' : '4. Data Security'}
                </h2>
                <p>
                  {isEs
                    ? 'Implementamos medidas de seguridad t\u00e9cnicas y organizativas para proteger tu informaci\u00f3n personal contra acceso no autorizado, p\u00e9rdida o alteraci\u00f3n.'
                    : 'We implement technical and organizational security measures to protect your personal information against unauthorized access, loss, or alteration.'}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '5. Tus Derechos' : '5. Your Rights'}
                </h2>
                <p className="mb-4">
                  {isEs ? 'Tienes derecho a:' : 'You have the right to:'}
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  {isEs ? (
                    <>
                      <li>Acceder a tu informaci\u00f3n personal</li>
                      <li>Corregir datos inexactos</li>
                      <li>Solicitar la eliminaci\u00f3n de tus datos</li>
                      <li>Oponerte al procesamiento de tu informaci\u00f3n</li>
                      <li>Retirar tu consentimiento en cualquier momento</li>
                    </>
                  ) : (
                    <>
                      <li>Access your personal information</li>
                      <li>Correct inaccurate data</li>
                      <li>Request the deletion of your data</li>
                      <li>Object to the processing of your information</li>
                      <li>Withdraw your consent at any time</li>
                    </>
                  )}
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '6. Cookies' : '6. Cookies'}
                </h2>
                <p>
                  {isEs
                    ? 'Utilizamos cookies para mejorar tu experiencia de navegaci\u00f3n, recordar tus preferencias y analizar el uso del sitio. Puedes gestionar las cookies en la configuraci\u00f3n de tu navegador.'
                    : 'We use cookies to improve your browsing experience, remember your preferences, and analyze site usage. You can manage cookies in your browser settings.'}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '7. Contacto' : '7. Contact'}
                </h2>
                <p className="mb-4">
                  {isEs
                    ? 'Para preguntas sobre privacidad, cont\u00e1ctanos:'
                    : 'For privacy-related questions, contact us:'}
                </p>
                <ul className="list-none space-y-2">
                  <li>Email: <a href="mailto:info@simmerdownsv.com" className="text-[#FF6B35] hover:underline">info@simmerdownsv.com</a></li>
                  <li>{isEs ? 'Tel\u00e9fono' : 'Phone'}: <a href="tel:+50324455999" className="text-[#FF6B35] hover:underline">+503 2445-5999</a></li>
                </ul>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
