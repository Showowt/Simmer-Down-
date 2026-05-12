import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto — Teléfono, WhatsApp y Direcciones",
  description:
    "Contacta a Simmer Down. Reservaciones, eventos privados, catering y consultas. Santa Ana: +503 2445-5999. San Benito: +503 7487-7792. Coatepeque: +503 6831-6907. WhatsApp disponible.",
  keywords: [
    "contacto Simmer Down",
    "teléfono Simmer Down",
    "WhatsApp Simmer Down",
    "dirección pizzería El Salvador",
    "eventos privados restaurante El Salvador",
    "catering El Salvador",
    "contacto restaurante Santa Ana",
  ],
  alternates: {
    canonical: "https://simmerdownsv.com/contact",
  },
  openGraph: {
    title: "Contacto | Simmer Down El Salvador",
    description: "Reservaciones, eventos privados, catering. Llámanos o escríbenos por WhatsApp.",
    images: [
      {
        url: "/og/contact.jpg",
        width: 1200,
        height: 630,
        alt: "Contacto Simmer Down — La Mejor Pizza de El Salvador",
      },
    ],
    url: "https://simmerdownsv.com/contact",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contacto Simmer Down | WhatsApp + Teléfono",
    description: "Reservaciones y eventos. +503 2445-5999 | WhatsApp disponible.",
    images: ["/og/contact.jpg"],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
