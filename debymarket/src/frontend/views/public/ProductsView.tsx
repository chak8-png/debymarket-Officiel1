// VUE : page « Tous les produits » / résultats de recherche.
import { fetchProducts } from "@/backend/lib/products";
import Filters from "@/frontend/components/product/Filters";


export default async function ProductsView({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const initialSearch = search ?? "";
  const products = await fetchProducts({ limit: 200 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-2xl font-display font-semibold tracking-tight">
        {initialSearch ? (
          <>
            Résultats pour «{" "}
            <span className="text-brand-600">{initialSearch}</span> »
          </>
        ) : (
          "Tous les produits"
        )}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        🚚 Livraison en 24h · 💵 Paiement à la livraison
      </p>

      <div className="mt-6">
        <Filters products={products} initialSearch={initialSearch} />
      </div>
    </div>
  );
}
