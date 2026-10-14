import type { Metadata } from "next";
import { MENU_ITEMS, MENU_CATEGORIES } from "@/lib/data";
import { generateMenuSchema, safeJsonLd } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  // Root template appends "| Simmer Down" — do not repeat the brand here.
  title: "Carta — Pizzas, Cócteles y Cocina de Autor",
  description:
    "La carta completa de Simmer Down: pizzas artesanales al horno de leña, cócteles de autor, cervezas artesanales y platos para compartir en San Benito, San Salvador. Pide para llevar, a domicilio o reserva tu mesa.",
  keywords: [
    "carta Simmer Down",
    "menú restaurante San Salvador",
    "pizzas artesanales El Salvador",
    "cócteles de autor San Salvador",
    "pizza al horno de leña El Salvador",
    "restaurante San Benito",
    "comida a domicilio San Salvador",
  ],
  alternates: {
    canonical: "https://simmerdownsv.com/carta",
  },
  openGraph: {
    title: "Carta — Simmer Down",
    description:
      "Pizzas artesanales, cócteles de autor y cocina para compartir en San Benito, San Salvador.",
    url: "https://simmerdownsv.com/carta",
    images: [
      {
        url: "/og/menu.jpg",
        width: 1200,
        height: 630,
        alt: "La carta de Simmer Down",
      },
    ],
  },
};

// Full menu JSON-LD built from the REAL menu (src/lib/data.ts) — every
// available item with its Spanish name, description and live price, grouped
// by category. This is what lets Google answer "pizza El Salvador precio"
// queries with OUR items instead of an aggregator's copy.
function buildMenuSchemaItems() {
  const categoryName = new Map(
    MENU_CATEGORIES.map((c) => [c.id, c.nameEs || c.name]),
  );
  return MENU_ITEMS.filter((i) => i.isAvailable).map((i) => ({
    name: i.nameEs || i.name,
    description: i.descriptionEs || i.description || i.nameEs || i.name,
    price: i.basePrice,
    category: categoryName.get(i.categoryId) || "Otros",
    ...(i.image ? { image: `https://simmerdownsv.com${i.image}` } : {}),
  }));
}

export default function CartaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(generateMenuSchema(buildMenuSchemaItems())),
        }}
      />
      {children}
    </>
  );
}
