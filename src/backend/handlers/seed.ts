// Handler : POST /api/seed — prépare la base PostgreSQL :
//   1️⃣ crée les tables si absentes (idempotent : CREATE TABLE IF NOT EXISTS)
//   2️⃣ insère les catégories + les 72 articles de départ (onConflictDoNothing)
//   3️⃣ réaligne les compteurs d'ID (séquences) pour les futurs ajouts
// → aucune installation locale (Node/drizzle-kit) n'est nécessaire côté client.
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/backend/db";
import { categories, products } from "@/backend/db/schema";
import { CATEGORY_LIST } from "@/backend/lib/categories";
import { createHash, timingSafeEqual } from "node:crypto";
import { rateLimitHit } from "@/backend/lib/rate-limit";
import { getClientIp } from "@/backend/lib/http-guards";
import { PRODUCTS } from "@/backend/lib/seed-data";

/** Comparaison du secret en temps constant (anti timing attack). */
function secretMatches(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Crée les 4 tables si elles n'existent pas.
 * Miroir exact de backend/db/schema.ts — idempotent (rejouable sans risque).
 */
async function ensureTables(): Promise<void> {
  if (!db) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS categories (
      id serial PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      name text NOT NULL,
      parent_id integer,
      depth integer NOT NULL DEFAULT 0,
      icon text,
      "position" integer NOT NULL DEFAULT 0
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS products (
      id serial PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      name text NOT NULL,
      description text NOT NULL DEFAULT '',
      price integer NOT NULL,
      old_price integer,
      stock integer NOT NULL DEFAULT 0,
      image text NOT NULL DEFAULT '🛍️',
      image_url text,
      gallery text NOT NULL DEFAULT '',
      colors text NOT NULL DEFAULT '',
      category_id integer NOT NULL,
      rating integer NOT NULL DEFAULT 4,
      is_featured boolean NOT NULL DEFAULT false,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS orders (
      id serial PRIMARY KEY,
      reference text NOT NULL UNIQUE,
      customer_name text NOT NULL,
      phone text NOT NULL,
      city text NOT NULL,
      address text NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      payment_method text NOT NULL DEFAULT 'cash_on_delivery',
      payment_status text NOT NULL DEFAULT 'to_pay_on_delivery',
      subtotal integer NOT NULL,
      delivery_fee integer NOT NULL,
      total integer NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id serial PRIMARY KEY,
      order_id integer NOT NULL,
      product_id integer NOT NULL,
      name text NOT NULL,
      quantity integer NOT NULL,
      unit_price integer NOT NULL,
      variant text NOT NULL DEFAULT ''
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS settings (
      key text PRIMARY KEY,
      value text NOT NULL
    )
  `);
  // 🔄 MISE À NIVEAU des bases déjà seedées (ALTER idempotent : IF NOT EXISTS).
  // Nouvelles colonnes galerie/couleurs (produits) et variante (lignes de
  // commande) — relancer simplement POST /api/seed suffit, aucune donnée perdue.
  await db.execute(
    sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery text NOT NULL DEFAULT ''`
  );
  await db.execute(
    sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS colors text NOT NULL DEFAULT ''`
  );
  await db.execute(
    sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant text NOT NULL DEFAULT ''`
  );
}

/**
 * Le seed insère des IDs EXPLICITES (1…86) : il faut remettre les séquences
 * au maximum atteint, sinon le prochain produit ajouté via le dashboard
 * tenterait d'utiliser l'id 1 → erreur de clé dupliquée.
 */
async function realignSequences(): Promise<void> {
  if (!db) return;
  for (const table of ["categories", "products"]) {
    await db.execute(
      sql.raw(
        `SELECT setval(pg_get_serial_sequence('${table}','id'), ` +
          `COALESCE((SELECT MAX(id) FROM ${table}), 1))`
      )
    );
  }
}

// Dev : libre. Production : exige l'en-tête x-seed-secret = ADMIN_PASSWORD.
// Anti force brute : 5 requêtes/min par IP (ralentit la recherche du secret).
export async function POST(req: Request) {
  const gate = rateLimitHit(`seed:${getClientIp(req)}`, 5, 60_000);
  if (!gate.allowed) {
    return NextResponse.json(
      { ok: false, error: "Trop de requêtes — réessayez dans une minute." },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } }
    );
  }
  if (process.env.NODE_ENV === "production") {
    const expected = process.env.ADMIN_PASSWORD;
    const secret = req.headers.get("x-seed-secret") ?? "";
    if (!expected || !secretMatches(secret, expected)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Seed protégé en production : envoyez l'en-tête x-seed-secret (votre ADMIN_PASSWORD).",
        },
        { status: 403 }
      );
    }
  }
  if (!db) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "DATABASE_URL non configurée — le site tourne déjà en mode démo, rien à seeder.",
      },
      { status: 400 }
    );
  }

  try {
    // 1. Tables (créées automatiquement si la base est neuve)
    await ensureTables();

    // 🆕 MODE « TABLES SEULES » (POST /api/seed?tables=1) : crée ou met à
    // niveau le SCHÉMA uniquement — AUCUN article de démonstration inséré.
    // À utiliser quand la boutique ne vend que ses propres produits.
    // (Le catalogue démo n'est qu'un remplissage de départ facultatif.)
    if (new URL(req.url).searchParams.get("tables") === "1") {
      await realignSequences();
      return NextResponse.json({ ok: true, tablesOnly: true });
    }

    // 2. Données de départ (rien n'est dupliqué si on relance)
    await db.insert(categories).values(CATEGORY_LIST).onConflictDoNothing();
    await db
      .insert(products)
      .values(PRODUCTS.map(({ createdAt, ...p }) => p))
      .onConflictDoNothing();

    // 3. Compteurs d'ID pour les futurs produits du dashboard
    await realignSequences();

    return NextResponse.json({
      ok: true,
      categories: CATEGORY_LIST.length,
      products: PRODUCTS.length,
    });
  } catch (error) {
    console.error("[seed] Erreur :", error);
    return NextResponse.json(
      { ok: false, error: "Erreur pendant le seed (voir logs serveur)." },
      { status: 500 }
    );
  }
}
