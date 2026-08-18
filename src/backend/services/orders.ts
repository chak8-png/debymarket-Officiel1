// Service commandes — SERVEUR UNIQUEMENT.
// Paiement à la livraison : aucune transaction en ligne, le livreur encaisse.
import "server-only";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { orders, orderItems } from "../db/schema";
import { getProductsByIds, decrementStock } from "../lib/products";
import { deliveryFeeFor } from "../lib/constants";
import { generateReference } from "../lib/format";
import type { OrderStatus } from "../lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface CheckoutItemInput {
  productId: number;
  quantity: number;
}

export interface CheckoutInput {
  customerName: string;
  phone: string;
  city: string;
  address: string;
  items: CheckoutItemInput[];
  /**
   * Pot de miel anti-robots : champ INVISIBLE du formulaire qu'un humain ne
   * remplit jamais. S'il contient quoi que ce soit, c'est un bot.
   */
  website?: string;
}

/** Retire les caractères de contrôle (NUL, etc.) d'un champ texte. */
function stripControlChars(s: string): string {
  return s.replace(/[\u0000-\u001F\u007F]/g, " ");
}

export interface StoredOrderItem {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface StoredOrder {
  id: number;
  reference: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: Date;
  items: StoredOrderItem[];
}

export type CreateOrderResult =
  | { ok: true; reference: string; total: number }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Stockage du MODE DÉMO (sans base) : fichier JSON partagé par toutes les routes
// (Next.js 14 isole chaque route API — ni variable module ni globalThis ne
// fonctionnent pour partager l'état, voir backend/lib/demo-store.ts).
// ---------------------------------------------------------------------------
import {
  pushDemoOrder,
  listDemoOrders,
  updateDemoOrder,
} from "../lib/demo-store";

// Téléphone ivorien : 10 chiffres commençant par 01, 05 ou 07 (+225 optionnel)
const PHONE_RE = /^(?:\+?225)?(?:01|05|07)\d{8}$/;

// ---------------------------------------------------------------------------
// Création de commande
// ---------------------------------------------------------------------------
export async function createOrder(input: CheckoutInput): Promise<CreateOrderResult> {
  // 0. 🍯 POT DE MIEL anti-robots : le formulaire contient un champ « website »
  // invisible. Seuls les bots le remplissent → on fait semblant d'accepter
  // (référence factice) SANS rien enregistrer ni toucher au stock. Le bot
  // repart content, la boutique reste propre.
  if (typeof input.website === "string" && input.website.trim() !== "") {
    return { ok: true, reference: generateReference(), total: 0 };
  }

  // 1. Validation des champs client
  // Plafonds anti-abus (évite payloads géantes / champs illimités)
  // + retrait des caractères de contrôle (anti injection / corruption).
  const customerName = stripControlChars(input.customerName ?? "").trim().slice(0, 100);
  const phone = (input.phone ?? "").replace(/[\s.-]/g, "").slice(0, 20);
  const city = stripControlChars(input.city ?? "").trim().slice(0, 80);
  const address = stripControlChars(input.address ?? "").trim().slice(0, 250);

  if (customerName.length < 2) return { ok: false, error: "Veuillez saisir votre nom complet." };
  if (!PHONE_RE.test(phone))
    return { ok: false, error: "Numéro invalide. Exemple : 07 00 00 00 00" };
  if (city.length < 2) return { ok: false, error: "Veuillez indiquer votre commune / ville." };
  if (address.length < 5)
    return { ok: false, error: "Adresse de livraison trop courte (quartier, repère…)." };
  if (!Array.isArray(input.items) || input.items.length === 0)
    return { ok: false, error: "Votre panier est vide." };
  if (input.items.length > 50)
    return { ok: false, error: "Trop d'articles dans la commande (50 max)." };

  // 2. ⚠️ SÉCURITÉ : prix toujours recalculés DEPUIS LA BASE — jamais ceux du client
  const ids = input.items.map((i) => Number(i.productId));
  if (ids.some((id) => !Number.isInteger(id)))
    return { ok: false, error: "Produit invalide." };

  const dbProducts = await getProductsByIds(ids);
  const lines: StoredOrderItem[] = [];

  for (const item of input.items) {
    const product = dbProducts.find((p) => p.id === Number(item.productId));
    const quantity = Math.max(1, Math.min(20, Math.floor(Number(item.quantity)) || 0));
    if (!product || !product.isActive)
      return { ok: false, error: "Un produit de votre panier n'est plus disponible." };
    if (product.stock < quantity)
      return { ok: false, error: `Stock insuffisant pour « ${product.name} ».` };
    lines.push({
      productId: product.id,
      name: product.name,
      quantity,
      unitPrice: product.price,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const deliveryFee = deliveryFeeFor(subtotal, lines.length);
  const total = subtotal + deliveryFee;
  const reference = generateReference();

  // 3. Persistance : PostgreSQL si configurée, sinon mémoire (démo)
  if (db) {
    try {
      const inserted = await db
        .insert(orders)
        .values({
          reference,
          customerName,
          phone,
          city,
          address,
          status: "pending",
          paymentMethod: "cash_on_delivery",
          paymentStatus: "to_pay_on_delivery",
          subtotal,
          deliveryFee,
          total,
        })
        .returning({ id: orders.id });
      const orderId = inserted[0].id;
      await db.insert(orderItems).values(lines.map((l) => ({ orderId, ...l })));
      // Le stock diminue dès que la commande est validée
      await decrementStock(lines.map((l) => ({ productId: l.productId, quantity: l.quantity })));
      return { ok: true, reference, total };
    } catch (error) {
      console.error("[orders] Erreur création commande :", error);
      return { ok: false, error: "Erreur serveur, veuillez réessayer." };
    }
  }

  // Mode démo (fichier JSON) : le stock diminue aussi
  await decrementStock(lines.map((l) => ({ productId: l.productId, quantity: l.quantity })));
  pushDemoOrder({
    reference,
    customerName,
    phone,
    city,
    address,
    status: "pending",
    paymentMethod: "cash_on_delivery",
    paymentStatus: "to_pay_on_delivery",
    subtotal,
    deliveryFee,
    total,
    createdAt: new Date().toISOString(),
    items: lines,
  });
  return { ok: true, reference, total };
}

// ---------------------------------------------------------------------------
// Lecture / mise à jour (dashboard admin)
// ---------------------------------------------------------------------------
export async function listOrders(): Promise<StoredOrder[]> {
  if (db) {
    try {
      const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
      if (rows.length === 0) return [];
      const items = await db
        .select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, rows.map((r) => r.id)));
      return rows.map((r) => ({
        ...r,
        items: items
          .filter((i) => i.orderId === r.id)
          .map(({ productId, name, quantity, unitPrice }) => ({
            productId,
            name,
            quantity,
            unitPrice,
          })),
      }));
    } catch (error) {
      console.error("[orders] Erreur lecture commandes :", error);
      return [];
    }
  }
  return listDemoOrders().map((o) => ({ ...o, createdAt: new Date(o.createdAt) }));
}

export async function updateOrderStatus(
  id: number,
  status: OrderStatus
): Promise<boolean> {
  // Livrée → payée ; annulée/retournée → non payée
  const paymentStatus =
    status === "delivered"
      ? "paid"
      : status === "cancelled" || status === "returned"
        ? "unpaid"
        : undefined;
  const patch = paymentStatus ? { status, paymentStatus } : { status };

  if (db) {
    try {
      await db.update(orders).set(patch).where(eq(orders.id, id));
      return true;
    } catch (error) {
      console.error("[orders] Erreur mise à jour :", error);
      return false;
    }
  }
  return updateDemoOrder(id, {
    status,
    ...(paymentStatus ? { paymentStatus } : {}),
  });
}
