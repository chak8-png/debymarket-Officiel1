// Route PUBLIQUE : /api/config/pixel — résout l'ID du Pixel Meta actif.
// Priorité : réglage admin en base (clé « meta.pixel.id ») > défaut du code.
// "off" = pixel désactivé (id vide). Ne renvoie RIEN de sensible (l'ID Pixel
// est public par nature : visible dans le code source des pages).
import { NextResponse } from "next/server";
import { getSettings, META_PIXEL_KEY } from "@/backend/lib/settings";
import { DEFAULT_META_PIXEL_ID } from "@/backend/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  let pixelId = DEFAULT_META_PIXEL_ID;
  try {
    const overrides = await getSettings([META_PIXEL_KEY]);
    const v = overrides[META_PIXEL_KEY];
    if (v === "off") pixelId = "";
    else if (v && /^\d{6,20}$/.test(v)) pixelId = v;
  } catch {
    // base indisponible → valeur par défaut (dégradation gracieuse)
  }
  return NextResponse.json({ ok: true, pixelId });
}
