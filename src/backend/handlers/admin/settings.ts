// Handlers : /api/admin/settings — réglages du site (images d'accueil).
//   GET  → lit les surcharges actives {clé: valeur}
//   POST → {key, value} enregistre ; value vide/null → retour à l'image par défaut
// (protégé par middleware.ts : session admin signée + anti-CSRF Origin)
import { NextResponse } from "next/server";
import {
  HOME_IMAGE_KEYS,
  getSettings,
  isAllowedSettingKey,
  setSetting,
} from "@/backend/lib/settings";
import { readJsonBody, BodyTooLargeError } from "@/backend/lib/http-guards";

// Image acceptée : ~1 Mo max en base64 (≈ 750 Ko d'image JPEG) — après le
// redimensionnement côté dashboard (max 1600 px) on reste bien en dessous.
const MAX_DATA_URI = 1_000_000;

/** Valide/normalise une valeur image ; "" ou null = suppression (défaut). */
function cleanImageValue(v: unknown): string | null | false {
  if (v === null || v === undefined || v === "") return null; // reset
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (s.startsWith("/images/") && s.length <= 500) return s;
  if (s.startsWith("https://") && s.length <= 1000) return s; // jamais http://
  if (/^data:image\/(jpeg|jpg|png|webp);base64,/.test(s) && s.length <= MAX_DATA_URI)
    return s; // jamais de svg/svg+xml embarqué (anti-XSS)
  return false;
}

export async function GET() {
  const overrides = await getSettings(HOME_IMAGE_KEYS);
  return NextResponse.json({ ok: true, settings: overrides });
}

export async function POST(req: Request) {
  let body: { key?: unknown; value?: unknown } | null;
  try {
    body = await readJsonBody(req, 1_400_000); // 1,4 Mo (photo)
  } catch (e) {
    if (e instanceof BodyTooLargeError) {
      return NextResponse.json(
        { ok: false, error: "Image trop lourde (1 Mo max après redimensionnement)." },
        { status: 413 }
      );
    }
    throw e;
  }

  const key = typeof body?.key === "string" ? body.key : "";
  if (!isAllowedSettingKey(key)) {
    return NextResponse.json(
      { ok: false, error: "Réglage inconnu." },
      { status: 400 }
    );
  }

  const value = cleanImageValue(body?.value);
  if (value === false) {
    return NextResponse.json(
      {
        ok: false,
        error: "Image invalide — formats acceptés : JPEG/PNG/WebP, ou lien https.",
      },
      { status: 400 }
    );
  }

  const done = await setSetting(key, value);
  if (!done) {
    return NextResponse.json(
      { ok: false, error: "Écriture impossible — vérifiez la connexion à la base." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
