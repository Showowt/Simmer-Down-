import type { Metadata } from "next";
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Nuestra Historia — 14 Años de Pizza Artesanal en El Salvador",
  description:
    "Desde 2012, Simmer Down ha sido el restaurante de pizza artesanal líder en El Salvador. 14 años de tradición, horno de leña, ingredientes premium y una filosofía gastro-musical que nos convierte en más que un restaurante.",
  keywords: [
    "historia Simmer Down",
    "mejor restaurante El Salvador historia",
    "pizza artesanal tradición",
    "restaurante más antiguo Santa Ana",
    "gastronomía El Salvador",
    "horno de leña tradición",
    "restaurante familiar El Salvador",
  ],
  alternates: {
    canonical: "https://simmerdownsv.com/about",
  },
  openGraph: {
    title: "Simmer Down — 14 Años Creando la Mejor Pizza de El Salvador",
    description:
      "Hay lugares que se visitan. Y hay lugares que se recuerdan. Simmer Down es parte de la memoria gastronómica de El Salvador.",
    images: [
      {
        url: "/og/about.jpg",
        width: 1200,
        height: 630,
        alt: "Simmer Down — 14 años de historia gastronómica en El Salvador",
      },
    ],
    url: "https://simmerdownsv.com/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "14 Años de Historia | Simmer Down El Salvador",
    description: "Desde 2012 — pizza de horno de leña, experiencias gastro-musicales, 5 ubicaciones.",
    images: ["/og/about.jpg"],
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Inicio", url: "https://simmerdownsv.com" },
    { name: "Nuestra Historia", url: "https://simmerdownsv.com/about" },
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
