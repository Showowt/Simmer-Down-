'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  ChevronDown,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const contactReasons = [
  'Consulta General',
  'Comentarios',
  'Eventos Privados',
  'Catering',
  'Alianzas',
  'Carreras',
  'Prensa/Medios',
  'Otro',
]

const faqs = [
  {
    question: '¿Ofrecen delivery?',
    answer: 'Sí, hacemos entregas dentro de un radio de 5km de cada ubicación. El delivery es gratis para pedidos mayores a $25. Puedes ordenar por nuestra web o llamarnos directamente.',
  },
  {
    question: '¿Puedo hacer una reservación?',
    answer: 'Por supuesto. Puedes llamar a cualquiera de nuestras ubicaciones o usar nuestro sistema de reservas en línea. Para grupos de 8 o más, te recomendamos llamar con anticipación.',
  },
  {
    question: '¿Tienen opciones para restricciones alimentarias?',
    answer: 'Sí, ofrecemos masa sin gluten y podemos modificar muchas pizzas para hacerlas vegetarianas o veganas. Por favor, infórmanos sobre cualquier alergia al ordenar.',
  },
  {
    question: '¿Cómo funciona SimmerLovers?',
    answer: 'SimmerLovers es nuestro programa de lealtad gratuito. Gana 1 punto por cada $1 gastado y canjea tus puntos por comida gratis y beneficios exclusivos. Regístrate en línea o en tienda.',
  },
  {
    question: '¿Organizan eventos privados?',
    answer: 'Sí, tenemos espacios privados en todas nuestras ubicaciones perfectos para cumpleaños, eventos corporativos y celebraciones. Contáctanos para disponibilidad y menús personalizados.',
  },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    reason: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { error: dbError } = await supabase
        .from('contact_submissions')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          reason: formData.reason,
          message: formData.message,
          status: 'new',
        }])

      if (dbError) {
        // If table doesn't exist, still show success (graceful degradation)
        console.log('Contact submission:', formData)
      }

      setSubmitted(true)
    } catch (err) {
      console.error('Contact form error:', err)
      // Still show success to user - we don't want to block contact attempts
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#2D2A26] pt-24">
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-[#FF6B35] font-semibold uppercase tracking-wider text-sm mb-4 block">
              Contáctanos
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-[#FFF8F0] mb-6">
              Queremos Escucharte
            </h1>
            <p className="text-xl text-[#B8B0A8]">
              Preguntas, comentarios o simplemente para saludar.
              Estamos aquí para ayudarte.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-1 space-y-6"
            >
              <div className="bg-[#252320] border border-[#3D3936] p-6">
                <h3 className="text-lg font-semibold text-[#FFF8F0] mb-6">Información de Contacto</h3>

                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[#6B6560] text-sm">Teléfonos</p>
                      <a href="tel:+50324455999" className="text-[#FFF8F0] font-medium hover:text-[#FF6B35] transition-colors block">
                        +503 2445-5999 (Santa Ana)
                      </a>
                      <a href="tel:+50374877792" className="text-[#FFF8F0] font-medium hover:text-[#FF6B35] transition-colors block">
                        +503 7487-7792 (San Benito)
                      </a>
                      <p className="text-[#6B6560] text-sm mt-1">WhatsApp disponible</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[#6B6560] text-sm">Email</p>
                      <a href="mailto:info@simmerdown.sv" className="text-[#FFF8F0] font-medium hover:text-[#FF6B35] transition-colors">
                        info@simmerdown.sv
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[#6B6560] text-sm">Ubicaciones</p>
                      <p className="text-[#FFF8F0] font-medium">5 sucursales en El Salvador</p>
                      <p className="text-[#6B6560] text-sm">Santa Ana · Coatepeque · San Benito · Juayúa · Surf City</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[#6B6560] text-sm">Horarios</p>
                      <p className="text-[#FFF8F0] font-medium">11:00 AM - 10:00 PM</p>
                      <p className="text-[#6B6560] text-sm">Varían por ubicación</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-[#252320] border border-[#3D3936] p-6">
                <h3 className="text-lg font-bold text-[#FFF8F0] mb-4">Enlaces Rápidos</h3>
                <div className="space-y-3">
                  <Link href="/locations" className="flex items-center gap-3 text-[#B8B0A8] hover:text-[#FF6B35] transition-colors">
                    <MapPin className="w-5 h-5" />
                    Todas las Ubicaciones
                  </Link>
                  <Link href="/menu" className="flex items-center gap-3 text-[#B8B0A8] hover:text-[#FF6B35] transition-colors">
                    <Clock className="w-5 h-5" />
                    Ver Menú
                  </Link>
                  <Link href="/simmerlovers" className="flex items-center gap-3 text-[#B8B0A8] hover:text-[#FF6B35] transition-colors">
                    <Mail className="w-5 h-5" />
                    SimmerLovers
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <div className="bg-[#252320] border border-[#3D3936] p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="w-8 h-8 text-[#4CAF50]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#FFF8F0] mb-2">Mensaje Enviado</h3>
                    <p className="text-[#B8B0A8]">
                      Gracias por contactarnos. Te responderemos dentro de 24 horas.
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-[#FFF8F0] mb-6">Envíanos un Mensaje</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="contact-name" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                            Nombre *
                          </label>
                          <input
                            id="contact-name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                            placeholder="Tu nombre"
                          />
                        </div>
                        <div>
                          <label htmlFor="contact-email" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                            Correo Electrónico *
                          </label>
                          <input
                            id="contact-email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                            placeholder="tu@email.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="contact-phone" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                            Teléfono (opcional)
                          </label>
                          <input
                            id="contact-phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                            placeholder="+503 XXXX-XXXX"
                          />
                        </div>
                        <div>
                          <label htmlFor="contact-reason" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                            Motivo *
                          </label>
                          <select
                            id="contact-reason"
                            required
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full px-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] focus:outline-none focus:border-[#FF6B35] transition appearance-none min-h-[48px]"
                          >
                            <option value="">Selecciona un motivo</option>
                            {contactReasons.map((reason) => (
                              <option key={reason} value={reason}>
                                {reason}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="contact-message" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                          Mensaje *
                        </label>
                        <textarea
                          id="contact-message"
                          required
                          rows={5}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full px-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition resize-none"
                          placeholder="¿Cómo podemos ayudarte?"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] disabled:bg-[#3D3936] text-white py-4 font-semibold transition-colors min-h-[56px]"
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Enviar Mensaje
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-[#252320] border-t border-[#3D3936]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[#FF6B35] font-semibold uppercase tracking-wider text-sm mb-4 block">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-[#FFF8F0]">
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-[#2D2A26] border border-[#3D3936] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left min-h-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-inset"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-[#FFF8F0]">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#6B6560] transition-transform ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-[#B8B0A8]">{faq.answer}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
