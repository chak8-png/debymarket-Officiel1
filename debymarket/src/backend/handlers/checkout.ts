// Handler : POST /api/checkout — crée une commande (paiement à la livraison).
// Sécurité : anti-spam 10 commandes/min par IP + corps limité à 64 Ko.
import { NextResponse } from "next/server";
import { createOrder, type CheckoutInput } from "@/backend/services/orders";
import { rateLimitHit } from "@/backend/lib/rate-limit";
import { getClientIp, readJsonBody, BodyTooLargeError, demoWriteGuardResponse } from "@/backend/lib/http-guards";

export async function POST(req: Request) {
  const gate = rateLimitHit(`checkout:${getClientIp(req)}`, 10, 60_000);
  if (!gate.allowed) {
    return NextResponse.json(
      { ok: false, error: "Trop de commandes en peu de temps — réessayez dans une minute." },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } }
    );
  }

  let body: CheckoutInput | null;
  try {
    body = await readJsonBody<CheckoutInput>(req, 64 * 1024); // 64 Ko max
  } catch (e) {
    if (e instanceof BodyTooLargeError) {
      return NextResponse.json(
        { ok: false, error: "Requête trop volumineuse." },
        { status: 413 }
      );
    }
    throw e;
  }
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "Requête invalide." },
      { status: 400 }
    );
  }

  let result: Awaited<ReturnType<typeof createOrder>>;
  try {
    result = await createOrder(body);
  } catch (e) {
    // Boutique temporairement en mode démo (base injoignable) : la commande
    // est REFUSÉE proprement plutôt qu'enregistrée dans un fichier éphémère.
    const guard = demoWriteGuardResponse(
      e,
      "Souci technique temporaire : votre commande n'a PAS été enregistrée. Réessayez dans une minute, ou commandez directement sur WhatsApp au 07 03 13 45 82."
    );
    if (guard) return guard;
    throw e;
  }
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result, { status: 201 });
}
