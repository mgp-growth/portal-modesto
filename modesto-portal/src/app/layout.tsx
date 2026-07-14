import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal — Modesto Growth",
  description: "Repositório central de entregas e painel de gestão.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
