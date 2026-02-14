import { Music, PartyPopper, Users, Utensils, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  EventsList,
  PrivateEventsSection,
  AnimatedHero,
  AnimatedCTA,
} from "@/components/events/EventsClient";

const privateEventTypes = [
  {
    title: "Fiestas de Cumpleanos",
    description:
      "Haz tu cumpleanos inolvidable con menus personalizados y decoraciones.",
    icon: <PartyPopper className="w-6 h-6 text-[#FF6B35]" />,
  },
  {
    title: "Eventos Corporativos",
    description:
      "Team building, entretenimiento de clientes o celebraciones de oficina.",
    icon: <Users className="w-6 h-6 text-[#FF6B35]" />,
  },
  {
    title: "Cenas Privadas",
    description:
      "Uso exclusivo de nuestros salones privados para reuniones intimas.",
    icon: <Utensils className="w-6 h-6 text-[#FF6B35]" />,
  },
];

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-[#2D2A26] pt-24">
      {/* Hero */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-oven-warmth opacity-50" />
        <div className="max-w-6xl mx-auto px-6 relative">
          <AnimatedHero>
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              Experiencias Unicas
            </p>
            <h1 className="font-display text-4xl md:text-6xl text-[#FFF8F0] mb-6">
              Eventos y Experiencias
            </h1>
            <p className="text-xl text-[#B8B0A8]">
              Desde musica en vivo hasta talleres de pizza, siempre hay algo
              emocionante sucediendo en Simmer Down.
            </p>
          </AnimatedHero>
        </div>
      </section>

      {/* Events List - Client Component with data fetching */}
      <EventsList />

      {/* Private Events - Client Component with animations */}
      <PrivateEventsSection eventTypes={privateEventTypes} />

      {/* CTA */}
      <section className="py-24 bg-[#FF6B35]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimatedCTA>
            <Music className="w-12 h-12 text-white mx-auto mb-6" />
            <h2 className="font-display text-4xl md:text-5xl text-white mb-6">
              No Te Pierdas Nada
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Suscribete para recibir notificaciones de proximos eventos.
            </p>
            <Link
              href="/simmerlovers"
              className="inline-flex items-center gap-2 bg-[#2D2A26] hover:bg-[#1F1D1A] text-white px-10 py-5 text-xl font-semibold transition-all min-h-[56px]"
            >
              Unete a SimmerLovers
              <ArrowRight className="w-6 h-6" />
            </Link>
          </AnimatedCTA>
        </div>
      </section>
    </div>
  );
}
