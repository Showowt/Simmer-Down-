import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simmer Lovers — Programa de Lealtad",
  description:
    "Puntos con cada pedido. Recompensas exclusivas, beneficios por tier, regalos de cumpleaños y acceso a eventos. El programa de lealtad de Simmer Down.",
  openGraph: {
    title: "Simmer Lovers · Programa de Lealtad",
    description:
      "Puntos, recompensas, beneficios VIP y acceso a eventos exclusivos.",
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
