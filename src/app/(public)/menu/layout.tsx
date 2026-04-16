import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menú",
  description:
    "Pizzas artesanales, pastas, cortes, entradas y cócteles. Menú completo de Simmer Down con información de alérgenos por plato.",
  openGraph: {
    title: "Simmer Down · Menú Completo",
    description:
      "Pizzas artesanales de horno de leña, pastas, cortes y cócteles. Con ingredientes y alérgenos por plato.",
    images: ["/og/menu.jpg"],
  },
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
