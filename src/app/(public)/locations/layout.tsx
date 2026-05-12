import type { Metadata } from "next";
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "5 Ubicaciones — Santa Ana, San Benito, Coatepeque, Juayúa, Surf City",
  description:
    "Encuentra tu Simmer Down más cercano. 5 ubicaciones en El Salvador: Santa Ana (el original), Lago de Coatepeque (vista al lago), San Benito/San Salvador (Zona Rosa), Simmer Garden/Juayúa (Ruta de las Flores), Surf City (frente al mar). Horarios, direcciones y teléfonos.",
  keywords: [
    "Simmer Down ubicaciones",
    "pizzería Santa Ana El Salvador",
    "restaurante Lago de Coatepeque",
    "restaurante Zona Rosa San Salvador",
    "pizza Surf City El Tunco",
    "restaurante Juayúa Ruta de las Flores",
    "restaurante San Benito San Salvador",
    "dónde comer pizza El Salvador",
    "mejores restaurantes El Salvador ubicaciones",
    "pizza cerca de mí El Salvador",
  ],
  alternates: {
    canonical: "https://simmerdownsv.com/locations",
  },
  openGraph: {
    title: "Simmer Down — 5 Ubicaciones en El Salvador",
    description:
      "Santa Ana ⭐4.9 | Coatepeque ⭐4.9 | San Benito ⭐4.8 | Juayúa ⭐4.9 | Surf City ⭐4.8. Encuentra tu favorita.",
    images: [
      {
        url: "/og/locations.jpg",
        width: 1200,
        height: 630,
        alt: "Simmer Down — 5 Ubicaciones de Pizza Artesanal en El Salvador",
      },
    ],
    url: "https://simmerdownsv.com/locations",
  },
  twitter: {
    card: "summary_large_image",
    title: "5 Ubicaciones Simmer Down | Pizza en todo El Salvador",
    description: "Santa Ana, Coatepeque, San Salvador, Juayúa y Surf City. Todas con ⭐4.8+",
    images: ["/og/locations.jpg"],
  },
};

export default function LocationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Inicio", url: "https://simmerdownsv.com" },
    { name: "Ubicaciones", url: "https://simmerdownsv.com/locations" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
