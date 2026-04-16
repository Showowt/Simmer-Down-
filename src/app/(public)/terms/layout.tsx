import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos & Condiciones",
  description:
    "Términos de uso, pagos, entregas, cancelaciones, y responsabilidades. Jurisdicción El Salvador.",
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
