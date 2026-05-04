"use client";

import Link from "next/link";
import { useI18n, translations } from "@/lib/i18n";
import {
  LocationCard,
  AnimatedHero,
  AnimatedCTA,
} from "@/components/locations/LocationsClient";

// Icon types are strings that map to Lucide icons in the client component
type IconType = "coffee" | "mountain" | "music" | "waves";

export default function LocationsPage() {
  const { t, locale } = useI18n();

  const locations: Array<{
    id: string;
    name: string;
    vibe: string;
    personality: string;
    description: string;
    address: string;
    city: string;
    phone: string;
    hours: { weekday: string; weekend: string };
    features: string[];
    image: string;
    gallery?: string[];
    iconType: IconType;
    isOpen: boolean;
    rating: number;
    reviews: number;
    mapUrl: string;
  }> = [
    {
      id: "santa-ana",
      name: "Santa Ana",
      vibe: locale === "es" ? "El Origen" : "The Origin",
      personality:
        locale === "es"
          ? "Tradición, historia y el encanto de una ciudad que respira cultura"
          : "Tradition, history and the charm of a city that breathes culture",
      description:
        locale === "es"
          ? "Frente a la histórica catedral de Santa Ana, donde todo comenzó hace 14 años. El lugar donde nació la magia Simmer Down."
          : "Facing the historic Santa Ana cathedral, where it all began 14 years ago. The place where the Simmer Down magic was born.",
      address: "1ra Calle Pte y Callejuela Sur Catedral",
      city: "Santa Ana, El Salvador",
      phone: "+503 2445-5999",
      hours: {
        weekday:
          locale === "es"
            ? "Dom-Jue: 11:00 AM - 9:00 PM"
            : "Sun-Thu: 11:00 AM - 9:00 PM",
        weekend:
          locale === "es"
            ? "Vie-Sab: 11:00 AM - 10:00 PM"
            : "Fri-Sat: 11:00 AM - 10:00 PM",
      },
      features:
        locale === "es"
          ? ["Vista a la Catedral", "Música en Vivo", "Terraza"]
          : ["Cathedral View", "Live Music", "Terrace"],
      image: "/images/locations/gallery-santa-ana/santa-ana-2.jpg",
      gallery: [
        "/images/locations/gallery-santa-ana/santa-ana-1.jpg",
        "/images/locations/gallery-santa-ana/santa-ana-2.jpg",
        "/images/locations/gallery-santa-ana/santa-ana-3.jpg",
      ],
      iconType: "coffee",
      isOpen: true,
      rating: 4.9,
      reviews: 2100,
      mapUrl: "https://maps.google.com/?q=Santa+Ana+Cathedral+El+Salvador",
    },
    {
      id: "coatepeque",
      name: "Lago de Coatepeque",
      vibe: locale === "es" ? "Vista al Lago" : "Lake View",
      personality:
        locale === "es"
          ? "Una experiencia frente a una maravilla natural del mundo"
          : "An experience facing one of the world's natural wonders",
      description:
        locale === "es"
          ? "Contempla el atardecer sobre el lago volcanico mientras disfrutas de nuestras especialidades. Una experiencia única en El Salvador."
          : "Watch the sunset over the volcanic lake while enjoying our specialties. A unique experience in El Salvador.",
      address: "Calle Principal al Lago #119",
      city: "Lago de Coatepeque, El Salvador",
      phone: "+503 6831-6907",
      hours: {
        weekday:
          locale === "es"
            ? "Dom-Jue: 11:00 AM - 8:00 PM"
            : "Sun-Thu: 11:00 AM - 8:00 PM",
        weekend:
          locale === "es"
            ? "Vie-Sab: 11:00 AM - 9:00 PM"
            : "Fri-Sat: 11:00 AM - 9:00 PM",
      },
      features:
        locale === "es"
          ? ["Vista al Lago", "Atardeceres", "Zona Privada"]
          : ["Lake View", "Sunsets", "Private Area"],
      image: "/images/locations/gallery-coatepeque/coatepeque-2.jpg",
      gallery: [
        "/images/locations/gallery-coatepeque/coatepeque-1.jpg",
        "/images/locations/gallery-coatepeque/coatepeque-2.jpg",
        "/images/locations/gallery-coatepeque/coatepeque-3.jpg",
        "/images/locations/gallery-coatepeque/coatepeque-4.jpg",
      ],
      iconType: "mountain",
      isOpen: true,
      rating: 4.9,
      reviews: 1850,
      mapUrl: "https://maps.google.com/?q=Lago+de+Coatepeque+El+Salvador",
    },
    {
      id: "san-benito",
      name: "San Benito",
      vibe: locale === "es" ? "Urbano y Vibrante" : "Urban & Vibrant",
      personality:
        locale === "es"
          ? "El punto urbano, vibrante y cosmopolita de San Salvador"
          : "The urban, vibrant and cosmopolitan spot in San Salvador",
      description:
        locale === "es"
          ? "En el corazón de la Zona Rosa, ideal para encuentros, cenas de negocios y noches largas con buena música."
          : "In the heart of the Zona Rosa, ideal for meetups, business dinners and long nights with great music.",
      address: "#548, Colonia San Benito",
      city: "San Salvador, El Salvador",
      phone: "+503 7487-7792",
      hours: {
        weekday:
          locale === "es"
            ? "Lun-Dom: 11:00 AM - 11:00 PM"
            : "Mon-Sun: 11:00 AM - 11:00 PM",
        weekend:
          locale === "es"
            ? "Viernes y Sábados hasta medianoche"
            : "Fridays and Saturdays until midnight",
      },
      features:
        locale === "es"
          ? ["Zona Rosa", "Jazz Nights", "Valet Parking"]
          : ["Zona Rosa", "Jazz Nights", "Valet Parking"],
      image: "/images/locations/gallery-san-benito/san-benito-1.jpg",
      gallery: [
        "/images/locations/gallery-san-benito/san-benito-1.jpg",
        "/images/locations/gallery-san-benito/san-benito-2.jpg",
        "/images/locations/gallery-san-benito/san-benito-3.jpg",
        "/images/locations/gallery-san-benito/san-benito-4.jpg",
      ],
      iconType: "music",
      isOpen: true,
      rating: 4.8,
      reviews: 1420,
      mapUrl: "https://maps.google.com/?q=San+Benito+San+Salvador",
    },
    {
      id: "juayua",
      name: "Simmer Garden",
      vibe: locale === "es" ? "Ruta de las Flores" : "Flower Route",
      personality:
        locale === "es"
          ? "La Ruta de las Flores en su máxima expresión"
          : "The Flower Route at its finest",
      description:
        locale === "es"
          ? "Rodeado de naturaleza y el encanto del pueblo magico de Juayua. Perfecto para escapadas de fin de semana."
          : "Surrounded by nature and the charm of the magical town of Juayua. Perfect for weekend getaways.",
      address: "Kilómetro 91.5, San José La Majada",
      city: "Juayua, Sonsonate, El Salvador",
      phone: "+503 6990-4674",
      hours: {
        weekday:
          locale === "es"
            ? "Vie-Dom: 11:00 AM - 8:00 PM"
            : "Fri-Sun: 11:00 AM - 8:00 PM",
        weekend:
          locale === "es" ? "Cerrado Lun-Jue" : "Closed Mon-Thu",
      },
      features:
        locale === "es"
          ? ["Jardín", "Café de Altura", "Montaña"]
          : ["Garden", "Altitude Coffee", "Mountain"],
      image: "/images/locations/gallery-garden/garden-4.jpg",
      gallery: [
        "/images/locations/gallery-garden/garden-1.jpg",
        "/images/locations/gallery-garden/garden-4.jpg",
        "/images/locations/gallery-garden/garden-5.png",
      ],
      iconType: "coffee",
      isOpen: false,
      rating: 4.9,
      reviews: 980,
      mapUrl: "https://maps.google.com/?q=Juayua+El+Salvador",
    },
    {
      id: "surf-city",
      name: "Surf City",
      vibe: locale === "es" ? "Frente al Mar" : "Oceanfront",
      personality:
        locale === "es"
          ? "Atardecer, surf y libertad que solo la costa ofrece"
          : "Sunset, surf and freedom that only the coast offers",
      description:
        locale === "es"
          ? "Nuestra ubicación mas nueva, donde el oceano y la pizza se encuentran. El spot perfecto despues de surfear."
          : "Our newest location, where the ocean and pizza meet. The perfect spot after surfing.",
      address: "Hotel Casa Santa Emilia, Conchalio 2",
      city: "La Libertad, El Salvador",
      phone: "+503 7576-4655",
      hours: {
        weekday:
          locale === "es"
            ? "Mie-Dom: 12:00 PM - 8:00 PM"
            : "Wed-Sun: 12:00 PM - 8:00 PM",
        weekend: "Happy Hour 4-7 PM",
      },
      features:
        locale === "es"
          ? ["Vista al Mar", "Surf Vibes", "Cocteles"]
          : ["Ocean View", "Surf Vibes", "Cocktails"],
      image: "/images/locations/surf-city-exterior.jpg",
      gallery: [
        "/images/locations/gallery-surf-city/surf-city-1.jpg",
        "/images/locations/gallery-surf-city/surf-city-2.jpg",
        "/images/locations/gallery-surf-city/surf-city-3.jpg",
        "/images/locations/gallery-surf-city/surf-city-4.jpg",
      ],
      iconType: "waves",
      isOpen: true,
      rating: 4.8,
      reviews: 760,
      mapUrl: "https://maps.google.com/?q=El+Tunco+El+Salvador",
    },
  ];

  return (
    <div className="min-h-screen bg-[#2D2A26] pt-32">
      {/* Hero */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 relative">
          <AnimatedHero>
            <p className="text-[#6B6560] text-sm uppercase tracking-[0.2em] mb-4">
              {t(translations.locations.uniqueDestinations)}
            </p>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight text-[#FFF8F0] mb-6">
              {t(translations.locations.ourLocations)}
            </h1>
            <p className="text-xl text-[#B8B0A8]">
              {t(translations.locations.subtitle)}
            </p>
          </AnimatedHero>
        </div>
      </section>

      {/* Locations Grid */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="space-y-20">
            {locations.map((location, i) => (
              <LocationCard key={location.id} location={location} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 md:py-32 bg-[#252320] border-t border-[#3D3936]/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimatedCTA>
            <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0] mb-6">
              {t(translations.locations.weWaitForYou)}
            </h2>
            <p className="text-xl text-[#B8B0A8] mb-10">
              {t(translations.locations.ctaDesc)}
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-[#FFF8F0] text-[#1F1D1A] hover:bg-white px-10 py-5 text-xl font-semibold transition-all min-h-[56px]"
            >
              {t(translations.locations.viewMenu)}
            </Link>
          </AnimatedCTA>
        </div>
      </section>
    </div>
  );
}
