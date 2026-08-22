// VUE : fiche produit détaillée (/products/[slug]).
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchProductBySlug,
  fetchRelatedProducts,
} from "@/backend/lib/products";
import { getCategoryById, getBreadcrumb } from "@/backend/lib/categories";
import { formatXOF } from "@/backend/lib/format";
import { DELIVERY_TIME, DELIVERY_AREA } from "@/backend/lib/constants";
import Gallery from "@/frontend/components/product/Gallery";
import PurchasePanel from "@/frontend/components/product/PurchasePanel";
import ProductCard from "@/frontend/components/product/ProductCard";
import Stars from "@/frontend/components/ui/Stars";
import {
  displayImages,
  parseColors,
  parseSizes,
} from "@/backend/lib/product-variants";

export default async function ProductDetailView({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product || !product.isActive) notFound();

  const related = await fetchRelatedProducts(product);
  const category = getCategoryById(product.categoryId);
  const crumbs = category ? getBreadcrumb(category.slug) : [];
  // 📸 Galerie (photo principale + supplémentaires) et 🎨 couleurs proposées
  const images = displayImages(product.imageUrl, product.gallery);
  const colors = parseColors(product.colors);
  const sizes = parseSizes(product.sizes);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Fil d'Ariane */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
        <Link href="/" className="hover:text-brand-600">
          Accueil
        </Link>
        {crumbs.map((c) => (
          <span key={c.id} className="flex items-center gap-1.5">
            <span>/</span>
            <Link href={`/categories/${c.slug}`} className="hover:text-brand-600">
              {c.name}
            </Link>
          </span>
        ))}
        <span className="text-gray-400">/ {product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <Gallery images={images} emoji={product.image} name={product.name} />

        {/* Informations */}
        <div>
          <div className="flex items-center gap-2">
            {category && (
              <Link
                href={`/categories/${category.slug}`}
                className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-200"
              >
                {category.name}
              </Link>
            )}
            <Stars rating={product.rating} />
          </div>

          <h1 className="mt-3 text-3xl font-display font-semibold tracking-tight">{product.name}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <p className="text-3xl font-display font-semibold tracking-tight text-brand-600">
              {formatXOF(product.price)}
            </p>
          </div>

          <p className="mt-4 leading-relaxed text-gray-600">
            {product.description}
          </p>

          {/* Stock */}
          <p className="mt-3 text-sm">
            {product.stock > 5 ? (
              <span className="font-medium text-green-700">✅ En stock</span>
            ) : product.stock > 0 ? (
              <span className="font-medium text-amber-700">
                ⚠️ Plus que {product.stock} en stock !
              </span>
            ) : (
              <span className="font-medium text-red-600">❌ Rupture de stock</span>
            )}
          </p>

          <div className="mt-6">
            <PurchasePanel
              colors={colors}
              sizes={sizes}
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                oldPrice: product.oldPrice,
                image: product.image,
                imageUrl: product.imageUrl,
              }}
            />
          </div>

          {/* Réassurance livraison */}
          <div className="mt-8 space-y-2.5 rounded-2xl border bg-white p-5 text-sm">
            <p className="flex items-center gap-2">
              <span>🚚</span> Livraison en <strong>{DELIVERY_TIME}</strong> sur{" "}
              {DELIVERY_AREA}
            </p>
            <p className="flex items-center gap-2">
              <span>💵</span> <strong>Paiement à la livraison</strong> — payez à la
              réception du colis
            </p>
            <p className="flex items-center gap-2">
              <span>📦</span> Colis soigné et discret
            </p>
          </div>
        </div>
      </div>

      {/* Produits similaires */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-display font-semibold tracking-tight">Produits similaires</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
