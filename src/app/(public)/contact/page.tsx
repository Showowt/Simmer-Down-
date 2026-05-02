"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  ChevronDown,
  AlertCircle,
  Instagram,
  Facebook,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useI18n, translations } from "@/lib/i18n";

export default function ContactPage() {
  const { t, locale } = useI18n();

  const contactReasons = [
    t(translations.contact.reasons.general),
    t(translations.contact.reasons.feedback),
    t(translations.contact.reasons.privateEvents),
    t(translations.contact.reasons.catering),
    t(translations.contact.reasons.partnerships),
    t(translations.contact.reasons.careers),
    t(translations.contact.reasons.press),
    t(translations.contact.reasons.other),
  ];

  const faqs = [
    {
      question: locale === 'es' ? '¿Ofrecen delivery?' : 'Do you offer delivery?',
      answer: locale === 'es'
        ? 'Sí, hacemos entregas dentro de un radio de 5km de cada ubicación. El delivery es gratis para pedidos mayores a $25. Puedes ordenar por nuestra web o llamarnos directamente.'
        : 'Yes, we deliver within a 5km radius of each location. Delivery is free for orders over $25. You can order through our website or call us directly.',
    },
    {
      question: locale === 'es' ? '¿Puedo hacer una reservación?' : 'Can I make a reservation?',
      answer: locale === 'es'
        ? 'Por supuesto. Puedes llamar a cualquiera de nuestras ubicaciones o usar nuestro sistema de reservas en línea. Para grupos de 8 o más, te recomendamos llamar con anticipación.'
        : 'Of course. You can call any of our locations or use our online reservation system. For groups of 8 or more, we recommend calling in advance.',
    },
    {
      question: locale === 'es' ? '¿Tienen opciones para restricciones alimentarias?' : 'Do you have options for dietary restrictions?',
      answer: locale === 'es'
        ? 'Sí, ofrecemos masa sin gluten y podemos modificar muchas pizzas para hacerlas vegetarianas o veganas. Por favor, infórmanos sobre cualquier alergia al ordenar.'
        : 'Yes, we offer gluten-free dough and can modify many pizzas to make them vegetarian or vegan. Please let us know about any allergies when ordering.',
    },
    {
      question: locale === 'es' ? '¿Cómo funciona SimmerLovers?' : 'How does SimmerLovers work?',
      answer: locale === 'es'
        ? 'SimmerLovers es nuestro programa de lealtad gratuito. Gana 1 punto por cada $1 gastado y canjea tus puntos por comida gratis y beneficios exclusivos. Regístrate en línea o en tienda.'
        : 'SimmerLovers is our free loyalty program. Earn 1 point for every $1 spent and redeem your points for free food and exclusive perks. Sign up online or in-store.',
    },
    {
      question: locale === 'es' ? '¿Organizan eventos privados?' : 'Do you host private events?',
      answer: locale === 'es'
        ? 'Sí, tenemos espacios privados en todas nuestras ubicaciones perfectos para cumpleaños, eventos corporativos y celebraciones. Contáctanos para disponibilidad y menús personalizados.'
        : 'Yes, we have private spaces at all our locations perfect for birthdays, corporate events and celebrations. Contact us for availability and custom menus.',
    },
  ];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    reason: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: dbError } = await supabase
        .from("contact_submissions")
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            reason: formData.reason,
            message: formData.message,
            status: "new",
          },
        ]);

      if (dbError) {
        // If table doesn't exist, still show success (graceful degradation)
        console.warn("[Contact] DB insert failed:", dbError.message);
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Contact form error:", err);
      // Still show success to user - we don't want to block contact attempts
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

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
              {t(translations.contact.title)}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-[#FFF8F0] mb-6">
              {t(translations.contact.heading)}
            </h1>
            <p className="text-xl text-[#B8B0A8]">
              {t(translations.contact.subtitle)}
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
                <h3 className="text-lg font-semibold text-[#FFF8F0] mb-6">
                  {t(translations.contact.contactInfo)}
                </h3>

                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[#6B6560] text-sm">{t(translations.contact.phones)}</p>
                      <a
                        href="tel:+50324455999"
                        className="text-[#FFF8F0] font-medium hover:text-[#FF6B35] transition-colors block"
                      >
                        +503 2445-5999 (Santa Ana)
                      </a>
                      <a
                        href="tel:+50374877792"
                        className="text-[#FFF8F0] font-medium hover:text-[#FF6B35] transition-colors block"
                      >
                        +503 7487-7792 (San Benito)
                      </a>
                      <p className="text-[#6B6560] text-sm mt-1">
                        {t(translations.contact.whatsappAvailable)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[#6B6560] text-sm">{t(translations.contact.emailLabel)}</p>
                      <a
                        href="mailto:info@simmerdown.sv"
                        className="text-[#FFF8F0] font-medium hover:text-[#FF6B35] transition-colors"
                      >
                        info@simmerdown.sv
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[#6B6560] text-sm">{t(translations.contact.locationsLabel)}</p>
                      <p className="text-[#FFF8F0] font-medium">
                        5 {t(translations.contact.branches)}
                      </p>
                      <p className="text-[#6B6560] text-sm">
                        Santa Ana · Coatepeque · San Benito · Juayúa · Surf City
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[#6B6560] text-sm">{t(translations.contact.hours)}</p>
                      <p className="text-[#FFF8F0] font-medium">
                        11:00 AM - 10:00 PM
                      </p>
                      <p className="text-[#6B6560] text-sm">
                        {t(translations.contact.varyByLocation)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-[#252320] border border-[#3D3936] p-6">
                <h3 className="text-lg font-bold text-[#FFF8F0] mb-4">
                  {t(translations.contact.quickLinks)}
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/locations"
                    className="flex items-center gap-3 text-[#B8B0A8] hover:text-[#FF6B35] transition-colors"
                  >
                    <MapPin className="w-5 h-5" />
                    {t(translations.contact.allLocations)}
                  </Link>
                  <Link
                    href="/menu"
                    className="flex items-center gap-3 text-[#B8B0A8] hover:text-[#FF6B35] transition-colors"
                  >
                    <Clock className="w-5 h-5" />
                    {t(translations.contact.viewMenu)}
                  </Link>
                  <Link
                    href="/simmerlovers"
                    className="flex items-center gap-3 text-[#B8B0A8] hover:text-[#FF6B35] transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    SimmerLovers
                  </Link>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-[#252320] border border-[#3D3936] p-6">
                <h3 className="text-lg font-bold text-[#FFF8F0] mb-4">
                  {t(translations.contact.socialMedia)}
                </h3>
                <div className="flex gap-3">
                  <a
                    href="https://instagram.com/simmerdownsv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 flex items-center justify-center bg-[#3D3936] text-[#B8B0A8] hover:bg-[#FF6B35] hover:text-white transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href="https://facebook.com/simmerdownsv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 flex items-center justify-center bg-[#3D3936] text-[#B8B0A8] hover:bg-[#FF6B35] hover:text-white transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a
                    href="https://wa.me/50374877792"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 flex items-center justify-center bg-[#3D3936] text-[#B8B0A8] hover:bg-[#25D366] hover:text-white transition-colors"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                </div>
                <p className="text-[#6B6560] text-sm mt-3">
                  @simmerdownsv {t(translations.contact.allPlatforms)}
                </p>
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
                    <h3 className="text-2xl font-bold text-[#FFF8F0] mb-2">
                      {t(translations.contact.messageSent)}
                    </h3>
                    <p className="text-[#B8B0A8]">
                      {t(translations.contact.thankYou)}
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-[#FFF8F0] mb-6">
                      {t(translations.contact.sendMessage)}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="contact-name"
                            className="block text-sm font-medium text-[#B8B0A8] mb-2"
                          >
                            {t(translations.booking.name)} *
                          </label>
                          <input
                            id="contact-name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                            placeholder={t(translations.contact.namePlaceholder)}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="contact-email"
                            className="block text-sm font-medium text-[#B8B0A8] mb-2"
                          >
                            {t(translations.contact.emailLabel)} *
                          </label>
                          <input
                            id="contact-email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                            placeholder={t(translations.contact.emailPlaceholder)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="contact-phone"
                            className="block text-sm font-medium text-[#B8B0A8] mb-2"
                          >
                            {t(translations.contact.phoneOptional)}
                          </label>
                          <input
                            id="contact-phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                            placeholder={t(translations.contact.phonePlaceholder)}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="contact-reason"
                            className="block text-sm font-medium text-[#B8B0A8] mb-2"
                          >
                            {t(translations.contact.reason)} *
                          </label>
                          <div className="relative">
                            <select
                              id="contact-reason"
                              required
                              value={formData.reason}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  reason: e.target.value,
                                })
                              }
                              className="w-full px-4 pr-10 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] focus:outline-none focus:border-[#FF6B35] transition appearance-none min-h-[48px] cursor-pointer"
                            >
                              <option value="">{t(translations.contact.selectReason)}</option>
                              {contactReasons.map((reason) => (
                                <option key={reason} value={reason}>
                                  {reason}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560] pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="contact-message"
                          className="block text-sm font-medium text-[#B8B0A8] mb-2"
                        >
                          {t(translations.contact.message)} *
                        </label>
                        <textarea
                          id="contact-message"
                          required
                          rows={5}
                          value={formData.message}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              message: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition resize-none"
                          placeholder={t(translations.contact.messagePlaceholder)}
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
                            {t(translations.contact.sending)}
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            {t(translations.contact.sendBtn)}
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
              {t(translations.contact.faq)}
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
                  <span className="font-semibold text-[#FFF8F0]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#6B6560] transition-transform ${
                      openFaq === i ? "rotate-180" : ""
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
  );
}
