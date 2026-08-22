// Handler : POST /api/admin/restore — RESTAURE la boutique depuis un fichier
// de sauvegarde JSON (celui téléchargé via GET /api/admin/backup).
// ⚠️ Remplace TOUT le contenu actuel (produits, commandes, réglages).
// (protégé par middleware.ts : session admin signée + anti-CSRF Origin)
import { NextResponse } from "next/server";
import { importBackup } from "@/backend/services/restore";
import {
  readJsonBody,
  BodyTooLargeError,
  demoWriteGuardResponse,
} from "@/backend/lib/http-guards";

// 50 Mo max — les sauvegardes avec photos base64 dépassent facilement 8 Mo.
const MAX_BODY = 50 * 1024 * 1024;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await readJsonBody<unknown>(req, MAX_BODY);
  } catch (e) {
    if (e instanceof BodyTooLargeError) {
      return NextResponse.json(
        { ok: false, error: "Fichier trop volumineux (50 Mo maximum)." },
        { status: 413 }
      );
    }
    throw e;
  }
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "Fichier illisible — ce n'est pas un JSON valide." },
      { status: 400 }
    );
  }

  try {
    const result = await importBackup(body);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    // Mode démo en production : écriture refusée (elle serait perdue).
    const guard = demoWriteGuardResponse(e);
    if (guard) return guard;
    console.error("[restore] Erreur inattendue :", e);
    return NextResponse.json(
      { ok: false, error: "Restauration impossible — réessayez." },
      { status: 500 }
    );
  }
}
