import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eventos & Experiencias",
  description:
    "Simmer Manía — programación mensual de música en vivo, tributos, open mics, poesía y salsa en Simmer Down San Benito. Bandas, DJs, cantautores, cines y más.",
  openGraph: {
    title: "Simmer Down · Eventos",
    description:
      "Música en vivo, open mics, salsa, tributos, poesía y más. Consulta la programación del mes.",
    images: ["/og/events.jpg"],
  },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
