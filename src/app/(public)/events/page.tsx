"use client";

import { PartyPopper, Users, Utensils, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
      icon: <PartyPopper className="w-6 h-6 text-[#E85D04]" />,
    },
    {
      title: t(translations.events.corporateEvents),
      description: t(translations.events.corporateDesc),
      icon: <Users className="w-6 h-6 text-[#E85D04]" />,
    },
    {
      title: t(translations.events.privateDinners),
      description: t(translations.events.privateDinnersDesc),
      icon: <Utensils className="w-6 h-6 text-[#E85D04]" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 lg:pb-0">
      {/* Hero */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Ambient SIMMER MANIA imago — faint brand crest behind the hero */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <Image
            src="/logos/simmer-mania-imago.png"
            alt=""
            width={1080}
            height={1080}
            className="w-[540px] max-w-[92vw] opacity-[0.05] select-none"
          />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <AnimatedHero>
            {/* SIMMER MANIA — flagship live-events program brand lockup */}
            <div className="relative mx-auto mb-6 w-[min(78vw,440px)] aspect-[1080/327] drop-shadow-[0_4px_24px_rgba(232,93,4,0.25)]">
              <Image
                src="/logos/simmer-mania-wordmark.png"
                alt="Simmer Manía"
                fill
                priority
                sizes="(max-width: 768px) 78vw, 440px"
                className="object-contain"
              />
            </div>
            <p className="text-white/50 text-sm uppercase tracking-[0.2em] mb-4">
              {t(translations.events.uniqueExperiences)}
            </p>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight text-white mb-6">
              {t(translations.events.eventsTitle)}
            </h1>
            <p className="text-xl text-white/60">
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
      <section className="py-28 md:py-32 bg-[#1A1A1A] border-t border-white/10 relative overflow-hidden">
        {/* Ambient SIMMER MANIA imago — faint brand crest bookending the page */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <Image
            src="/logos/simmer-mania-imago.png"
            alt=""
            width={1080}
            height={1080}
            className="w-[520px] max-w-[90vw] opacity-[0.055] select-none"
          />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <AnimatedCTA>
            <h2 className="font-display text-4xl md:text-5xl text-white mb-6">
              {t(translations.events.dontMiss)}
            </h2>
            <p className="text-xl text-white/60 mb-10">
              {t(translations.events.subscribeEvents)}
            </p>
            <Link
              href="/simmerlovers"
              className="inline-flex items-center gap-2 bg-white text-[#0A0A0A] hover:bg-white px-10 py-5 text-xl font-semibold transition-all min-h-[56px]"
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
