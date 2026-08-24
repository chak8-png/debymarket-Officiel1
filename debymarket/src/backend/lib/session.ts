// Sessions admin SIGNÉES — HMAC-SHA256 (Web Crypto, compatible Edge + Node).
//
// Le cookie contient un jeton  « expiration.signature »  qui PROUVE la
// connaissance du mot de passe admin : impossible à forger sans lui
// (un cookie « dm_admin=1 » fabriqué à la main est rejeté).
// Expiration réelle intégrée au jeton (8h), pas seulement côté navigateur.
const COOKIE_NAME = "dm_admin";
export const SESSION_COOKIE = COOKIE_NAME;
export const SESSION_MAX_AGE_SEC = 60 * 60 * 8; // 8 heures

/** Clé de signature : le mot de passe admin (jamais stocké ailleurs). */
function secret(): string {
  return process.env.ADMIN_PASSWORD ?? "Debymarket2026"; // défaut : DEV uniquement
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Signature HMAC-SHA256 de `data`, avec domaine séparé anti-réutilisation. */
async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`dm-admin-v1|${data}`)
  );
  return toBase64Url(new Uint8Array(sig));
}

/** Comparaison en temps constant (anti timing attack). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Crée un jeton de session fraîchement signé (expire dans 8h). */
export async function createAdminSessionToken(): Promise<string> {
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC);
  return `${exp}.${await hmac(exp)}`;
}

/** Vérifie un jeton : signature valide ET non expiré. */
export async function verifyAdminSessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d{10,13}$/.test(exp)) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false; // expiré
  const expected = await hmac(exp);
  return safeEqual(sig, expected);
}
