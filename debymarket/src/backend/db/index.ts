import "server-only";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Client PostgreSQL + Drizzle.
// Sans DATABASE_URL, db vaut null → le site bascule en "mode démo"
// (données en mémoire, voir backend/lib/products.ts et services/orders.ts).
const url = process.env.DATABASE_URL;

export const db = url
  ? drizzle(postgres(url, { prepare: false }), { schema })
  : null;

// ---------------------------------------------------------------------------
// Réessais automatiques — la base gratuite Neon « s'endort » après quelques
// minutes d'inactivité et met ~1 s à se réveiller : sans réessai, la première
// requête échouait et le site basculait en mode démo alors que tout va bien.
// ---------------------------------------------------------------------------

/**
 * true si l'erreur ressemble à un souci réseau/connexion temporaire
 * (mérite une nouvelle tentative). false pour les erreurs SQL (schéma,
 * contraintes…) — réessayer ne servirait à rien.
 */
export function isTransientDbError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  const code = typeof e?.code === "string" ? e.code : "";
  // SQLSTATE = exactement 5 caractères (ex. "42P01" colonne absente) → pas transitoire
  if (/^[0-9A-Z]{5}$/i.test(code)) return false;
  const msg = (typeof e?.message === "string" ? e.message : "").toLowerCase();
  return (
    code !== "" || // ECONNREFUSED, ETIMEDOUT, ECONNRESET, ENOTFOUND…
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("connection") ||
    msg.includes("connect") ||
    msg.includes("fetch failed") ||
    msg.includes("socket") ||
    msg.includes("-terminated")
  );
}

/** Réexécute une requête DB en cas d'erreur transitoire (base qui se réveille). */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  attempts = 3
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      if (i === attempts - 1 || !isTransientDbError(error)) throw error;
      await new Promise((r) => setTimeout(r, 350 * (i + 1)));
    }
  }
  throw last;
}

/** Ping DB (avec réessais) — utilisé par /api/health pour le bandeau d'alerte. */
export async function isDatabaseUp(): Promise<boolean> {
  if (!db) return false;
  try {
    await withDbRetry(() => db.execute(sql`select 1`), 3);
    return true;
  } catch (error) {
    console.error("[db] ping impossible :", error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Garde-fou anti-perte de données.
// En MODE DÉMO, les écritures vivent dans un petit fichier temporaire qui
// DISPARAÎT à chaque redémarrage/sieste de l'hébergeur (Render…). En production
// c'est un piège mortel : un article « sauvegardé » s'évapore une heure après.
// → En production, TOUTE écriture en mode démo est REFUSÉE (erreur explicite).
// → En développement local, le mode démo reste pleinement utilisable.
// ---------------------------------------------------------------------------

export class DemoWriteForbiddenError extends Error {
  constructor() {
    super(
      "Écriture refusée : le site est en mode démonstration (base de données non connectée)."
    );
    this.name = "DemoWriteForbiddenError";
  }
}

/** À appeler AVANT toute écriture dans le magasin démo. */
export function assertPersistentWrite(): void {
  if (process.env.NODE_ENV === "production") {
    throw new DemoWriteForbiddenError();
  }
}
