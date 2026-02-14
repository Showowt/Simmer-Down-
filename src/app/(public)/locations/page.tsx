import { Flame } from "lucide-react";
import Link from "next/link";
import {
  LocationCard,
  AnimatedHero,
  AnimatedCTA,
} from "@/components/locations/LocationsClient";

// Icon types are strings that map to Lucide icons in the client component
type IconType = "coffee" | "mountain" | "music" | "waves";

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
  iconType: IconType;
  isOpen: boolean;
  rating: number;
  reviews: number;
  mapUrl: string;
}> = [
  {
    id: "santa-ana",
    name: "Santa Ana",
    vibe: "El Origen",
    personality:
      "Tradicion, historia y el encanto de una ciudad que respira cultura",
    description:
      "Frente a la historica catedral de Santa Ana, donde todo comenzo hace 12 anos. El lugar donde nacio la magia Simmer Down.",
    address: "1ra Calle Pte y Callejuela Sur Catedral",
    city: "Santa Ana, El Salvador",
    phone: "+503 2445-5999",
    hours: {
      weekday: "Dom-Jue: 11:00 AM - 9:00 PM",
      weekend: "Vie-Sab: 11:00 AM - 10:00 PM",
    },
    features: ["Vista a la Catedral", "Musica en Vivo", "Terraza"],
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    iconType: "coffee",
    isOpen: true,
    rating: 4.9,
    reviews: 2100,
    mapUrl: "https://maps.google.com/?q=Santa+Ana+Cathedral+El+Salvador",
  },
  {
    id: "coatepeque",
    name: "Lago de Coatepeque",
    vibe: "Vista al Lago",
    personality: "Una experiencia frente a una maravilla natural del mundo",
    description:
      "Contempla el atardecer sobre el lago volcanico mientras disfrutas de nuestras especialidades. Una experiencia unica en El Salvador.",
    address: "Calle Principal al Lago #119",
    city: "Lago de Coatepeque, El Salvador",
    phone: "+503 6831-6907",
    hours: {
      weekday: "Dom-Jue: 11:00 AM - 8:00 PM",
      weekend: "Vie-Sab: 11:00 AM - 9:00 PM",
    },
    features: ["Vista al Lago", "Atardeceres", "Zona Privada"],
    image:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80",
    iconType: "mountain",
    isOpen: true,
    rating: 4.9,
    reviews: 1850,
    mapUrl: "https://maps.google.com/?q=Lago+de+Coatepeque+El+Salvador",
  },
  {
    id: "san-benito",
    name: "San Benito",
    vibe: "Urbano y Vibrante",
    personality: "El punto urbano, vibrante y cosmopolita de San Salvador",
    description:
      "En el corazon de la Zona Rosa, ideal para encuentros, cenas de negocios y noches largas con buena musica.",
    address: "Boulevard del Hipodromo, Colonia San Benito",
    city: "San Salvador, El Salvador",
    phone: "+503 7487-7792",
    hours: {
      weekday: "Lun-Dom: 11:00 AM - 11:00 PM",
      weekend: "Viernes y Sabados hasta medianoche",
    },
    features: ["Zona Rosa", "Jazz Nights", "Valet Parking"],
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    iconType: "music",
    isOpen: true,
    rating: 4.8,
    reviews: 1420,
    mapUrl: "https://maps.google.com/?q=San+Benito+San+Salvador",
  },
  {
    id: "juayua",
    name: "Simmer Garden",
    vibe: "Ruta de las Flores",
    personality: "La Ruta de las Flores en su maxima expresion",
    description:
      "Rodeado de naturaleza y el encanto del pueblo magico de Juayua. Perfecto para escapadas de fin de semana.",
    address: "Kilometro 91.5, San Jose La Majada",
    city: "Juayua, Sonsonate, El Salvador",
    phone: "+503 6990-4674",
    hours: {
      weekday: "Vie-Dom: 11:00 AM - 8:00 PM",
      weekend: "Cerrado Lun-Jue",
    },
    features: ["Jardin", "Cafe de Altura", "Montana"],
    image:
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80",
    iconType: "coffee",
    isOpen: false,
    rating: 4.9,
    reviews: 980,
    mapUrl: "https://maps.google.com/?q=Juayua+El+Salvador",
  },
  {
    id: "surf-city",
    name: "Surf City",
    vibe: "Frente al Mar",
    personality: "Atardecer, surf y libertad que solo la costa ofrece",
    description:
      "Nuestra ubicacion mas nueva, donde el oceano y la pizza se encuentran. El spot perfecto despues de surfear.",
    address: "Hotel Casa Santa Emilia, Conchalio 2",
    city: "La Libertad, El Salvador",
    phone: "+503 7576-4655",
    hours: {
      weekday: "Mie-Dom: 12:00 PM - 8:00 PM",
      weekend: "Happy Hour 4-7 PM",
    },
    features: ["Vista al Mar", "Surf Vibes", "Cocteles"],
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    iconType: "waves",
    isOpen: true,
    rating: 4.8,
    reviews: 760,
    mapUrl: "https://maps.google.com/?q=El+Tunco+El+Salvador",
  },
];

export default function LocationsPage() {
  return (
    <div className="min-h-screen bg-[#2D2A26] pt-24">
      {/* Hero */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-oven-warmth opacity-50" />
        <div className="max-w-6xl mx-auto px-6 relative">
          <AnimatedHero>
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              5 destinos unicos
            </p>
            <h1 className="font-display text-4xl md:text-6xl text-[#FFF8F0] mb-6">
              Nuestras Ubicaciones
            </h1>
            <p className="text-xl text-[#B8B0A8]">
              Cada ubicacion cuenta su propia historia. Encuentra tu favorita.
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
      <section className="py-24 bg-[#FF6B35]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimatedCTA>
            <Flame className="w-12 h-12 text-white mx-auto mb-6" />
            <h2 className="font-display text-4xl md:text-5xl text-white mb-6">
              Te Esperamos
            </h2>
            <p className="text-xl text-white/90 mb-10">
              12 anos de historia. 5 destinos unicos. Una sola experiencia
              Simmer Down.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-[#2D2A26] hover:bg-[#1F1D1A] text-white px-10 py-5 text-xl font-semibold transition-all min-h-[56px]"
            >
              Ver Menu
            </Link>
          </AnimatedCTA>
        </div>
      </section>
    </div>
  );
}
