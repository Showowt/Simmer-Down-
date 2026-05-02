import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nuestras Ubicaciones",
  description:
    "Santa Ana, San Benito, Lago de Coatepeque, Surf City y Simmer Garden (Juayúa). 5 destinos únicos. Una sola experiencia Simmer Down.",
  openGraph: {
    title: "Simmer Down · 5 Ubicaciones",
    description:
      "Cada ubicación cuenta su propia historia. Encuentra tu favorita.",
    images: ["/og/locations.jpg"],
  },
};

export default function LocationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
