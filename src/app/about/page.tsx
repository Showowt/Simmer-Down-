'use client'

import { motion } from 'framer-motion'
import {
  Heart,
  Flame,
  Leaf,
  Users,
  Sparkles,
  ArrowRight,
  Quote,
  Music,
  ChefHat
} from 'lucide-react'
import Link from 'next/link'

const values = [
  {
    icon: Heart,
    title: 'Hecho con Amor',
    description: 'Cada pizza está elaborada con pasión y cuidado, como si la hiciéramos para nuestra propia familia.',
  },
  {
    icon: Leaf,
    title: 'Fresco y Local',
    description: 'Obtenemos ingredientes de granjas y mercados locales, apoyando a nuestra comunidad salvadoreña.',
  },
  {
    icon: Users,
    title: 'Comunidad Primero',
    description: 'Más que un restaurante, somos un punto de encuentro donde se crean memorias.',
  },
  {
    icon: Sparkles,
    title: 'Solo Buenas Vibras',
    description: 'Creemos que la buena comida sabe mejor en un ambiente cálido y acogedor.',
  },
]

const team = [
  {
    name: 'Chef Marco Rivera',
    role: 'Chef Ejecutivo y Cofundador',
    image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400',
    bio: 'Entrenado en Nápoles, Marco trae técnica italiana auténtica con alma salvadoreña.',
  },
  {
    name: 'Isabella Méndez',
    role: 'Cofundadora y CEO',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400',
    bio: 'Una veterana de la hospitalidad que soñó con traer pizza de clase mundial a El Salvador.',
  },
  {
    name: 'Carlos Hernández',
    role: 'Director de Operaciones',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    bio: 'Asegura que cada ubicación entregue la misma experiencia excepcional Simmer Down.',
  },
]

const milestones = [
  { year: '2013', event: 'Simmer Down abre en Santa Ana, frente a la Catedral' },
  { year: '2016', event: 'Segunda ubicación en Lago de Coatepeque' },
  { year: '2019', event: 'Expansión a San Benito, San Salvador' },
  { year: '2022', event: 'Simmer Garden abre en Juayúa, Ruta de las Flores' },
  { year: '2024', event: 'Surf City: nuestra quinta ubicación frente al mar' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#2D2A26] pt-24">
      {/* Hero */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=1920"
            alt="Pizza making"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-[#2D2A26]/90" />
          <div className="absolute inset-0 bg-oven-warmth" />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              Nuestra Historia
            </p>
            <h1 className="font-display text-4xl md:text-6xl text-[#FFF8F0] mb-6">
              Restaurante y Destino Gastro-Musical
            </h1>
            <p className="text-xl text-[#B8B0A8]">
              Hay lugares que se visitan. Y hay lugares que se recuerdan.
              Simmer Down es parte de la memoria de El Salvador.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
                Desde 2013
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-[#FFF8F0] mb-6">
                Nuestra Historia
              </h2>
              <div className="space-y-4 text-[#B8B0A8] text-lg leading-relaxed">
                <p>
                  Nacimos en <strong className="text-[#FFF8F0]">Santa Ana</strong>, frente a su histórica catedral, como un punto de encuentro
                  donde el tiempo baja la velocidad, la conversación fluye y la comida se disfruta sin prisa.
                </p>
                <p>
                  Desde entonces, nos hemos convertido en un referente gastronómico que acompaña
                  viajes, celebraciones, reencuentros y primeras veces. Para muchos, Simmer Down es nostalgia.
                  Para otros, es un descubrimiento.
                </p>
                <p>
                  Nuestra cocina se inspira en lo artesanal, en el fuego lento y en recetas que respetan
                  el ingrediente y celebran el sabor. Pizzas artesanales, pastas, carnes, platos para compartir
                  y opciones para todos los gustos.
                </p>
                <p className="italic text-[#FFF8F0]">
                  Pero Simmer Down no es solo lo que servimos en la mesa. Es el ambiente. Es la música.
                  Es la vista. Es la sensación de estar exactamente donde debes estar.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <img
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400"
                alt="Wood-fired pizza with fresh toppings"
                className="w-full h-48 object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=400"
                alt="Traditional pizza oven"
                className="w-full h-48 object-cover mt-8"
              />
              <img
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400"
                alt="Fresh pizza ingredients"
                className="w-full h-48 object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400"
                alt="Restaurant interior"
                className="w-full h-48 object-cover mt-8"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-24 bg-[#252320] border-y border-[#3D3936]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Quote className="w-12 h-12 text-[#FF6B35] mx-auto mb-6" />
          <blockquote className="font-display text-2xl md:text-3xl text-[#FFF8F0] italic mb-6">
            &ldquo;Creemos que la mejor gastronomía no solo alimenta: conecta, emociona y permanece.
            Por eso cuidamos cada detalle, para que cada visita se sienta familiar.&rdquo;
          </blockquote>
          <cite className="text-[#6B6560] font-handwritten text-xl">— Simmer Down, 12 años de historia</cite>
        </div>
      </section>

      {/* Values */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              Lo Que Creemos
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0]">
              Nuestros Valores
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-[#FF6B35]/10 flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-[#FF6B35]" />
                </div>
                <h3 className="font-display text-xl text-[#FFF8F0] mb-3">{value.title}</h3>
                <p className="text-[#B8B0A8]">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-[#252320] border-y border-[#3D3936]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              El Equipo
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0]">
              Conoce a la Familia
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="aspect-[3/4] overflow-hidden mb-6">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-display text-xl text-[#FFF8F0] mb-1">{member.name}</h3>
                <p className="text-[#FF6B35] text-sm font-medium mb-3">{member.role}</p>
                <p className="text-[#B8B0A8]">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              Nuestro Camino
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0]">
              Hitos
            </h2>
          </div>

          <div className="relative">
            {/* Line */}
            <div className="absolute left-3 top-3 bottom-3 w-px bg-[#3D3936]" />

            <div className="space-y-8">
              {milestones.map((milestone, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-6"
                >
                  <div className="w-6 h-6 bg-[#FF6B35] flex items-center justify-center flex-shrink-0 relative z-10">
                    <Flame className="w-3 h-3 text-white" />
                  </div>
                  <div className="pt-0.5">
                    <span className="font-handwritten text-xl text-[#FF6B35]">{milestone.year}</span>
                    <p className="text-[#FFF8F0] text-lg">{milestone.event}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#FF6B35]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Flame className="w-12 h-12 text-white mx-auto mb-6" />
            <h2 className="font-display text-4xl md:text-5xl text-white mb-6">
              Sé Parte de Nuestra Historia
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Visítanos hoy y experimenta la diferencia Simmer Down.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/menu"
                className="flex items-center gap-2 bg-[#2D2A26] hover:bg-[#1F1D1A] text-white px-8 py-4 font-semibold transition-colors min-h-[56px]"
              >
                Ordenar Ahora
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/locations"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-8 py-4 font-semibold transition-colors min-h-[56px]"
              >
                Encontrar Ubicación
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
