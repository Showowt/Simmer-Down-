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
  Building,
  Users,
  Briefcase,
  ChevronDown,
  Check
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

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
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, this would send to an API
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-24">
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-orange-400 font-semibold uppercase tracking-wider text-sm mb-4 block">
              Contáctanos
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Queremos Escucharte
            </h1>
            <p className="text-xl text-zinc-400">
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
              <div className="bg-zinc-900 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Información de Contacto</h3>

                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-zinc-500 text-sm">Teléfonos</p>
                      <a href="tel:+50324455999" className="text-white font-medium hover:text-orange-400 transition-colors block">
                        +503 2445-5999 (Santa Ana)
                      </a>
                      <a href="tel:+50374877792" className="text-white font-medium hover:text-orange-400 transition-colors block">
                        +503 7487-7792 (San Benito)
                      </a>
                      <p className="text-zinc-500 text-sm mt-1">WhatsApp disponible</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-zinc-500 text-sm">Email</p>
                      <a href="mailto:info@simmerdown.sv" className="text-white font-medium hover:text-orange-400 transition-colors">
                        info@simmerdown.sv
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-zinc-500 text-sm">Ubicaciones</p>
                      <p className="text-white font-medium">5 sucursales en El Salvador</p>
                      <p className="text-zinc-500 text-sm">Santa Ana · Coatepeque · San Benito · Juayúa · Surf City</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-zinc-500 text-sm">Horarios</p>
                      <p className="text-white font-medium">11:00 AM - 10:00 PM</p>
                      <p className="text-zinc-500 text-sm">Varían por ubicación</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-zinc-900 border border-zinc-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Enlaces Rápidos</h3>
                <div className="space-y-3">
                  <a href="/events" className="flex items-center gap-3 text-zinc-400 hover:text-orange-400 transition-colors">
                    <Users className="w-5 h-5" />
                    Eventos Privados
                  </a>
                  <a href="/careers" className="flex items-center gap-3 text-zinc-400 hover:text-orange-400 transition-colors">
                    <Briefcase className="w-5 h-5" />
                    Carreras
                  </a>
                  <a href="/press" className="flex items-center gap-3 text-zinc-400 hover:text-orange-400 transition-colors">
                    <Building className="w-5 h-5" />
                    Prensa y Medios
                  </a>
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
              <div className="bg-zinc-900 border border-zinc-800 p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Mensaje Enviado</h3>
                    <p className="text-zinc-400">
                      Gracias por contactarnos. Te responderemos dentro de 24 horas.
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-white mb-6">Envíanos un Mensaje</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Nombre *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition"
                            placeholder="Tu nombre"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Correo Electrónico *
                          </label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition"
                            placeholder="tu@email.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Teléfono (opcional)
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition"
                            placeholder="+503 XXXX-XXXX"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Motivo *
                          </label>
                          <select
                            required
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500 transition appearance-none"
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
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                          Mensaje *
                        </label>
                        <textarea
                          required
                          rows={5}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition resize-none"
                          placeholder="¿Cómo podemos ayudarte?"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-4 font-semibold transition-colors min-h-[56px]"
                      >
                        <Send className="w-5 h-5" />
                        Enviar Mensaje
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
      <section className="py-24 bg-zinc-900/50 border-t border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-orange-400 font-semibold uppercase tracking-wider text-sm mb-4 block">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white">
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
                className="bg-zinc-900 border border-zinc-800 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left min-h-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-inset"
                >
                  <span className="font-semibold text-white">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-zinc-400 transition-transform ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-zinc-400">{faq.answer}</p>
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
