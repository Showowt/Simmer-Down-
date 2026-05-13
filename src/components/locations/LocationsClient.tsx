"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  Star,
  Coffee,
  Mountain,
  Music,
  Waves,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { LucideIcon } from "lucide-react";
import { useI18n, translations } from "@/lib/i18n";

const iconMap: Record<string, LucideIcon> = {
  coffee: Coffee,
  mountain: Mountain,
  music: Music,
  waves: Waves,
};

interface Location {
  id: string;
  name: string;
  vibe: string;
  personality: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  hours: {
    weekday: string;
    weekend: string;
  };
  features: string[];
  image: string;
  gallery?: string[];
  iconType: string;
  isOpen: boolean;
  rating: number;
  reviews: number;
  mapUrl: string;
}

interface LocationCardProps {
  location: Location;
  index: number;
}

export function LocationCard({ location, index }: LocationCardProps) {
  const { t } = useI18n();
  const Icon = iconMap[location.iconType] || Coffee;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`}>
        {/* Main Image */}
        <div className={`relative ${index % 2 === 1 ? "lg:order-2" : ""}`}>
          <div className="aspect-[4/3] overflow-hidden relative">
            <Image
              src={location.image}
              alt={`${location.name} — restaurante Simmer Down`}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          {/* Rating Badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1.5 bg-[#1F1D1A]/80 backdrop-blur-sm text-white text-sm px-3 py-2">
              <Star className="w-3.5 h-3.5 text-[#C9A84C] fill-[#C9A84C]" />
              {location.rating}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className={index % 2 === 1 ? "lg:order-1" : ""}>
          <div className="mb-6">
            <p className="text-[#6B6560] text-sm uppercase tracking-[0.2em] mb-2">
              {location.vibe}
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-[#FFF8F0] tracking-tight">
              {location.name}
            </h2>
          </div>

          <p className="text-[#B8B0A8] mb-6 text-lg leading-relaxed">
            {location.description}
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-6">
            {location.features.map((feature) => (
              <span
                key={feature}
                className="bg-[#252320] border border-[#3D3936] text-[#B8B0A8] px-4 py-2 text-sm"
              >
                {feature}
              </span>
            ))}
          </div>

          {/* Details */}
          <div className="space-y-4 mb-8 bg-[#252320] border border-[#3D3936] p-6">
            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-[#C9A84C] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[#FFF8F0]">{location.address}</p>
                <p className="text-[#6B6560] text-sm">{location.city}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="w-5 h-5 text-[#C9A84C] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[#FFF8F0]">{location.hours.weekday}</p>
                <p className="text-[#6B6560] text-sm">{location.hours.weekend}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Phone className="w-5 h-5 text-[#C9A84C] flex-shrink-0" />
              <a
                href={`tel:${location.phone.replace(/\s/g, "")}`}
                className="text-[#FFF8F0] hover:text-[#C9A84C] transition-colors"
              >
                {location.phone}
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/reservations"
              className="inline-flex items-center justify-center gap-2 bg-[#FFF8F0] text-[#1F1D1A] hover:bg-white px-6 py-3.5 text-sm uppercase tracking-[0.1em] font-semibold transition-all min-h-[48px]"
            >
              {t(translations.locations.reserveTable)}
            </Link>
            <a
              href={location.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#252320] hover:bg-[#3D3936] text-[#FFF8F0] px-6 py-3.5 text-sm font-semibold border border-[#3D3936] transition-all min-h-[48px]"
            >
              <Navigation className="w-4 h-4" />
              {t(translations.locations.directions)}
            </a>
            <a
              href={`tel:${location.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center justify-center gap-2 bg-[#252320] hover:bg-[#3D3936] text-[#FFF8F0] px-6 py-3.5 text-sm font-semibold border border-[#3D3936] transition-all min-h-[48px]"
            >
              <Phone className="w-4 h-4" />
              {t(translations.locations.callNow)}
            </a>
          </div>
        </div>
      </div>

      {/* Photo Gallery — below the main card */}
      {location.gallery && location.gallery.length > 0 && (
        <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {location.gallery.map((img, i) => (
            <div key={i} className="aspect-square overflow-hidden relative group">
              <Image
                src={img}
                alt={`${location.name} ${i + 1}`}
                fill
                sizes="(max-width: 640px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function AnimatedHero({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center max-w-3xl mx-auto"
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCTA({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  );
}
