// Limitation de débit (anti force brute / anti-spam) — SERVEUR UNIQUEMENT.
// Comme demo-store : petit fichier JSON partagé (Next.js 14+ isole les
// contextes des routes, ni variable module ni globalThis ne sont fiables).
// En hébergement serverless, la limite s'applique par instance (best-effort) —
// pour une protection distribuée, brancher un service type Upstash.
import "server-only";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const FILE = join(tmpdir(), "debymarket-ratelimit.json");

interface Bucket {
  count: number;
  resetAt: number; // epoch ms
}

function load(): Record<string, Bucket> {
  try {
    return JSON.parse(readFileSync(FILE, "utf8")) as Record<string, Bucket>;
  } catch {
    return {};
  }
}

function save(data: Record<string, Bucket>): void {
  try {
    // Nettoyage au passage : jette les seaux expirés (évite la croissance du fichier)
    const now = Date.now();
    for (const k of Object.keys(data)) if (data[k].resetAt <= now) delete data[k];
    writeFileSync(FILE, JSON.stringify(data));
  } catch {
    // silencieux — la sécurité prime déjà via les autres contrôles
  }
}

/**
 * Enregistre un essai pour `key`. Retourne si l'action est autorisée,
 * et sinon dans combien de secondes réessayer.
 */
export function rateLimitHit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const data = load();
  const bucket = data[key];
  if (!bucket || bucket.resetAt <= now) {
    data[key] = { count: 1, resetAt: now + windowMs };
    save(data);
    return { allowed: true, retryAfterSec: 0 };
  }
  bucket.count += 1;
  const allowed = bucket.count <= limit;
  save(data);
  return {
    allowed,
    retryAfterSec: allowed ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/** Remet le compteur à zéro (ex : après un login réussi). */
export function rateLimitReset(key: string): void {
  const data = load();
  if (key in data) {
    delete data[key];
    save(data);
  }
}
