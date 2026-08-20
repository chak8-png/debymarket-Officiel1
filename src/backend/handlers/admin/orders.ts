// Handler : PATCH /api/admin/orders/[id] — met à jour le statut d'une commande.
import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/backend/services/orders";
import { ORDER_STATUSES, type OrderStatus } from "@/backend/lib/constants";
import { readJsonBody, BodyTooLargeError, demoWriteGuardResponse } from "@/backend/lib/http-guards";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) {
    return NextResponse.json(
      { ok: false, error: "Identifiant invalide." },
      { status: 400 }
    );
  }

  let status: OrderStatus;
  try {
    const body = await readJsonBody<{ status?: OrderStatus }>(req, 8 * 1024); // 8 Ko max
    if (!body?.status || !ORDER_STATUSES.includes(body.status)) {
      throw new Error();
    }
    status = body.status;
  } catch (e) {
    if (e instanceof BodyTooLargeError) {
      return NextResponse.json(
        { ok: false, error: "Requête trop volumineuse." },
        { status: 413 }
      );
    }
    return NextResponse.json(
      { ok: false, error: "Statut invalide." },
      { status: 400 }
    );
  }

  let ok: boolean;
  try {
    ok = await updateOrderStatus(id, status);
  } catch (e) {
    // Mode démo en production : on REFUSE l'écriture (effet non persistant).
    const guard = demoWriteGuardResponse(e);
    if (guard) return guard;
    throw e;
  }
  return NextResponse.json(
    ok ? { ok: true } : { ok: false, error: "Commande introuvable." },
    { status: ok ? 200 : 404 }
  );
}
