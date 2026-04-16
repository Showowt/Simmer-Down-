import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Habla con nosotros. Reservaciones, eventos privados, consultas generales. Teléfono, WhatsApp y formulario de contacto.",
  openGraph: {
    title: "Simmer Down · Contacto",
    description: "Reservaciones, eventos privados y consultas. Escríbenos.",
    images: ["/og/contact.jpg"],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
