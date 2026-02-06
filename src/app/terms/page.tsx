'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
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

          <h1 className="font-display text-4xl text-[#FFF8F0] mb-4">Términos y Condiciones</h1>
          <p className="text-[#6B6560] mb-12">Última actualización: Febrero 2025</p>

          <div className="prose prose-invert max-w-none">
            <div className="space-y-8 text-[#B8B0A8]">
              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">1. Aceptación de Términos</h2>
                <p>
                  Al acceder y utilizar el sitio web de Simmer Down (simmerdown.sv), aceptas
                  estar sujeto a estos términos y condiciones. Si no estás de acuerdo con
                  alguna parte de estos términos, no utilices nuestros servicios.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">2. Servicios</h2>
                <p className="mb-4">
                  Simmer Down ofrece servicios de restaurante incluyendo:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Pedidos en línea para recoger o delivery</li>
                  <li>Reservaciones en restaurante</li>
                  <li>Programa de lealtad SimmerLovers</li>
                  <li>Servicios de catering y eventos privados</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">3. Pedidos y Pagos</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Los precios están en dólares estadounidenses (USD)</li>
                  <li>Todos los precios incluyen IVA</li>
                  <li>Los pedidos están sujetos a disponibilidad</li>
                  <li>Aceptamos efectivo, tarjetas de crédito/débito y pagos móviles</li>
                  <li>El costo de delivery varía según la ubicación</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">4. Entregas</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Radio de entrega: 5km desde cada ubicación</li>
                  <li>Tiempo estimado: 30-45 minutos (puede variar)</li>
                  <li>Delivery gratis en pedidos mayores a $25</li>
                  <li>No nos hacemos responsables por retrasos debido a condiciones climáticas o de tráfico</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">5. Programa SimmerLovers</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Gana 1 punto por cada $1 gastado</li>
                  <li>Los puntos expiran después de 12 meses de inactividad</li>
                  <li>Las recompensas no son transferibles</li>
                  <li>Simmer Down se reserva el derecho de modificar el programa</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">6. Cancelaciones y Reembolsos</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Puedes cancelar tu pedido dentro de los primeros 5 minutos</li>
                  <li>Una vez que el pedido está en preparación, no es posible cancelar</li>
                  <li>Para problemas con tu pedido, contáctanos de inmediato</li>
                  <li>Los reembolsos se procesan en 5-7 días hábiles</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">7. Alergias e Información Nutricional</h2>
                <p>
                  Nuestros productos pueden contener o haber estado en contacto con alérgenos
                  comunes. Si tienes alergias alimentarias, infórmanos al hacer tu pedido.
                  No garantizamos un ambiente libre de alérgenos.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">8. Propiedad Intelectual</h2>
                <p>
                  Todo el contenido del sitio web, incluyendo logos, imágenes, textos y diseños,
                  son propiedad de Simmer Down y están protegidos por leyes de propiedad
                  intelectual.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">9. Limitación de Responsabilidad</h2>
                <p>
                  Simmer Down no será responsable por daños indirectos, incidentales o
                  consecuentes que surjan del uso de nuestros servicios, excepto cuando
                  la ley lo requiera.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">10. Modificaciones</h2>
                <p>
                  Nos reservamos el derecho de modificar estos términos en cualquier momento.
                  Los cambios entrarán en vigor inmediatamente después de su publicación en
                  el sitio web.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">11. Contacto</h2>
                <p className="mb-4">
                  Para preguntas sobre estos términos:
                </p>
                <ul className="list-none space-y-2">
                  <li>Email: <a href="mailto:info@simmerdown.sv" className="text-[#FF6B35] hover:underline">info@simmerdown.sv</a></li>
                  <li>Teléfono: <a href="tel:+50324455999" className="text-[#FF6B35] hover:underline">+503 2445-5999</a></li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#FFF8F0] mb-4">12. Ley Aplicable</h2>
                <p>
                  Estos términos se rigen por las leyes de la República de El Salvador.
                  Cualquier disputa será resuelta en los tribunales competentes de El Salvador.
                </p>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
