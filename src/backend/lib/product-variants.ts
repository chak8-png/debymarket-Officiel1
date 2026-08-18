// Galerie photos & couleurs des produits — helpers PARTAGÉS (client + serveur).
//
// Stockage en base : colonnes TEXT contenant du JSON (ou "" quand vide) :
//   gallery → ["/images/products/x.jpg", "data:image/jpeg;base64,…", …]
//   colors  → [{ "name": "Blanc", "hex": "#f8fafc" }, …]
// Ici : types, constantes et fonctions d'analyse TOLÉRANTES (un JSON corrompu
// retourne simplement une liste vide — jamais d'exception).
//
// ⚠️ Ne PAS importer "server-only" : ce module est aussi utilisé par les
// composants client (éditeur admin, sélecteur de couleur).

/** Plafonds durs (appliqués côté serveur ET rappelés dans l'éditeur). */
export const MAX_GALLERY = 5; // photos supplémentaires (≠ photo principale)
export const MAX_COLORS = 8; // options de couleur par produit
export const MAX_COLOR_NAME = 30;

/** Couleur proposée à la vente. hex toujours en #RRGGBB (null si non précisé). */
export interface ProductColor {
  name: string;
  hex: string | null;
}

/** Photos supplémentaires d'un produit (ordre conservé). Jamais d'exception. */
export function parseGallery(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string" && x !== "").slice(0, MAX_GALLERY);
  } catch {
    return [];
  }
}

/** Couleurs d'un produit. Jamais d'exception. */
export function parseColors(raw: string | null | undefined): ProductColor[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    const out: ProductColor[] = [];
    for (const x of v) {
      if (
        typeof x === "object" &&
        x !== null &&
        typeof (x as { name?: unknown }).name === "string"
      ) {
        const name = (x as { name: string }).name.trim();
        if (name === "" || name.length > MAX_COLOR_NAME) continue;
        const rawHex = (x as { hex?: unknown }).hex;
        const hex =
          typeof rawHex === "string" && /^#[0-9a-fA-F]{6}$/.test(rawHex.trim())
            ? rawHex.trim().toLowerCase()
            : null;
        out.push({ name, hex });
      }
      if (out.length >= MAX_COLORS) break;
    }
    return out;
  } catch {
    return [];
  }
}

/** Sérialisation pour l'écriture en base ("" si liste vide → colonne propre). */
export function serializeGallery(list: string[]): string {
  return list.length > 0 ? JSON.stringify(list.slice(0, MAX_GALLERY)) : "";
}
export function serializeColors(list: ProductColor[]): string {
  return list.length > 0 ? JSON.stringify(list.slice(0, MAX_COLORS)) : "";
}

/** Liste d'affichage complète : photo principale d'abord, puis la galerie (dédoublonnée). */
export function displayImages(
  imageUrl: string | null | undefined,
  galleryRaw: string | null | undefined
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const src of [imageUrl ?? "", ...parseGallery(galleryRaw)]) {
    if (src !== "" && !seen.has(src)) {
      seen.add(src);
      out.push(src);
    }
  }
  return out;
}
