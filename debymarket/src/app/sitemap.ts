// sitemap.xml généré par Next.js (/sitemap.xml).
// Transmet aux moteurs de recherche TOUTES les pages du site :
// pages fixes, catalogue, 20 catégories et fiches produits.
import type { MetadataRoute } from "next";
import { CATEGORY_LIST } from "@/backend/lib/categories";
import { fetchProducts } from "@/backend/lib/products";

// L'adresse publique du site (définie sur Netlify ; repli = domaine actuel)
const BASE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://debymarket.netlify.app"
).replace(/\/$/, "");

export const dynamic = "force-dynamic"; // toujours à jour (nocache)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Pages fixes ──────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/a-propos`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/checkout`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // ── Catégories (20 : univers + sous-catégories) ─────────────────────
  const categoryPages: MetadataRoute.Sitemap = CATEGORY_LIST.map((c) => ({
    url: `${BASE_URL}/categories/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: c.parentId === null ? 0.8 : 0.7,
  }));

  // ── Fiches produits (depuis la base, ou le catalogue de démo) ───────
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await fetchProducts({ limit: 500 });
    productPages = products
      .filter((p) => p.isActive)
      .map((p) => ({
        url: `${BASE_URL}/products/${p.slug}`,
        lastModified: p.createdAt ?? now,
        changeFrequency: "weekly",
        priority: 0.6,
      }));
  } catch {
    // La base est injoignable → sitemap dégradé mais valide
  }

  return [...staticPages, ...categoryPages, ...productPages];
}
