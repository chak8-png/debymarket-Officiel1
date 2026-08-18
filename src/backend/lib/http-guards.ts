// Garde-fous HTTP — SERVEUR UNIQUEMENT.
import "server-only";

/** IP client (derrière Netlify/proxy : premier élément de x-forwarded-for). */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;// on ne fait confiance qu'au proxy de la plateforme
  }
  return req.headers.get("x-real-ip")?.trim() || "inconnu";
}

class BodyTooLargeError extends Error {}

/**
 * Lit un corps JSON en imposant une TAILLE MAXIMALE (anti-DoS).
 * Retourne null si le JSON est invalide ; lève BodyTooLargeError si dépassé.
 */
export async function readJsonBody<T>(
  req: Request,
  maxBytes: number
): Promise<T | null> {
  try {
    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > maxBytes) throw new BodyTooLargeError();
    const text = await req.text();
    if (text.length > maxBytes) throw new BodyTooLargeError();
    return JSON.parse(text) as T;
  } catch (e) {
    if (e instanceof BodyTooLargeError) throw e;
    return null;
  }
}

export { BodyTooLargeError };
