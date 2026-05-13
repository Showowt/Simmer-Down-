import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

export const metadata: Metadata = {
  title: {
    default: "Simmer Down | Pizzería & Restaurante | El Salvador",
    template: "%s | Simmer Down — Pizza Artesanal El Salvador",
  },
  description:
    "La mejor pizza artesanal de horno de leña en El Salvador. 5 ubicaciones, 14 años, +8,000 reseñas ⭐4.9. Pizzas, pastas, cortes y experiencias gastro-musicales en Santa Ana, San Benito, Lago de Coatepeque, Surf City y Juayúa.",
  openGraph: {
    type: "website",
    locale: "es_SV",
    alternateLocale: "en_US",
    siteName: "Simmer Down — La Mejor Pizza de El Salvador",
    images: [
      {
        url: "/og/home.jpg",
        width: 1200,
        height: 630,
        alt: "Simmer Down — La Mejor Pizza Artesanal de Horno de Leña en El Salvador",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@simmerdownsv",
    creator: "@simmerdownsv",
    images: ["/og/home.jpg"],
  },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main id="main-content" className="pt-20">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
