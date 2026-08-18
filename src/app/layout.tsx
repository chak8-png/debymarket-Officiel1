// Route : layout racine — aiguillage uniquement, le contenu est dans frontend/layouts.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Debymarket — Livraison 24h · Paiement à la livraison",
    template: "%s | Debymarket",
  },
  description:
    "Debymarket : électronique, électroménager et mode en Côte d'Ivoire. Livraison en 24h à Abidjan, paiement en espèces à la réception de votre colis.",
};

export { default } from "@/frontend/layouts/RootLayoutContent";
