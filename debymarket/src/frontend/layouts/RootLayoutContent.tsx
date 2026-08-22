// LAYOUT racine : structure <html>/<body> commune à toutes les pages.
// (polices, barre d'annonce, header, footer, bouton WhatsApp, providers)
import type { ReactNode } from "react";
import { Fraunces, Inter } from "next/font/google";
import "@/frontend/styles/globals.css";
import AnnouncementBar from "@/frontend/components/layout/AnnouncementBar";
import Header from "@/frontend/components/layout/Header";
import Footer from "@/frontend/components/layout/Footer";
import WhatsAppButton from "@/frontend/components/layout/WhatsAppButton";
import AppProviders from "@/frontend/providers/AppProviders";
import Hotjar from "@/frontend/components/analytics/Hotjar";

// Polices du design : Fraunces (titres) + Inter (texte)
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export default function RootLayoutContent({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col bg-cream font-sans text-ink-950">
        <AppProviders>
          <AnnouncementBar />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
          <Hotjar />
        </AppProviders>
      </body>
    </html>
  );
}
