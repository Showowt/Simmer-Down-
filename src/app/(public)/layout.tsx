import type { Metadata } from "next";
import NewHeader from "@/components/layout/NewHeader";
import NewBottomNav from "@/components/layout/NewBottomNav";
import NewLocationBar from "@/components/layout/NewLocationBar";
import LocationSheet from "@/components/layout/LocationSheet";
import WhatsAppButton from "@/components/WhatsAppButton";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Simmer Down | Pizza Artesanal | El Salvador",
    template: "%s | Simmer Down",
  },
  description:
    "Pizza artesanal de horno de leña en El Salvador. 5 ubicaciones: Santa Ana, Lago de Coatepeque, San Benito, Surf City, Simmer Garden. Ordena por WhatsApp.",
  openGraph: {
    type: "website",
    locale: "es_SV",
    alternateLocale: "en_US",
    siteName: "Simmer Down — Pizza Artesanal El Salvador",
    images: [{ url: "/og/home.jpg", width: 1200, height: 630, alt: "Simmer Down — Pizza Artesanal El Salvador" }],
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
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <NewHeader />
      <NewLocationBar />
      <main id="main-content">{children}</main>
      <Footer />
      <LocationSheet />
      <WhatsAppButton />
      <NewBottomNav />
    </div>
  );
}
