// Diagnostic d'erreurs PostgreSQL — SERVEUR UNIQUEMENT.
import "server-only";

/**
 * Déballe l'erreur PostgreSQL RÉELLE : Drizzle enrobe souvent l'échec dans
 * une « Failed query: … » générique — le code SQLSTATE (42P01, 23505…) et
 * le vrai message sont dans error.cause. On descend la chaîne de causes
 * jusqu'à trouver un code à 5 caractères (ou épuiser la chaîne).
 */
export function pgErrorInfo(error: unknown): { code: string; raw: string } {
  let cur = error as
    | { code?: unknown; message?: unknown; cause?: unknown }
    | null;
  for (let i = 0; i < 5 && cur; i++) {
    if (typeof cur.code === "string" && /^[0-9A-Z]{5}$/i.test(cur.code)) break;
    if (cur.cause) {
      cur = cur.cause as typeof cur;
    } else {
      break;
    }
  }
  const code = typeof cur?.code === "string" ? cur.code : "?";
  const raw =
    (typeof cur?.message === "string" ? cur.message : "") ||
    (error instanceof Error ? error.message : "");
  return { code, raw };
}
