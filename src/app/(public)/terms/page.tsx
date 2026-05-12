'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function TermsPage() {
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
            {isEs ? 'T\u00e9rminos y Condiciones' : 'Terms and Conditions'}
          </h1>
          <p className="text-[#6B6560] mb-12">
            {isEs ? '\u00daltima actualizaci\u00f3n: Febrero 2025' : 'Last updated: February 2025'}
          </p>

          <div className="prose prose-invert max-w-none">
            <div className="space-y-8 text-[#B8B0A8]">
              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '1. Aceptaci\u00f3n de T\u00e9rminos' : '1. Acceptance of Terms'}
                </h2>
                <p>
                  {isEs
                    ? 'Al acceder y utilizar el sitio web de Simmer Down (simmerdownsv.com), aceptas estar sujeto a estos t\u00e9rminos y condiciones. Si no est\u00e1s de acuerdo con alguna parte de estos t\u00e9rminos, no utilices nuestros servicios.'
                    : 'By accessing and using the Simmer Down website (simmerdownsv.com), you agree to be bound by these terms and conditions. If you do not agree with any part of these terms, please do not use our services.'}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '2. Servicios' : '2. Services'}
                </h2>
                <p className="mb-4">
                  {isEs
                    ? 'Simmer Down ofrece servicios de restaurante incluyendo:'
                    : 'Simmer Down offers restaurant services including:'}
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  {isEs ? (
                    <>
                      <li>Pedidos en l\u00ednea para recoger o delivery</li>
                      <li>Reservaciones en restaurante</li>
                      <li>Programa de lealtad SimmerLovers</li>
                      <li>Servicios de catering y eventos privados</li>
                    </>
                  ) : (
                    <>
                      <li>Online orders for pickup or delivery</li>
                      <li>Restaurant reservations</li>
                      <li>SimmerLovers loyalty program</li>
                      <li>Catering and private event services</li>
                    </>
                  )}
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '3. Pedidos y Pagos' : '3. Orders and Payments'}
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  {isEs ? (
                    <>
                      <li>Los precios est\u00e1n en d\u00f3lares estadounidenses (USD)</li>
                      <li>Todos los precios incluyen IVA</li>
                      <li>Los pedidos est\u00e1n sujetos a disponibilidad</li>
                      <li>Aceptamos efectivo, tarjetas de cr\u00e9dito/d\u00e9bito y pagos m\u00f3viles</li>
                      <li>El costo de delivery var\u00eda seg\u00fan la ubicaci\u00f3n</li>
                    </>
                  ) : (
                    <>
                      <li>Prices are listed in US dollars (USD)</li>
                      <li>All prices include VAT</li>
                      <li>Orders are subject to availability</li>
                      <li>We accept cash, credit/debit cards, and mobile payments</li>
                      <li>Delivery fees vary by location</li>
                    </>
                  )}
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '4. Entregas' : '4. Deliveries'}
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  {isEs ? (
                    <>
                      <li>Radio de entrega: 5km desde cada ubicaci\u00f3n</li>
                      <li>Tiempo estimado: 30-45 minutos (puede variar)</li>
                      <li>Delivery gratis en pedidos mayores a $25</li>
                      <li>No nos hacemos responsables por retrasos debido a condiciones clim\u00e1ticas o de tr\u00e1fico</li>
                    </>
                  ) : (
                    <>
                      <li>Delivery radius: 5km from each location</li>
                      <li>Estimated time: 30-45 minutes (may vary)</li>
                      <li>Free delivery on orders over $25</li>
                      <li>We are not responsible for delays due to weather or traffic conditions</li>
                    </>
                  )}
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '5. Programa SimmerLovers' : '5. SimmerLovers Program'}
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  {isEs ? (
                    <>
                      <li>Gana 1 punto por cada $1 gastado</li>
                      <li>Los puntos expiran despu\u00e9s de 12 meses de inactividad</li>
                      <li>Las recompensas no son transferibles</li>
                      <li>Simmer Down se reserva el derecho de modificar el programa</li>
                    </>
                  ) : (
                    <>
                      <li>Earn 1 point for every $1 spent</li>
                      <li>Points expire after 12 months of inactivity</li>
                      <li>Rewards are non-transferable</li>
                      <li>Simmer Down reserves the right to modify the program</li>
                    </>
                  )}
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '6. Cancelaciones y Reembolsos' : '6. Cancellations and Refunds'}
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  {isEs ? (
                    <>
                      <li>Puedes cancelar tu pedido dentro de los primeros 5 minutos</li>
                      <li>Una vez que el pedido est\u00e1 en preparaci\u00f3n, no es posible cancelar</li>
                      <li>Para problemas con tu pedido, cont\u00e1ctanos de inmediato</li>
                      <li>Los reembolsos se procesan en 5-7 d\u00edas h\u00e1biles</li>
                    </>
                  ) : (
                    <>
                      <li>You may cancel your order within the first 5 minutes</li>
                      <li>Once the order is being prepared, cancellation is not possible</li>
                      <li>For issues with your order, please contact us immediately</li>
                      <li>Refunds are processed within 5-7 business days</li>
                    </>
                  )}
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '7. Alergias e Informaci\u00f3n Nutricional' : '7. Allergies and Nutritional Information'}
                </h2>
                <p>
                  {isEs
                    ? 'Nuestros productos pueden contener o haber estado en contacto con al\u00e9rgenos comunes. Si tienes alergias alimentarias, inf\u00f3rmanos al hacer tu pedido. No garantizamos un ambiente libre de al\u00e9rgenos.'
                    : 'Our products may contain or have been in contact with common allergens. If you have food allergies, please let us know when placing your order. We do not guarantee an allergen-free environment.'}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '8. Propiedad Intelectual' : '8. Intellectual Property'}
                </h2>
                <p>
                  {isEs
                    ? 'Todo el contenido del sitio web, incluyendo logos, im\u00e1genes, textos y dise\u00f1os, son propiedad de Simmer Down y est\u00e1n protegidos por leyes de propiedad intelectual.'
                    : 'All website content, including logos, images, text, and designs, is the property of Simmer Down and is protected by intellectual property laws.'}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '9. Limitaci\u00f3n de Responsabilidad' : '9. Limitation of Liability'}
                </h2>
                <p>
                  {isEs
                    ? 'Simmer Down no ser\u00e1 responsable por da\u00f1os indirectos, incidentales o consecuentes que surjan del uso de nuestros servicios, excepto cuando la ley lo requiera.'
                    : 'Simmer Down shall not be liable for indirect, incidental, or consequential damages arising from the use of our services, except where required by law.'}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '10. Modificaciones' : '10. Modifications'}
                </h2>
                <p>
                  {isEs
                    ? 'Nos reservamos el derecho de modificar estos t\u00e9rminos en cualquier momento. Los cambios entrar\u00e1n en vigor inmediatamente despu\u00e9s de su publicaci\u00f3n en el sitio web.'
                    : 'We reserve the right to modify these terms at any time. Changes will take effect immediately upon publication on the website.'}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '11. Contacto' : '11. Contact'}
                </h2>
                <p className="mb-4">
                  {isEs
                    ? 'Para preguntas sobre estos t\u00e9rminos:'
                    : 'For questions about these terms:'}
                </p>
                <ul className="list-none space-y-2">
                  <li>Email: <a href="mailto:info@simmerdownsv.com" className="text-[#FF6B35] hover:underline">info@simmerdownsv.com</a></li>
                  <li>{isEs ? 'Tel\u00e9fono' : 'Phone'}: <a href="tel:+50324455999" className="text-[#FF6B35] hover:underline">+503 2445-5999</a></li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">
                  {isEs ? '12. Ley Aplicable' : '12. Governing Law'}
                </h2>
                <p>
                  {isEs
                    ? 'Estos t\u00e9rminos se rigen por las leyes de la Rep\u00fablica de El Salvador. Cualquier disputa ser\u00e1 resuelta en los tribunales competentes de El Salvador.'
                    : 'These terms are governed by the laws of the Republic of El Salvador. Any disputes shall be resolved in the competent courts of El Salvador.'}
                </p>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
