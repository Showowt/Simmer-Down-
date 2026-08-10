import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carta — Pizzas, Cócteles y Cocina de Autor | Simmer Down",
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

export default function CartaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
