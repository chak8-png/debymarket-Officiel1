// VUE : page catégorie (fil d'Ariane + sous-catégories + produits).
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProducts } from "@/backend/lib/products";
import {
  getCategoryBySlug,
  getChildren,
  getBreadcrumb,
  isAdultCategory,
} from "@/backend/lib/categories";
import Filters from "@/frontend/components/product/Filters";

export default async function CategoryView({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const children = getChildren(category.id);
  const crumbs = getBreadcrumb(category.slug);
  const products = await fetchProducts({ categorySlug: category.slug, limit: 200 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Fil d'Ariane */}
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
        <Link href="/" className="hover:text-brand-600">
          Accueil
        </Link>
        {crumbs.map((c, i) => (
          <span key={c.id} className="flex items-center gap-1.5">
            <span>/</span>
            {i === crumbs.length - 1 ? (
              <span className="text-gray-700">{c.name}</span>
            ) : (
              <Link href={`/categories/${c.slug}`} className="hover:text-brand-600">
                {c.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-3xl">
          {category.icon}
        </span>
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight">{category.name}</h1>
        </div>
      </div>

      {/* Avertissement espace adulte */}
      {isAdultCategory(category.id) && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-600">
          🔞 Section réservée aux personnes majeures (18 ans et plus) —
          commandes livrées dans un emballage discret.
        </p>
      )}

      {/* Sous-catégories */}
      {children.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/categories/${child.slug}`}
              className="flex items-center gap-1.5 rounded-full border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:border-brand-400 hover:text-brand-600"
            >
              {child.icon} {child.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Filters products={products} />
      </div>
    </div>
  );
}
