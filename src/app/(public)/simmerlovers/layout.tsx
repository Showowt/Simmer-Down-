import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simmer Lovers — Programa de Lealtad y Recompensas",
  description:
    "Únete a Simmer Lovers, el programa de lealtad de Simmer Down. Gana puntos con cada visita, accede a beneficios exclusivos, regalos de cumpleaños, descuentos VIP y acceso anticipado a eventos. La mejor forma de disfrutar pizza en El Salvador.",
  keywords: [
    "programa lealtad restaurante El Salvador",
    "Simmer Lovers",
    "descuentos pizza El Salvador",
    "beneficios restaurante El Salvador",
    "puntos restaurante",
    "programa VIP restaurante",
    "recompensas Simmer Down",
  ],
  alternates: {
    canonical: "https://simmerdownsv.com/simmerlovers",
  },
  openGraph: {
    title: "Simmer Lovers — Gana Puntos con Cada Pizza",
    description:
      "Programa de lealtad: puntos, recompensas exclusivas, beneficios VIP y acceso a eventos.",
    images: [
      {
        url: "/og/simmerlovers.jpg",
        width: 1200,
        height: 630,
        alt: "Simmer Lovers — Programa de Lealtad Simmer Down",
      },
    ],
    url: "https://simmerdownsv.com/simmerlovers",
  },
  twitter: {
    card: "summary_large_image",
    title: "Simmer Lovers | Gana Puntos con Cada Visita",
    description: "Programa de lealtad con recompensas, descuentos VIP y acceso a eventos exclusivos.",
    images: ["/og/simmerlovers.jpg"],
  },
};

export default function SimmerLoversLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
