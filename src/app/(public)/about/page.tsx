"use client";

import Image from "next/image";
import { useI18n, translations } from "@/lib/i18n";
import {
  Flame,
  ArrowRight,
  Quote,
} from "lucide-react";
import Link from "next/link";
import {
  AnimatedSection,
  AnimatedOnView,
  AnimatedMilestone,
  AnimatedCTA,
} from "@/components/about/AnimatedSection";

export default function AboutPage() {
  const { t, locale } = useI18n();

  const milestones = [
    {
      year: "2013",
      event:
        locale === "es"
          ? "Simmer Down abre en Santa Ana, frente a la Catedral"
          : "Simmer Down opens in Santa Ana, facing the Cathedral",
    },
    {
      year: "2016",
      event:
        locale === "es"
          ? "Segunda ubicación en Lago de Coatepeque"
          : "Second location at Lago de Coatepeque",
    },
    {
      year: "2019",
      event:
        locale === "es"
          ? "Expansion a San Benito, San Salvador"
          : "Expansion to San Benito, San Salvador",
    },
    {
      year: "2022",
      event:
        locale === "es"
          ? "Simmer Garden abre en Juayua, Ruta de las Flores"
          : "Simmer Garden opens in Juayua, Ruta de las Flores",
    },
    {
      year: "2024",
      event:
        locale === "es"
          ? "Surf City: nuestra quinta ubicación frente al mar"
          : "Surf City: our fifth location by the sea",
    },
  ];

  return (
    <div className="min-h-screen bg-[#2D2A26] pt-32">
      {/* Hero */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/heroes/homepage-pizzas.jpg"
            alt="Pizzas artesanales Simmer Down"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-[#2D2A26]/90" />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative">
          <AnimatedSection className="text-center max-w-3xl mx-auto">
            <p className="text-[#6B6560] text-sm uppercase tracking-[0.2em] mb-4">
              {t(translations.about.ourStory)}
            </p>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight text-[#FFF8F0] mb-6">
              {t(translations.about.tagline)}
            </h1>
            <p className="text-xl text-[#B8B0A8]">
              {t(translations.about.subtitle)}
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Story */}
      <section className="py-28 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimatedOnView direction="left">
              <p className="text-[#6B6560] text-sm uppercase tracking-[0.2em] mb-4">
                {t(translations.about.since2013)}
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-[#FFF8F0] mb-6">
                {t(translations.about.ourStory)}
              </h2>
              <div className="space-y-4 text-[#B8B0A8] text-lg leading-relaxed">
                <p>
                  {locale === "es" ? (
                    <>
                      Nacimos en{" "}
                      <strong className="text-[#FFF8F0]">Santa Ana</strong>, frente
                      a su histórica catedral, como un punto de encuentro donde el
                      tiempo baja la velocidad, la conversación fluye y la comida se
                      disfruta sin prisa.
                    </>
                  ) : (
                    <>
                      We were born in{" "}
                      <strong className="text-[#FFF8F0]">Santa Ana</strong>, facing
                      its historic cathedral, as a meeting point where time slows
                      down, conversation flows and food is enjoyed without rush.
                    </>
                  )}
                </p>
                <p>
                  {locale === "es"
                    ? "Desde entonces, nos hemos convertido en un referente gastronómico que acompaña viajes, celebraciones, reencuentros y primeras veces. Para muchos, Simmer Down es nostalgia. Para otros, es un descubrimiento."
                    : "Since then, we have become a gastronomic landmark that accompanies trips, celebrations, reunions and first times. For many, Simmer Down is nostalgia. For others, it's a discovery."}
                </p>
                <p>
                  {locale === "es"
                    ? "Nuestra cocina se inspira en lo artesanal, en el fuego lento y en recetas que respetan el ingrediente y celebran el sabor. Pizzas artesanales, pastas, carnes, platos para compartir y opciones para todos los gustos."
                    : "Our kitchen is inspired by the artisanal, by slow fire and recipes that respect the ingredient and celebrate flavor. Artisan pizzas, pastas, meats, sharing plates and options for every taste."}
                </p>
                <p className="italic text-[#FFF8F0]">
                  {locale === "es"
                    ? "Pero Simmer Down no es solo lo que servimos en la mesa. Es el ambiente. Es la música. Es la vista. Es la sensacion de estar exactamente donde debes estar."
                    : "But Simmer Down is not just what we serve at the table. It's the atmosphere. It's the music. It's the view. It's the feeling of being exactly where you should be."}
                </p>
              </div>
            </AnimatedOnView>

            <AnimatedOnView
              direction="right"
              className="grid grid-cols-2 gap-4"
            >
              <div className="relative h-48">
                <Image
                  src="/images/menu/pizza-maradona.jpg"
                  alt="Pizza La Maradona — chorizo argentino y chimichurri"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative h-48 mt-8">
                <Image
                  src="/images/locations/gallery-santa-ana/santa-ana-awards.jpg"
                  alt="Simmer Down Santa Ana — TripAdvisor #1 Travellers Choice"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative h-48">
                <Image
                  src="/images/menu/molcajete-coulotte.jpg"
                  alt="Molcajete Coulotte — corte de res con tuétano"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative h-48 mt-8">
                <Image
                  src="/images/locations/santa-ana-interior.jpg"
                  alt="Interior del restaurante Simmer Down Santa Ana"
                  fill
                  className="object-cover"
                />
              </div>
            </AnimatedOnView>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-28 md:py-32 bg-[#252320] border-y border-[#3D3936]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Quote className="w-12 h-12 text-[#FF6B35] mx-auto mb-6" />
          <blockquote className="font-display text-2xl md:text-3xl text-[#FFF8F0] italic mb-6">
            {locale === "es"
              ? "\u201CCreemos que la mejor gastronomia no solo alimenta: conecta, emociona y permanece. Por eso cuidamos cada detalle, para que cada visita se sienta familiar.\u201D"
              : "\u201CWe believe the best gastronomy doesn\u2019t just nourish: it connects, moves and endures. That\u2019s why we care for every detail, so every visit feels like family.\u201D"}
          </blockquote>
          <cite className="text-[#6B6560] font-display italic text-lg">
            {locale === "es"
              ? "- Simmer Down, 14 años de historia"
              : "- Simmer Down, 14 years of history"}
          </cite>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-28 md:py-32">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[#6B6560] text-sm uppercase tracking-[0.2em] mb-4">
              {t(translations.about.ourPath)}
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0]">
              {t(translations.about.milestones)}
            </h2>
          </div>

          <div className="relative">
            {/* Line */}
            <div className="absolute left-3 top-3 bottom-3 w-px bg-[#3D3936]" />

            <div className="space-y-8">
              {milestones.map((milestone, i) => (
                <AnimatedMilestone
                  key={i}
                  year={milestone.year}
                  event={milestone.event}
                  icon={<Flame className="w-3 h-3 text-white" />}
                  index={i}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 md:py-32 bg-[#252320] border-t border-[#3D3936]/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimatedCTA>
            <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0] mb-6">
              {t(translations.about.bePartOfStory)}
            </h2>
            <p className="text-xl text-[#B8B0A8] mb-10">
              {t(translations.about.visitToday)}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/menu"
                className="flex items-center gap-2 bg-[#FFF8F0] text-[#1F1D1A] hover:bg-white px-8 py-4 font-semibold transition-colors min-h-[56px]"
              >
                {t(translations.nav.orderNow)}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/locations"
                className="flex items-center gap-2 border border-[#3D3936] hover:border-[#6B6560] text-[#FFF8F0] px-8 py-4 font-semibold transition-colors min-h-[56px]"
              >
                {t(translations.about.findLocation)}
              </Link>
            </div>
          </AnimatedCTA>
        </div>
      </section>
    </div>
  );
}
