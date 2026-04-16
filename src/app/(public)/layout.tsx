import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

export const metadata: Metadata = {
  title: {
    default: "Simmer Down | Pizzería & Restaurante | El Salvador",
    template: "%s | Simmer Down",
  },
  description:
    "5 ubicaciones. 12 años creando memorias. Pizza artesanal de horno de leña, pastas, cortes y experiencias gastro-musicales en Santa Ana, San Benito, Lago de Coatepeque, Surf City y Simmer Garden.",
  openGraph: {
    type: "website",
    locale: "es_SV",
    siteName: "Simmer Down",
    images: [
      {
        url: "/og/home.jpg",
        width: 1200,
        height: 630,
        alt: "Simmer Down — Pizzería & Restaurante en El Salvador",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
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
      <main id="main-content">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
