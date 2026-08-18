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

// Photo encodée en base64 acceptée jusqu'à ~800 Ko (≈ 600 Ko d'image JPEG).
const MAX_DATA_URI = 800_000;

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
  if (s.startsWith("/images/") && s.length <= 500) return s;
  if (s.startsWith("https://") && s.length <= 1000) return s;
  if (s.startsWith("data:image/") && s.length <= MAX_DATA_URI) return s;
  return null;
}

function cleanStock(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.max(0, Math.min(999999, Math.floor(v)));
}

// ── POST /api/admin/products — créer ─────────────────────────────────────

export async function POST(req: Request) {
  let body: Record<string, unknown> | null;
  try {
    body = await readJsonBody<Record<string, unknown>>(req, 1_400_000); // ~1,4 Mo (photo)
  } catch (e) {
    if (e instanceof BodyTooLargeError) {
      return NextResponse.json(
        { ok: false, error: "Requête trop volumineuse (photo trop lourde ?)." },
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
    body = await readJsonBody<Record<string, unknown>>(req, 1_400_000); // ~1,4 Mo (photo)
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
