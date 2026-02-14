"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  Heart,
  Star,
  Coffee,
  Mountain,
  Music,
  Waves,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAnimaStore } from "@/store/anima";
import { useState, useEffect } from "react";
import { LucideIcon } from "lucide-react";

// Map of icon type strings to Lucide components
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
  const { memory, setPreferredLocation } = useAnimaStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSetFavorite = (locationId: string) => {
    setPreferredLocation(locationId);
  };

  const Icon = iconMap[location.iconType] || Coffee;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`}
    >
      {/* Image */}
      <div className={`relative ${index % 2 === 1 ? "lg:order-2" : ""}`}>
        <div className="aspect-[4/3] overflow-hidden relative">
          <Image
            src={location.image}
            alt={location.name}
            fill
            className="object-cover"
          />
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 left-4 flex gap-2">
          {location.isOpen ? (
            <span className="inline-flex items-center gap-2 bg-[#4CAF50] text-white text-sm font-semibold px-4 py-2">
              <span className="w-2 h-2 bg-white animate-pulse" />
              Abierto
            </span>
          ) : (
            <span className="bg-[#6B6560] text-white text-sm font-semibold px-4 py-2">
              Cerrado
            </span>
          )}
          <span className="inline-flex items-center gap-1 bg-[#2D2A26]/80 text-white text-sm px-3 py-2">
            <Star className="w-4 h-4 text-[#FF6B35] fill-[#FF6B35]" />
            {location.rating}
          </span>
        </div>

        {/* Favorite Button */}
        {mounted && (
          <button
            onClick={() => handleSetFavorite(location.id)}
            className={`absolute top-4 right-4 w-12 h-12 flex items-center justify-center transition-colors ${
              memory.preferredLocation === location.id
                ? "bg-[#FF6B35] text-white"
                : "bg-[#2D2A26]/80 text-[#B8B0A8] hover:text-[#FF6B35]"
            }`}
            aria-label={
              memory.preferredLocation === location.id
                ? "Tu ubicacion favorita"
                : "Marcar como favorita"
            }
          >
            <Heart
              className={`w-6 h-6 ${memory.preferredLocation === location.id ? "fill-white" : ""}`}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className={index % 2 === 1 ? "lg:order-1" : ""}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-[#FF6B35]/10 flex items-center justify-center">
            <Icon className="w-7 h-7 text-[#FF6B35]" />
          </div>
          <div>
            <p className="font-handwritten text-xl text-[#FF6B35]">
              {location.vibe}
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-[#FFF8F0]">
              {location.name}
            </h2>
          </div>
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
            <MapPin className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[#FFF8F0]">{location.address}</p>
              <p className="text-[#6B6560] text-sm">{location.city}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Clock className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[#FFF8F0]">{location.hours.weekday}</p>
              <p className="text-[#6B6560] text-sm">{location.hours.weekend}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Phone className="w-5 h-5 text-[#FF6B35] flex-shrink-0" />
            <a
              href={`tel:${location.phone.replace(/\s/g, "")}`}
              className="text-[#FFF8F0] hover:text-[#FF6B35] transition-colors"
            >
              {location.phone}
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          <Link
            href="/menu"
            className="inline-flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-6 py-4 font-semibold transition-all min-h-[56px]"
          >
            Ordenar Aqui
          </Link>
          <a
            href={location.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#252320] hover:bg-[#3D3936] text-[#FFF8F0] px-6 py-4 font-semibold border border-[#3D3936] transition-all min-h-[56px]"
          >
            <Navigation className="w-5 h-5" />
            Como Llegar
          </a>
          <a
            href={`tel:${location.phone.replace(/\s/g, "")}`}
            className="inline-flex items-center justify-center gap-2 bg-[#252320] hover:bg-[#3D3936] text-[#FFF8F0] px-6 py-4 font-semibold border border-[#3D3936] transition-all min-h-[56px]"
          >
            <Phone className="w-5 h-5" />
            Llamar
          </a>
        </div>
      </div>
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
