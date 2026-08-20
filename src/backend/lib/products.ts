// Fonctions de requête produits — SERVEUR UNIQUEMENT.
// Avec DATABASE_URL : lit PostgreSQL via Drizzle. Sinon : données de démo.
import "server-only";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db, withDbRetry, assertPersistentWrite } from "../db";
import { products } from "../db/schema";
import type { Product } from "../db/schema";
import { PRODUCTS } from "./seed-data";
import { getDescendantIds } from "./categories";
import {
  serializeGallery,
  serializeColors,
  serializeSizes,
  type ProductColor,
} from "./product-variants";

export interface ProductQuery {
  categorySlug?: string;
  search?: string;
  featured?: boolean;
  promoOnly?: boolean;
  limit?: number;
  /** Admin : inclure aussi les produits masqués (isActive = false). */
  includeInactive?: boolean;
}

// Mode démo : les produits viennent de seed-data (ou du catalogue déjà
// modifié par l'admin), et le STOCK vit dans le fichier JSON partagé
// (demo-store) — Next.js 14 isole chaque route API, donc ni variable module
// ni globalThis ne permettent de partager l'état démo.
import {
  loadDemoStore,
  setDemoStock,
  decrementDemoStock,
  getDemoCatalog,
  upsertDemoProduct,
  deleteDemoProduct,
  nextDemoProductId,
} from "./demo-store";

/** Catalogue démo = catalogue (seed ou modifié) + surcharges de stock. */
function demoProducts(): Product[] {
  const { stock } = loadDemoStore();
  return getDemoCatalog(PRODUCTS).map((p) => ({
    ...p,
    stock: stock[p.id] ?? p.stock,
  }));
}

function applyFilters(list: Product[], q: ProductQuery): Product[] {
  let out = q.includeInactive ? [...list] : list.filter((p) => p.isActive);

  if (q.categorySlug) {
    const ids = getDescendantIds(q.categorySlug);
    out = out.filter((p) => ids.includes(p.categoryId));
  }

  if (q.search) {
    const s = q.search.trim().toLowerCase();
    if (s) {
      out = out.filter((p) =>
        `${p.name} ${p.description}`.toLowerCase().includes(s)
      );
    }
  }

  if (q.featured) out = out.filter((p) => p.isFeatured);
  if (q.promoOnly) out = out.filter((p) => p.oldPrice !== null && p.oldPrice > p.price);

  // Plus récents d'abord par défaut
  out = [...out].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (q.limit && q.limit > 0) out = out.slice(0, q.limit);
  return out;
}

/** Tous les produits (source : DB si configurée, sinon démo), avant filtres. */
async function loadAll(): Promise<Product[]> {
  const database = db;
  if (database) {
    try {
      // Réessais : la base gratuite se « réveille » parfois en ~1 s
      return await withDbRetry(() => database.select().from(products));
    } catch (error) {
      console.error("[products] Erreur DB, bascule sur les données démo :", error);
    }
  }
  return demoProducts();
}

export async function fetchProducts(q: ProductQuery = {}): Promise<Product[]> {
  return applyFilters(await loadAll(), q);
}

export async function fetchProductBySlug(
  slug: string
): Promise<Product | undefined> {
  const database = db;
  if (database) {
    try {
      const rows = await withDbRetry(() =>
        database
          .select()
          .from(products)
          .where(eq(products.slug, slug))
          .limit(1)
      );
      if (rows[0]) return rows[0];
    } catch (error) {
      console.error("[products] Erreur DB, bascule sur les données démo :", error);
    }
  }
  return demoProducts().find((p) => p.slug === slug);
}

export async function fetchRelatedProducts(
  product: Product,
  limit = 4
): Promise<Product[]> {
  const sameCategory = await fetchProducts({
    categorySlug: undefined,
  });
  return sameCategory
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, limit);
}

/** Met à jour le stock d'un produit (dashboard admin) — DB si configurée, sinon démo. */
export async function updateProductStock(
  id: number,
  stock: number
): Promise<boolean> {
  const value = Math.max(0, Math.floor(stock));
  const database = db;
  if (database) {
    try {
      const rows = await withDbRetry(() =>
        database
          .update(products)
          .set({ stock: value })
          .where(eq(products.id, id))
          .returning({ id: products.id })
      );
      return rows.length > 0;
    } catch (error) {
      console.error("[products] Erreur mise à jour stock :", error);
      return false;
    }
  }
  assertPersistentWrite(); // production : jamais d'écriture démo éphémère
  const exists = demoProducts().some((p) => p.id === id);
  if (!exists) return false;
  setDemoStock(id, value);
  return true;
}

/** Décrémente le stock après une commande validée (plancher à 0). */
export async function decrementStock(
  items: { productId: number; quantity: number }[]
): Promise<void> {
  const database = db;
  if (database) {
    try {
      await withDbRetry(() =>
        Promise.all(
          items.map((i) =>
            database
              .update(products)
              .set({ stock: sql`GREATEST(0, ${products.stock} - ${i.quantity})` })
              .where(eq(products.id, i.productId))
          )
        )
      );
      return;
    } catch (error) {
      console.error("[products] Erreur décrément stock :", error);
      return;
    }
  }
  assertPersistentWrite(); // production : jamais d'écriture démo éphémère
  decrementDemoStock(items, (id) => {
    const p = getDemoCatalog(PRODUCTS).find((x) => x.id === id);
    // valeur courante (seed ou surcharge déjà enregistrée)
    const { stock } = loadDemoStore();
    return stock[id] ?? p?.stock ?? 0;
  });
}

// ---------------------------------------------------------------------------
// Gestion du catalogue (dashboard admin) — création / édition / suppression
// ---------------------------------------------------------------------------

/** Champs modifiables d'un produit. */
export interface ProductInput {
  name: string;
  description: string;
  price: number;
  categoryId: number;
  image: string; // emoji de secours (affiché si pas de photo)
  imageUrl: string | null; // photo principale : /images/..., https://... ou data:image/...
  gallery: string[]; // photos supplémentaires (ordre conservé, 5 max)
  colors: ProductColor[]; // couleurs proposées (8 max)
  sizes: string[]; // tailles / pointures proposées (15 max)
  isFeatured: boolean;
  isActive: boolean;
}


/** Slug URL à partir du nom ("Chemise Élégante !" → "chemise-elegante"). */
export function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // retire les accents
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "produit"
  );
}

/** Garantit un slug unique en ajoutant -2, -3… si nécessaire. */
async function uniqueSlug(base: string): Promise<string> {
  const taken = new Set((await loadAll()).map((p) => p.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/** Crée un produit (DB si configurée, sinon mode démo). Stock initial possible. */
export async function createProduct(
  input: ProductInput & { stock?: number }
): Promise<Product | null> {
  const slug = await uniqueSlug(slugify(input.name));
  const stock = Math.max(0, Math.floor(input.stock ?? 0));
  // Tableaux (galerie/couleurs) → JSON texte pour la colonne TEXT ("" si vide)
  const { gallery, colors, sizes, ...rest } = input;
  const row = {
    ...rest,
    slug,
    stock,
    oldPrice: null,
    rating: 4,
    gallery: serializeGallery(gallery),
    colors: serializeColors(colors),
    sizes: serializeSizes(sizes),
  };
  const database = db;
  if (database) {
    try {
      const rows = await withDbRetry(() =>
        database.insert(products).values(row).returning()
      );
      return rows[0] ?? null;
    } catch (error) {
      console.error("[products] Erreur création produit :", error);
      return null;
    }
  }
  assertPersistentWrite(); // production : jamais de création qui s'évapore
  const product: Product = {
    id: nextDemoProductId(PRODUCTS),
    ...row,
    createdAt: new Date(),
  };
  upsertDemoProduct(PRODUCTS, product);
  return product;
}

/** Met à jour les infos d'un produit (pas le stock — voir updateProductStock). */
export async function updateProduct(
  id: number,
  patch: Partial<ProductInput>
): Promise<boolean> {
  const { gallery, colors, sizes, ...rest } = patch;
  const row: Omit<typeof rest, "gallery" | "colors" | "sizes"> &
    Partial<Pick<Product, "gallery" | "colors" | "sizes">> = { ...rest };
  if (gallery !== undefined) row.gallery = serializeGallery(gallery);
  if (colors !== undefined) row.colors = serializeColors(colors);
  if (sizes !== undefined) row.sizes = serializeSizes(sizes);
  const database = db;
  if (database) {
    try {
      const rows = await withDbRetry(() =>
        database
          .update(products)
          .set(row)
          .where(eq(products.id, id))
          .returning({ id: products.id })
      );
      return rows.length > 0;
    } catch (error) {
      console.error("[products] Erreur mise à jour produit :", error);
      return false;
    }
  }
  assertPersistentWrite(); // production : jamais d'édition qui s'évapore
  const catalog = getDemoCatalog(PRODUCTS);
  const current = catalog.find((p) => p.id === id);
  if (!current) return false;
  upsertDemoProduct(PRODUCTS, { ...current, ...row });
  return true;
}

/** Supprime définitivement un produit. */
export async function deleteProduct(id: number): Promise<boolean> {
  const database = db;
  if (database) {
    try {
      const rows = await withDbRetry(() =>
        database
          .delete(products)
          .where(eq(products.id, id))
          .returning({ id: products.id })
      );
      return rows.length > 0;
    } catch (error) {
      console.error("[products] Erreur suppression produit :", error);
      return false;
    }
  }
  assertPersistentWrite(); // production : jamais d'écriture démo éphémère
  return deleteDemoProduct(PRODUCTS, id);
}

/** Produits par ids — utilisé par /api/checkout pour recalculer les prix côté serveur. */
export async function getProductsByIds(ids: number[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const database = db;
  if (database) {
    try {
      return await withDbRetry(() =>
        database.select().from(products).where(inArray(products.id, ids))
      );
    } catch (error) {
      console.error("[products] Erreur DB, bascule sur les données démo :", error);
    }
  }
  const catalog = demoProducts();
  return catalog.filter((p) => ids.includes(p.id));
}
