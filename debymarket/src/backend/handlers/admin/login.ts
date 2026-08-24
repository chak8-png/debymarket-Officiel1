// Handler : POST /api/admin/login — mot de passe admin → cookie de session SIGNÉ.
// Sécurité :
//  - anti force brute : 5 échecs → blocage 15 min (par IP)
//  - comparaison du mot de passe en TEMPS CONSTANT (crypto.timingSafeEqual)
//  - cookie de session HMAC-SHA256 signé (cf. backend/lib/session.ts)
import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  createAdminSessionToken,
} from "@/backend/lib/session";
import { rateLimitHit, rateLimitReset } from "@/backend/lib/rate-limit";
import { getClientIp, readJsonBody, BodyTooLargeError } from "@/backend/lib/http-guards";

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000; // 15 minutes

/** Compare sans fuite de timing (compare les empreintes SHA-256). */
function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const key = `admin-login:${ip}`;

  // Anti force brute (vérifié AVANT tout traitement)
  const gate = rateLimitHit(key, MAX_FAILS, LOCK_MS);
  if (!gate.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `Trop de tentatives. Réessayez dans ${Math.ceil(gate.retryAfterSec / 60)} minute(s).`,
      },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } }
    );
  }

  let body: { password?: unknown } | null;
  try {
    body = await readJsonBody<{ password?: unknown }>(req, 4 * 1024); // 4 Ko max
  } catch (e) {
    if (e instanceof BodyTooLargeError) {
      return NextResponse.json(
        { ok: false, error: "Requête trop volumineuse." },
        { status: 413 }
      );
    }
    throw e;
  }
  const password = typeof body?.password === "string" ? body.password : "";

  const expected = process.env.ADMIN_PASSWORD ?? "Debymarket2026"; // défaut : DEV uniquement
  if (!password || !passwordMatches(password, expected)) {
    return NextResponse.json(
      { ok: false, error: "Mot de passe incorrect." },
      { status: 401 }
    );
  }

  // Succès → compteur remis à zéro + session signée (8h)
  rateLimitReset(key);
  const token = await createAdminSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, // inaccessible au JavaScript (anti-XSS)
    sameSite: "lax", // anti-CSRF
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
    secure: process.env.NODE_ENV === "production", // HTTPS uniquement en prod
  });
  return res;
}
