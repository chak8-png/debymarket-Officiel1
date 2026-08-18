// Stockage du MODE DÉMO (sans DATABASE_URL) — SERVEUR UNIQUEMENT.
//
// ⚠️ Ne JAMAIS utiliser de variable module / globalThis pour l'état démo :
// Next.js 14 exécute chaque route API dans un contexte isolé (vérifié : même
// PID, globalThis non partagé) → /api/checkout ne verrait plus ses commandes
// dans /admin. Un petit fichier JSON est partagé par TOUS les contextes.
import "server-only";
import { existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Product } from "../db/schema";

const FILE = join(tmpdir(), "debymarket-demo-store.json");

export interface DemoOrder {  id: number;
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
  createdAt: string; // ISO
  items: {
    productId: number;
    name: string;
    quantity: number;
    unitPrice: number;
    variant?: string | null; // couleur choisie (null/absent = aucune)
  }[];
}

interface DemoStore {
  orders: DemoOrder[];
  nextId: number;
  /** Surcharges de stock : productId → stock courant */
  stock: Record<number, number>;
  /**
   * Catalogue démo APRES modifications admin (ajout/édition/suppression).
   * Absent = catalogue jamais touché → on utilise les données seed.
   */
  catalog?: Product[];
  /** Prochain id produit disponible (création). */
  nextProductId?: number;
  /** Réglages du site (ex : images d'accueil personnalisées) : clé → valeur. */
  settings?: Record<string, string>;
}

const EMPTY: DemoStore = { orders: [], nextId: 1, stock: {} };

export function loadDemoStore(): DemoStore {
  try {
    const raw = readFileSync(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<DemoStore>;
    return {
      orders: parsed.orders ?? [],
      nextId: parsed.nextId ?? 1,
      stock: parsed.stock ?? {},
      catalog: parsed.catalog,
      nextProductId: parsed.nextProductId,
      settings: parsed.settings,
    };
  } catch {
    return { ...EMPTY, orders: [], stock: {} };
  }
}

export function saveDemoStore(store: DemoStore): void {
  try {
    writeFileSync(FILE, JSON.stringify(store));
  } catch (error) {
    console.error("[demo-store] Écriture impossible :", error);
  }
}

/** Réinitialise le mode démo (utilisé par scripts/snapshot.py & vitrine.py). */
export function resetDemoStore(): void {
  try {
    if (existsSync(FILE)) rmSync(FILE);
  } catch {
    // silencieux
  }
}

/** Stock démo d'un produit : surcharge du fichier, sinon valeur de seed. */
export function demoStockOf(productId: number, fallback: number): number {
  const { stock } = loadDemoStore();
  return stock[productId] ?? fallback;
}

/** Met à jour le stock démo de plusieurs produits. */
export function setDemoStock(productId: number, value: number): void {
  const store = loadDemoStore();
  store.stock[productId] = Math.max(0, Math.floor(value));
  saveDemoStore(store);
}

/** Décrémente le stock démo (plancher 0). */
export function decrementDemoStock(
  items: { productId: number; quantity: number }[],
  seedStockOf: (id: number) => number
): void {
  const store = loadDemoStore();
  for (const i of items) {
    const current = store.stock[i.productId] ?? seedStockOf(i.productId);
    store.stock[i.productId] = Math.max(0, current - i.quantity);
  }
  saveDemoStore(store);
}

/** Ajoute une commande démo, retourne son id. */
export function pushDemoOrder(order: Omit<DemoOrder, "id">): number {
  const store = loadDemoStore();
  const id = store.nextId;
  store.orders.unshift({ ...order, id });
  store.nextId += 1;
  saveDemoStore(store);
  return id;
}

export function listDemoOrders(): DemoOrder[] {
  return loadDemoStore().orders;
}

export function updateDemoOrder(
  id: number,
  patch: { status?: string; paymentStatus?: string }
): boolean {
  const store = loadDemoStore();
  const order = store.orders.find((o) => o.id === id);
  if (!order) return false;
  if (patch.status) order.status = patch.status;
  if (patch.paymentStatus) order.paymentStatus = patch.paymentStatus;
  saveDemoStore(store);
  return true;
}

// ---------------------------------------------------------------------------
// Catalogue démo (ajout / modification / suppression de produits)
// ---------------------------------------------------------------------------

/** Catalogue démo courant : snapshot modifié s'il existe, sinon le seed. */
export function getDemoCatalog(seed: Product[]): Product[] {
  const store = loadDemoStore();
  if (!store.catalog) return seed;
  // Les dates repassent par du JSON (string) → on les "ravive" en Date.
  return store.catalog.map((p) => ({
    ...p,
    createdAt: new Date(p.createdAt),
  }));
}

/** Crée ou remplace un produit dans le catalogue démo. */
export function upsertDemoProduct(seed: Product[], product: Product): void {
  const store = loadDemoStore();
  const catalog = store.catalog ?? seed.map((p) => ({ ...p }));
  const idx = catalog.findIndex((p) => p.id === product.id);
  if (idx >= 0) catalog[idx] = product;
  else catalog.unshift(product);
  store.catalog = catalog;
  store.nextProductId =
    Math.max(store.nextProductId ?? 0, ...catalog.map((p) => p.id + 1)) || 1;
  saveDemoStore(store);
}

/** Supprime un produit du catalogue démo (et sa surcharge de stock). */
export function deleteDemoProduct(seed: Product[], id: number): boolean {
  const store = loadDemoStore();
  const catalog = store.catalog ?? seed.map((p) => ({ ...p }));
  const next = catalog.filter((p) => p.id !== id);
  if (next.length === catalog.length) return false;
  store.catalog = next;
  delete store.stock[id];
  saveDemoStore(store);
  return true;
}

/** Prochain id libre pour une création de produit démo. */
export function nextDemoProductId(seed: Product[]): number {
  const store = loadDemoStore();
  const maxCatalog = (store.catalog ?? seed).reduce(
    (m, p) => Math.max(m, p.id),
    0
  );
  return Math.max(store.nextProductId ?? 0, maxCatalog + 1, 1);
}

/** Lit un réglage du site (mode démo). */
export function getDemoSetting(key: string): string | null {
  return loadDemoStore().settings?.[key] ?? null;
}

/** Enregistre (ou supprime si value = null) un réglage du site. */
export function setDemoSetting(key: string, value: string | null): void {
  const store = loadDemoStore();
  const settings = { ...(store.settings ?? {}) };
  if (value === null) delete settings[key];
  else settings[key] = value;
  saveDemoStore({ ...store, settings });
}
