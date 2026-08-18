// Route : /a-propos — coquille (métadonnées) + aiguillage vers la vue.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Debymarket — boutique en ligne ivoirienne à Cocody, Abidjan. Livraison en 24h, paiement à la livraison. Coordonnées et horaires d'ouverture.",
};

export { default } from "@/frontend/views/public/AboutView";
