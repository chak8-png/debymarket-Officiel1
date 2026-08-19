// Handlers : /api/admin/products — gestion du catalogue.
//   POST   /api/admin/products        → créer un produit
//   PATCH  /api/admin/products/[id]   → modifier les infos et/ou le stock
//   DELETE /api/admin/products/[id]   → supprimer un produit
import { NextResponse } from "next/server";
import {
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
  type ProductInput,
} from "@/backend/lib/products";
import { getCategoryById, getChildren } from "@/backend/lib/categories";
import { readJsonBody, BodyTooLargeError } from "@/backend/lib/http-guards";
import {
  MAX_GALLERY,
  MAX_COLORS,
  MAX_COLOR_NAME,
  MAX_SIZES,
  MAX_SIZE_LABEL,
  type ProductColor,
} from "@/backend/lib/product-variants";

// Photo encodée en base64 acceptée jusqu'à ~800 Ko (≈ 600 Ko d'image JPEG).
const MAX_DATA_URI = 800_000;
// Photos de galerie : compressées plus fort côté navigateur (640px) → ≤ 450 Ko chacune.
const MAX_GALLERY_DATA_URI = 450_000;
// Corps de requête : photo principale + jusqu'à 5 photos de galerie + marge JSON.
const MAX_BODY = 3_800_000;

// ── Validation des champs ────────────────────────────────────────────────

function cleanName(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length >= 2 && s.length <= 120 ? s : null;
}

function cleanDescription(v: unknown): string {
  return typeof v === "string" ? v.trim().slice(0, 2000) : "";
}

/** Prix en FCFA : entier ≥ 0 (jamais de flottant). */
function cleanPrice(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const n = Math.round(v);
  return n >= 0 && n <= 100_000_000 ? n : null;
}

/** Catégorie valide = existante ET feuille (sans sous-catégorie). */
function cleanCategoryId(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isInteger(v)) return null;
  const cat = getCategoryById(v);
  if (!cat || getChildren(cat.id).length > 0) return null;
  return v;
}

function cleanEmoji(v: unknown): string {
  if (typeof v !== "string") return "🛍️";
  const s = v.trim();
  return s.length > 0 && s.length <= 8 ? s : "🛍️";
}

/**
 * Photo : chemin local (/images/…), URL http(s), ou image encodée
 * (data:image/…;base64). Chaîne vide/absente → pas de photo (null).
 */
function cleanImageUrl(v: unknown): string | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  const s = v.trim();
  // SVG refusé (peut embarquer du script) — comme pour la galerie et l'accueil
  if (s.startsWith("data:image/svg")) return null;
  if (s.startsWith("/images/") && s.length <= 500) return s;
  if (s.startsWith("https://") && s.length <= 1000) return s;
  if (s.startsWith("data:image/") && s.length <= MAX_DATA_URI) return s;
  return null;
}

/**
 * Galerie : tableau de photos (mêmes formats que la photo principale, photos
 * encodées plafonnées plus bas). Entrées invalides ignorées, 5 max conservées.
 * ⚠️ Jamais de SVG (risque de script embarqué) — cleanImageUrl l'exige déjà
 * via le préfixe data:image/ … on durcit ici en refusant image/svg.
 */
function cleanGallery(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") continue;
    const s = item.trim();
    if (s.startsWith("data:image/svg")) continue;
    if (s.startsWith("/images/") && s.length <= 500) out.push(s);
    else if (s.startsWith("https://") && s.length <= 1000) out.push(s);
    else if (s.startsWith("data:image/") && s.length <= MAX_GALLERY_DATA_URI) out.push(s);
    if (out.length >= MAX_GALLERY) break;
  }
  // dédoublonnage en conservant l'ordre
  return [...new Set(out)];
}

/**
 * Couleurs : nom 1-30 caractères (sans caractères de contrôle) + hex #RRGGBB
 * optionnel. Doublons de noms supprimés, 8 max.
 */
function cleanColors(v: unknown): ProductColor[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: ProductColor[] = [];
  for (const item of v) {
    if (typeof item !== "object" || item === null) continue;
    const rawName = (item as { name?: unknown }).name;
    if (typeof rawName !== "string") continue;
    // retire les caractères de contrôle (NUL…US, DEL) — sécurité export Excel
    const name = rawName
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .trim()
      .slice(0, MAX_COLOR_NAME);
    if (name === "") continue;
    const key = name.toLocaleLowerCase("fr");
    if (seen.has(key)) continue;
    seen.add(key);
    const rawHex = (item as { hex?: unknown }).hex;
    const hex =
      typeof rawHex === "string" && /^#[0-9a-fA-F]{6}$/.test(rawHex.trim())
        ? rawHex.trim().toLowerCase()
        : null;
    out.push({ name, hex });
    if (out.length >= MAX_COLORS) break;
  }
  return out;
}

/**
 * Tailles / pointures : étiquettes courtes ("S", "XL", "42"…),
 * caractères de contrôle retirés, doublons ignorés, 15 max.
 */
function cleanSizes(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") continue;
    const label = item.replace(/[^\p{L}\p{N} .+-]/gu, "").trim().slice(0, MAX_SIZE_LABEL);
    if (label === "") continue;
    const key = label.toLocaleLowerCase("fr");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
    if (out.length >= MAX_SIZES) break;
  }
  return out;
}

function cleanStock(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.max(0, Math.min(999999, Math.floor(v)));
}

// ── POST /api/admin/products — créer ─────────────────────────────────────

export async function POST(req: Request) {
  let body: Record<string, unknown> | null;
  try {
    body = await readJsonBody<Record<string, unknown>>(req, MAX_BODY);
  } catch (e) {
    if (e instanceof BodyTooLargeError) {
      return NextResponse.json(
        { ok: false, error: "Requête trop volumineuse (photos trop lourdes ?)." },
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

  const name = cleanName(body.name);
  const price = cleanPrice(body.price);
  const categoryId = cleanCategoryId(body.categoryId);
  if (!name || price === null || categoryId === null) {
    return NextResponse.json(
      { ok: false, error: "Nom (2-120 car.), prix ou catégorie invalide." },
      { status: 400 }
    );
  }

  const input: ProductInput & { stock: number } = {
    name,
    description: cleanDescription(body.description),
    price,
    categoryId,
    image: cleanEmoji(body.image),
    imageUrl: cleanImageUrl(body.imageUrl),
    gallery: cleanGallery(body.gallery),
    colors: cleanColors(body.colors),
    sizes: cleanSizes(body.sizes),
    isFeatured: typeof body.isFeatured === "boolean" ? body.isFeatured : false,
    isActive: typeof body.isActive === "boolean" ? body.isActive : true,
    stock: cleanStock(body.stock) ?? 0,
  };

  const product = await createProduct(input);
  if (!product) {
    return NextResponse.json(
      {
        ok: false,
        error: "Création impossible — vérifiez la connexion à la base.",
      },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, product }, { status: 201 });
}

// ── PATCH /api/admin/products/[id] — éditer ──────────────────────────────

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

  let body: Record<string, unknown> | null;
  try {
    body = await readJsonBody<Record<string, unknown>>(req, MAX_BODY);
  } catch (e) {
    if (e instanceof BodyTooLargeError) {
      return NextResponse.json(
        { ok: false, error: "Requête trop volumineuse (photos trop lourdes ?)." },
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

  // Champs « infos » (hors stock)
  const details: Partial<ProductInput> = {};
  if (body.name !== undefined) {
    const v = cleanName(body.name);
    if (!v)
      return NextResponse.json(
        { ok: false, error: "Nom invalide (2-120 caractères)." },
        { status: 400 }
      );
    details.name = v;
  }
  if (body.description !== undefined)
    details.description = cleanDescription(body.description);
  if (body.price !== undefined) {
    const v = cleanPrice(body.price);
    if (v === null)
      return NextResponse.json(
        { ok: false, error: "Prix invalide." },
        { status: 400 }
      );
    details.price = v;
  }
  if (body.categoryId !== undefined) {
    const v = cleanCategoryId(body.categoryId);
    if (v === null)
      return NextResponse.json(
        { ok: false, error: "Catégorie invalide." },
        { status: 400 }
      );
    details.categoryId = v;
  }
  if (body.image !== undefined) details.image = cleanEmoji(body.image);
  if (body.imageUrl !== undefined)
    details.imageUrl = cleanImageUrl(body.imageUrl);
  if (body.gallery !== undefined) details.gallery = cleanGallery(body.gallery);
  if (body.colors !== undefined) details.colors = cleanColors(body.colors);
  if (body.sizes !== undefined) details.sizes = cleanSizes(body.sizes);
  if (typeof body.isFeatured === "boolean") details.isFeatured = body.isFeatured;
  if (typeof body.isActive === "boolean") details.isActive = body.isActive;

  // Stock (peut être envoyé seul, ex. StockControl)
  const hasStock = body.stock !== undefined;
  const stock = hasStock ? cleanStock(body.stock) : null;
  if (hasStock && stock === null) {
    return NextResponse.json(
      { ok: false, error: "Stock invalide." },
      { status: 400 }
    );
  }

  if (Object.keys(details).length === 0 && !hasStock) {
    return NextResponse.json(
      { ok: false, error: "Aucune modification à enregistrer." },
      { status: 400 }
    );
  }

  if (Object.keys(details).length > 0) {
    const ok = await updateProduct(id, details);
    if (!ok)
      return NextResponse.json(
        { ok: false, error: "Produit introuvable." },
        { status: 404 }
      );
  }
  if (hasStock && stock !== null) {
    const ok = await updateProductStock(id, stock);
    if (!ok)
      return NextResponse.json(
        { ok: false, error: "Produit introuvable." },
        { status: 404 }
      );
  }

  return NextResponse.json({ ok: true });
}

// ── DELETE /api/admin/products/[id] — supprimer ──────────────────────────

export async function DELETE(
  _req: Request,
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

  const ok = await deleteProduct(id);
  return NextResponse.json(
    ok ? { ok: true } : { ok: false, error: "Produit introuvable." },
    { status: ok ? 200 : 404 }
  );
}
