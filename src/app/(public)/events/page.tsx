"use client";

import { PartyPopper, Users, Utensils, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useI18n, translations } from "@/lib/i18n";
import {
  EventsList,
  PrivateEventsSection,
  AnimatedHero,
  AnimatedCTA,
} from "@/components/events/EventsClient";

export default function EventsPage() {
  const { t, locale } = useI18n();

  const privateEventTypes = [
    {
      title: t(translations.events.birthdayParties),
      description: t(translations.events.birthdayDesc),
      icon: <PartyPopper className="w-6 h-6 text-[#FF6B35]" />,
    },
    {
      title: t(translations.events.corporateEvents),
      description: t(translations.events.corporateDesc),
      icon: <Users className="w-6 h-6 text-[#FF6B35]" />,
    },
    {
      title: t(translations.events.privateDinners),
      description: t(translations.events.privateDinnersDesc),
      icon: <Utensils className="w-6 h-6 text-[#FF6B35]" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#2D2A26] pt-32 pb-24 lg:pb-0">
      {/* Hero */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 relative">
          <AnimatedHero>
            <p className="text-[#6B6560] text-sm uppercase tracking-[0.2em] mb-4">
              {t(translations.events.uniqueExperiences)}
            </p>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight text-[#FFF8F0] mb-6">
              {t(translations.events.eventsTitle)}
            </h1>
            <p className="text-xl text-[#B8B0A8]">
              {t(translations.events.eventsDesc)}
            </p>
          </AnimatedHero>
        </div>
      </section>

      {/* Events List - Client Component with data fetching */}
      <EventsList />

      {/* Private Events - Client Component with animations */}
      <PrivateEventsSection eventTypes={privateEventTypes} />

      {/* CTA */}
      <section className="py-28 md:py-32 bg-[#252320] border-t border-[#3D3936]/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimatedCTA>
            <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0] mb-6">
              {t(translations.events.dontMiss)}
            </h2>
            <p className="text-xl text-[#B8B0A8] mb-10">
              {t(translations.events.subscribeEvents)}
            </p>
            <Link
              href="/simmerlovers"
              className="inline-flex items-center gap-2 bg-[#FFF8F0] text-[#1F1D1A] hover:bg-white px-10 py-5 text-xl font-semibold transition-all min-h-[56px]"
            >
              {t(translations.events.joinSimmerLovers)}
              <ArrowRight className="w-6 h-6" />
            </Link>
          </AnimatedCTA>
        </div>
      </section>
    </div>
  );
}
