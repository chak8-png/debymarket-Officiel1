// Route : GET /api/health — état de santé de la boutique (sans données sensibles).
//
// Sert au tableau de bord pour afficher le bandeau d'alerte « mode démo »
// (base de données injoignable) AVANT que la propriétaire ne saisisse des
// articles qui seraient perdus. Teste réellement la base (SELECT 1 avec
// réessais) : un simple « la variable existe » ne suffit pas.
//   persistant: true  → écritures conservées (base PostgreSQL active) ✅
//   persistant: false → mode démo (rien n'est conservé) ⚠️
import { NextResponse } from "next/server";
import { isDatabaseUp } from "@/backend/db";

export const dynamic = "force-dynamic"; // jamais de cache : état en temps réel

export async function GET() {
  const up = await isDatabaseUp();
  return NextResponse.json(
    {
      ok: true,
      mode: up ? "database" : "demo",
      persistant: up,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
