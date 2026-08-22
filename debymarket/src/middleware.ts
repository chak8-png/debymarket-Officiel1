import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/backend/lib/session";

// Méthodes qui MODIFIENT des données (à protéger contre le CSRF).
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Anti-CSRF (défense en profondeur, en plus du cookie SameSite=Lax) :
 * toute requête mutatrice doit provenir de NOTRE propre origine.
 * Un formulaire/fetch déclenché depuis un site tiers porte un en-tête
 * Origin différent du Host demandé → rejeté (403).
 *
 * ⚠️ On compare à l'en-tête HOST (celui réellement demandé par le client)
 * et NON à req.nextUrl.host : ce dernier reflète l'adresse de liaison
 * interne du serveur (ex. « localhost », ou l'URL interne du proxy
 * serverless) — l'utiliser bloquerait TOUS les formulaires légitimes.
 * L'absence d'Origin est tolérée (curl, navigateurs en mode très privé).
 */
function isCrossOriginAttack(req: NextRequest): boolean {
  if (!MUTATING_METHODS.has(req.method)) return false;
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host !== host;
  } catch {
    return true; // Origin illisible → par prudence on refuse
  }
}

// Protège /admin et /api/admin (sauf les routes de login).
// Le cookie contient un jeton HMAC-SHA256 signé : un cookie forgé est rejeté.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1️⃣ Anti-CSRF sur toutes les API sensibles (admin, commandes, seed)
  if (isCrossOriginAttack(req)) {
    return NextResponse.json(
      { ok: false, error: "Origine de la requête refusée." },
      { status: 403 }
    );
  }

  // 2️⃣ /api/checkout et /api/seed : filtrés ci-dessus uniquement —
  //    leur protection métier est dans leurs handlers (rate-limit, secret).
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  // 3️⃣ Les pages/routes de login restent accessibles
  if (
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/api/admin/login")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (await verifyAdminSessionToken(token)) return NextResponse.next();

  // API → 401 JSON ; page → redirection vers le formulaire de login
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, error: "Non autorisé." },
      { status: 401 }
    );
  }
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = ""; // pas de paramètres sortants → pas de redirection ouverte
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/checkout", "/api/seed"],
};
