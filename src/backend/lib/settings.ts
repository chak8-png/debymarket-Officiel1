// Réglages du site (paires clé/valeur) — SERVEUR UNIQUEMENT.
// Stockage : table `settings` en PostgreSQL, sinon fichier JSON (mode démo).
// Utilisé aujourd'hui pour personnaliser les images d'accueil depuis le dashboard.
import "server-only";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { settings } from "../db/schema";
import { getDemoSetting, setDemoSetting } from "./demo-store";

// ---------------------------------------------------------------------------
// Clés autorisées (liste blanche — jamais de clé libre venant du client)
// ---------------------------------------------------------------------------
export const HOME_IMAGE_KEYS = [
  "home.hero", // grande image principale de l'accueil
  "home.card.homme",
  "home.card.femme",
  "home.card.electronique-electromenager",
  "home.card.jouets-jeux",
  "home.card.produit-erotique",
] as const;

export type HomeImageKey = (typeof HOME_IMAGE_KEYS)[number];

export function isAllowedSettingKey(key: string): key is HomeImageKey {
  return (HOME_IMAGE_KEYS as readonly string[]).includes(key);
}

/**
 * Crée la table settings si absente (idempotent).
 * Appelé à l'ÉCRITURE uniquement ; en lecture, une table absente = pas de
 * surcharge → les images par défaut s'affichent (dégradation gracieuse).
 */
async function ensureSettingsTable(): Promise<void> {
  if (!db) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS settings (
      key text PRIMARY KEY,
      value text NOT NULL
    )
  `);
}

/** Lit les réglages demandés. Absents → non présents dans le résultat. */
export async function getSettings(
  keys: readonly string[]
): Promise<Record<string, string>> {
  if (db) {
    try {
      const rows = await db.select().from(settings);
      const map: Record<string, string> = {};
      for (const r of rows) if (keys.includes(r.key)) map[r.key] = r.value;
      return map;
    } catch {
      return {}; // table pas encore créée → images par défaut
    }
  }
  const map: Record<string, string> = {};
  for (const k of keys) {
    const v = getDemoSetting(k);
    if (v !== null) map[k] = v;
  }
  return map;
}

/** Enregistre un réglage (value = null → suppression = retour au défaut). */
export async function setSetting(
  key: string,
  value: string | null
): Promise<boolean> {
  if (!isAllowedSettingKey(key)) return false;
  if (db) {
    try {
      await ensureSettingsTable();
      if (value === null) {
        await db.execute(sql`DELETE FROM settings WHERE key = ${key}`);
      } else {
        await db.execute(sql`
          INSERT INTO settings (key, value) VALUES (${key}, ${value})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `);
      }
      return true;
    } catch (error) {
      console.error("[settings] Erreur écriture :", error);
      return false;
    }
  }
  setDemoSetting(key, value);
  return true;
}
