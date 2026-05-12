import type { Metadata } from "next";
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Eventos y Música en Vivo — Simmer Manía",
  description:
    "Simmer Manía: la programación mensual de música en vivo, jazz nights, tributos, open mics, poesía y salsa en Simmer Down San Benito. El mejor restaurante con música en vivo de El Salvador. Bandas, DJs, cantautores y más.",
  keywords: [
    "música en vivo El Salvador",
    "restaurante con música San Salvador",
    "jazz night El Salvador",
    "eventos restaurante El Salvador",
    "open mic El Salvador",
    "Simmer Manía",
    "salsa night San Salvador",
    "tributos musicales El Salvador",
    "dónde escuchar música en vivo El Salvador",
  ],
  alternates: {
    canonical: "https://simmerdownsv.com/events",
  },
  openGraph: {
    title: "Simmer Manía — Música en Vivo en Simmer Down",
    description:
      "Jazz, tributos, open mics, salsa y más. La mejor programación musical de restaurantes en El Salvador.",
    images: [
      {
        url: "/og/events.jpg",
        width: 1200,
        height: 630,
        alt: "Simmer Manía — Eventos y Música en Vivo en Simmer Down",
      },
    ],
    url: "https://simmerdownsv.com/events",
  },
  twitter: {
    card: "summary_large_image",
    title: "Simmer Manía | Música en Vivo + Pizza Artesanal",
    description: "Jazz nights, tributos, open mics y más en Simmer Down San Benito.",
    images: ["/og/events.jpg"],
  },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Inicio", url: "https://simmerdownsv.com" },
    { name: "Eventos", url: "https://simmerdownsv.com/events" },
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
