// Handler : GET /api/admin/backup — SAUVEGARDE complète de la boutique (JSON).
// Contenu : catalogue (avec galeries/couleurs/tailles), commandes (articles
// inclus), réglages d'accueil. À télécharger régulièrement (ex : chaque
// semaine) et à conserver en lieu sûr — complète l'export Excel comptable.
// (protégé par middleware.ts : session admin obligatoire)
import { NextResponse } from "next/server";
import { fetchProducts } from "@/backend/lib/products";
import { listOrders } from "@/backend/services/orders";
import { getSettings, HOME_IMAGE_KEYS } from "@/backend/lib/settings";
import { db, DemoWriteForbiddenError } from "@/backend/db";
import { demoWriteGuardResponse } from "@/backend/lib/http-guards";

export async function GET() {
  // En production SANS base (mode démo), une « sauvegarde » ne contiendrait
  // que les produits d'exemple : DANGER si on la restaure ensuite par-dessus
  // le vrai catalogue. → Refusée avec un message clair (l'écran de santé
  // /api/health permet de vérifier que la base est bien de retour).
  if (!db && process.env.NODE_ENV === "production") {
    const guard = demoWriteGuardResponse(new DemoWriteForbiddenError());
    if (guard) return guard;
  }
  const [products, orders, settings] = await Promise.all([
    fetchProducts({ includeInactive: true, limit: 100_000 }),
    listOrders(),
    getSettings(HOME_IMAGE_KEYS),
  ]);

  const payload = {
    application: "debymarket",
    exporteLe: new Date().toISOString(),
    mode: process.env.DATABASE_URL ? "postgresql" : "démo (mémoire)",
    totaux: {
      produits: products.length,
      commandes: orders.length,
      reglages: Object.keys(settings).length,
    },
    produits: products,
    commandes: orders,
    reglages: settings,
  };

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="debymarket-sauvegarde-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
