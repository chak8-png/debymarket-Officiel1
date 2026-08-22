// Constantes PARTAGÉES (client + serveur).

export const DELIVERY_TIME = "24h";
export const DELIVERY_AREA = "Abidjan";
export const DELIVERY_FEE_FCFA = 1000; // forfait livraison unique
export const SUPPORT_PHONE = "07 03 13 45 82"; // Service client
export const SUPPORT_PHONE_2 = "05 08 64 81 97"; // Service après-vente
export const SITE_EMAIL = "debymarketinfo@gmail.com";
export const SITE_ADDRESS_1 = "Cocody, Abidjan, Côte d'Ivoire";
export const SITE_ADDRESS_2 = "Rue M20, 256";
export const OPENING_HOURS = "Lundi au Vendredi — de 8h00 à 19h00";
export const PAYMENT_METHOD_LABEL = "Paiement à la livraison";

/**
 * Numéro ivoirien affiché ("07 03 13 45 82") → "tel:+2250703134582".
 * ⚠️ En Côte d'Ivoire, le 0 INITIAL FAIT PARTIE du numéro national
 * (10 chiffres, plan 2021) : on le CONSERVE à l'international
 * (contrairement à la France). Ex : +225 07 03 13 45 82.
 */
export function toTelHref(phone: string): string {
  return `tel:+225${phone.replace(/\D/g, "")}`;
}

/** Lien WhatsApp direct avec message pré-rempli (wa.me + le 0 conservé !) */
export const WHATSAPP_URL = `https://wa.me/225${SUPPORT_PHONE.replace(/\D/g, "")}?text=${encodeURIComponent(
  "Bonjour Debymarket ! Je souhaite passer une commande 🛒"
)}`;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
  returned: "Retournée",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  to_pay_on_delivery: "À payer à la livraison",
  paid: "Payée",
  unpaid: "Non payée",
};

/** Frais de livraison : forfait unique. */
export function deliveryFeeFor(_amount: number, itemsCount = 1): number {
  return itemsCount === 0 ? 0 : DELIVERY_FEE_FCFA;
}
