// Handler : GET /api/admin/backup — SAUVEGARDE complète de la boutique (JSON).
// Contenu : catalogue (avec galeries/couleurs/tailles), commandes (articles
// inclus), réglages d'accueil. À télécharger régulièrement (ex : chaque
// semaine) et à conserver en lieu sûr — complète l'export Excel comptable.
// (protégé par middleware.ts : session admin obligatoire)
import { NextResponse } from "next/server";
import { fetchProducts } from "@/backend/lib/products";
import { listOrders } from "@/backend/services/orders";
import { getSettings, HOME_IMAGE_KEYS } from "@/backend/lib/settings";

export async function GET() {
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
