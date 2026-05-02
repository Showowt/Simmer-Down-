import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nuestra Historia",
  description:
    "14 años de historia. Desde Santa Ana hasta la costa. Cocina de horno de leña, fuego lento, recetas que respetan el ingrediente. Simmer Down es parte de la memoria de El Salvador.",
  openGraph: {
    title: "Simmer Down · Nuestra Historia",
    description:
      "Hay lugares que se visitan. Y hay lugares que se recuerdan. Simmer Down es parte de la memoria de El Salvador.",
    images: ["/og/about.jpg"],
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
