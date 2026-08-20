// Service : RESTAURATION complète de la boutique depuis une sauvegarde JSON
// produite par GET /api/admin/backup. — SERVEUR UNIQUEMENT.
//
// Sert à deux situations :
//   1. migration d'hébergeur de base (ex : Neon → Render Postgres) en 2 clics ;
//   2. retour en arrière après une erreur de manipulation.
//
// ⚠️ Sémantique : REMPLACEMENT TOTAL (produits, commandes, réglages) dans une
// transaction unique — tout ou rien. Les identifiants sont CONSERVÉS (fidélité
// des liens/exports Excel) et les séquences sont réalignées à la fin.
import "server-only";
import { sql } from "drizzle-orm";
import { db, withDbRetry } from "../db";
import { products, orders, orderItems, settings } from "../db/schema";
import { getCategoryById } from "../lib/categories";
import { slugify } from "../lib/products";
import { ORDER_STATUSES } from "../lib/constants";
import { HOME_IMAGE_KEYS } from "../lib/settings";
import {
  parseGallery,
  parseColors,
  parseSizes,
  serializeGallery,
  serializeColors,
  serializeSizes,
} from "../lib/product-variants";

export type RestoreResult =
  | {
      ok: true;
      stats: {
        produits: number;
        produitsIgnores: number;
        commandes: number;
        commandesIgnorees: number;
        reglages: number;
      };
    }
  | { ok: false; error: string };

// ── Petites validations (tolérantes : une ligne douteuse est ignorée, jamais
//    le fichier entier rejeté pour une coquille) ─────────────────────────────

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Entier borné, ou null si non conforme. */
function int(v: unknown, min: number, max: number): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n);
  return r >= min && r <= max ? r : null;
}

/** Texte nettoyé (caractères de contrôle retirés) et plafonné. */
function text(v: unknown, max: number, fallback = ""): string {
  if (typeof v !== "string") return fallback;
  return v.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);
}

/** Date valide, sinon maintenant. */
function date(v: unknown): Date {
  const d = new Date(typeof v === "string" || typeof v === "number" ? v : NaN);
  return Number.isFinite(d.getTime()) ? d : new Date();
}

/** Texte JSON tenant dans une colonne TEXT (galerie/couleurs/tailles). */
function jsonText(v: unknown, kind: "gallery" | "colors" | "sizes"): string {
  const raw = typeof v === "string" ? v : "";
  try {
    if (kind === "gallery") return serializeGallery(parseGallery(raw));
    if (kind === "colors") return serializeColors(parseColors(raw));
    return serializeSizes(parseSizes(raw));
  } catch {
    return ""; // contenu corrrompu → champ vide plutôt que tout casser
  }
}

// ── Restauration ────────────────────────────────────────────────────────────

export async function importBackup(data: unknown): Promise<RestoreResult> {
  if (!isRecord(data) || data.application !== "debymarket") {
    return {
      ok: false,
      error:
        "Ce fichier n'est pas une sauvegarde Debymarket. Utilisez le fichier debymarket-sauvegarde-AAAA-MM-JJ.json téléchargé depuis 💾 Sauvegarde du site.",
    };
  }
  const database = db;
  if (!database) {
    return {
      ok: false,
      error: "Restauration impossible : la base de données n'est pas connectée.",
    };
  }

  const rawProducts = Array.isArray(data.produits) ? data.produits : null;
  if (!rawProducts) {
    return {
      ok: false,
      error: "Sauvegarde incomplète : la liste des produits est absente.",
    };
  }
  const rawOrders = Array.isArray(data.commandes) ? data.commandes : [];
  const rawSettings = isRecord(data.reglages) ? data.reglages : {};

  // 1. Normalisation des produits (ids conservés, doublons ignorés)
  const productRows: (typeof products.$inferInsert)[] = [];
  const seenIds = new Set<number>();
  const seenSlugs = new Set<string>();
  let produitsIgnores = 0;

  for (const p of rawProducts) {
    if (!isRecord(p)) {
      produitsIgnores++;
      continue;
    }
    const id = int(p.id, 1, 1_000_000_000);
    const name = text(p.name, 150);
    const price = int(p.price, 0, 100_000_000);
    const categoryId = int(p.categoryId, 1, 1_000_000);
    if (!id || !name || price === null || !categoryId || seenIds.has(id)) {
      produitsIgnores++;
      continue;
    }
    if (!getCategoryById(categoryId)) {
      produitsIgnores++; // catégorie inconnue du catalogue actuel
      continue;
    }
    // Slug : repris tel quel s'il est sain et libre, sinon régénéré
    let slug = typeof p.slug === "string" ? p.slug.trim().toLowerCase() : "";
    if (!/^[a-z0-9][a-z0-9-]{0,158}$/.test(slug) || seenSlugs.has(slug)) {
      slug = `${slugify(name)}-${id}`;
    }
    seenIds.add(id);
    seenSlugs.add(slug);
    productRows.push({
      id,
      slug,
      name,
      description: text(p.description, 3000),
      price,
      oldPrice: int(p.oldPrice, 0, 100_000_000),
      stock: int(p.stock, 0, 999_999) ?? 0,
      image: text(p.image, 8, "🛍️") || "🛍️",
      imageUrl: text(p.imageUrl, 1_200_000) || null,
      gallery: jsonText(p.gallery, "gallery"),
      colors: jsonText(p.colors, "colors"),
      sizes: jsonText(p.sizes, "sizes"),
      categoryId,
      rating: int(p.rating, 0, 5) ?? 4,
      isFeatured: p.isFeatured === true,
      isActive: p.isActive !== false, // absent → actif
      createdAt: date(p.createdAt),
    });
  }

  // 2. Normalisation des commandes + articles
  const orderRows: (typeof orders.$inferInsert)[] = [];
  const itemRows: (typeof orderItems.$inferInsert)[] = [];
  let commandesIgnorees = 0;
  const seenOrderIds = new Set<number>();

  for (const o of rawOrders) {
    if (!isRecord(o)) {
      commandesIgnorees++;
      continue;
    }
    const id = int(o.id, 1, 1_000_000_000);
    const reference = text(o.reference, 40);
    const customerName = text(o.customerName, 100);
    const phone = text(o.phone, 20);
    const city = text(o.city, 80);
    const address = text(o.address, 250);
    const subtotal = int(o.subtotal, 0, 100_000_000);
    const deliveryFee = int(o.deliveryFee, 0, 1_000_000);
    const total = int(o.total, 0, 100_000_000);
    if (
      !id || !reference || !customerName || !phone ||
      subtotal === null || deliveryFee === null || total === null ||
      seenOrderIds.has(id)
    ) {
      commandesIgnorees++;
      continue;
    }
    seenOrderIds.add(id);
    const statusRaw = text(o.status, 20);
    orderRows.push({
      id,
      reference,
      customerName,
      phone,
      city,
      address,
      status: (ORDER_STATUSES as readonly string[]).includes(statusRaw)
        ? statusRaw
        : "pending",
      paymentMethod: text(o.paymentMethod, 40, "cash_on_delivery") || "cash_on_delivery",
      paymentStatus: text(o.paymentStatus, 40, "to_pay_on_delivery") || "to_pay_on_delivery",
      subtotal,
      deliveryFee,
      total,
      createdAt: date(o.createdAt),
    });
    const lines = Array.isArray(o.items) ? o.items : [];
    for (const it of lines) {
      if (!isRecord(it)) continue;
      const productId = int(it.productId, 1, 1_000_000_000);
      const itemName = text(it.name, 150);
      const quantity = int(it.quantity, 1, 999);
      const unitPrice = int(it.unitPrice, 0, 100_000_000);
      if (!productId || !itemName || !quantity || unitPrice === null) continue;
      itemRows.push({
        orderId: id,
        productId,
        name: itemName,
        quantity,
        unitPrice,
        variant: text(it.variant, 40), // "" = aucune couleur (colonne NOT NULL)
        size: text(it.size, 20),
      });
    }
  }

  // 3. Réglages d'accueil : clés en liste blanche uniquement
  const reglages: Record<string, string> = {};
  for (const key of HOME_IMAGE_KEYS) {
    const v = rawSettings[key];
    if (typeof v === "string" && v.length <= 1_200_000 && v.trim() !== "") {
      reglages[key] = v;
    }
  }

  // 4. Remplacement TOTAL dans une transaction (tout ou rien)
  try {
    await withDbRetry(() =>
      database.transaction(async (tx) => {
        await tx.delete(orderItems);
        await tx.delete(orders);
        await tx.delete(products);
        if (productRows.length) await tx.insert(products).values(productRows);
        if (orderRows.length) await tx.insert(orders).values(orderRows);
        if (itemRows.length) await tx.insert(orderItems).values(itemRows);
        await tx.execute(sql`DELETE FROM settings`);
        for (const [key, value] of Object.entries(reglages)) {
          await tx.execute(sql`
            INSERT INTO settings (key, value) VALUES (${key}, ${value})
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
          `);
        }
        // Séquences réalignées : le prochain article ajouté au dashboard
        // prendra bien max(id)+1, sinon → erreur de clé dupliquée.
        for (const table of ["products", "orders", "order_items"]) {
          await tx.execute(
            sql.raw(
              `SELECT setval(pg_get_serial_sequence('${table}','id'), ` +
                `COALESCE((SELECT MAX(id) FROM ${table}), 1))`
            )
          );
        }
      })
    );
  } catch (error) {
    console.error("[restore] Échec de la restauration :", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("does not exist") || msg.includes("n'existe pas")) {
      return {
        ok: false,
        error:
          "Les tables sont absentes de la base. Lancez d'abord l'initialisation (POST /api/seed?tables=1 — voir DEPLOIEMENT.md), puis recommencez la restauration.",
      };
    }
    return {
      ok: false,
      error: "Restauration impossible — vérifiez la connexion à la base et réessayez.",
    };
  }

  return {
    ok: true,
    stats: {
      produits: productRows.length,
      produitsIgnores,
      commandes: orderRows.length,
      commandesIgnorees,
      reglages: Object.keys(reglages).length,
    },
  };
}
