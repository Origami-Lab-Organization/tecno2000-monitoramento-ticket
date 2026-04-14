import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tecno2000 - Gestão de Assistência Técnica",
  description: "Sistema de gestão de assistência técnica Tecno2000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50">
        {children}
      </body>
    </html>
  );
}
