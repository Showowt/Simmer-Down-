import type { Metadata } from "next";
import {
  generateMenuSchema,
  generateBreadcrumbSchema,
  SIGNATURE_MENU_ITEMS,
} from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Menú — Pizzas Artesanales de Horno de Leña, Pastas y Cortes",
  description:
    "Menú completo de Simmer Down: pizzas artesanales de horno de leña desde $8.99, pastas frescas, cortes premium, mariscos y cócteles de autor. La mejor comida italiana en El Salvador. Información de alérgenos incluida.",
  keywords: [
    "menú pizza El Salvador",
    "pizza artesanal menú",
    "precios pizza El Salvador",
    "menú restaurante italiano El Salvador",
    "pizza horno de leña precios",
    "mejor pizza Santa Ana",
    "Simmer Down menú",
    "pasta artesanal El Salvador",
    "comida italiana El Salvador",
  ],
  alternates: {
    canonical: "https://simmerdownsv.com/menu",
  },
  openGraph: {
    title: "Menú Simmer Down — Pizzas desde $8.99 | Horno de Leña",
    description:
      "Pizzas artesanales de horno de leña, pastas frescas, cortes premium y mariscos. La mejor relación calidad-precio en restaurantes de El Salvador.",
    images: [
      {
        url: "/og/menu.jpg",
        width: 1200,
        height: 630,
        alt: "Menú Simmer Down — Pizzas Artesanales de Horno de Leña",
      },
    ],
    url: "https://simmerdownsv.com/menu",
  },
  twitter: {
    card: "summary_large_image",
    title: "Menú Simmer Down | Pizza Artesanal desde $8.99",
    description: "Pizzas de horno de leña, pastas, cortes y mariscos. Menú completo con precios.",
    images: ["/og/menu.jpg"],
  },
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  const menuSchema = generateMenuSchema(SIGNATURE_MENU_ITEMS);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Inicio", url: "https://simmerdownsv.com" },
    { name: "Menú", url: "https://simmerdownsv.com/menu" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(menuSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
