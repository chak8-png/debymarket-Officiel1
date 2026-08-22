"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/backend/db/schema";
import { formatXOF } from "@/backend/lib/format";
import ProductCard from "./ProductCard";

type SortKey = "newest" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Nouveautés",
  "price-asc": "Prix croissant",
  "price-desc": "Prix décroissant",
};

export default function Filters({
  products,
  initialSearch = "",
}: {
  products: Product[];
  initialSearch?: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState<SortKey>("newest");

  const priceMax = useMemo(
    () => products.reduce((max, p) => Math.max(max, p.price), 0),
    [products]
  );
  const [maxPrice, setMaxPrice] = useState<number>(priceMax);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let out = products.filter(
      (p) =>
        p.price <= maxPrice &&
        (!s || `${p.name} ${p.description}`.toLowerCase().includes(s))
    );
    out = [...out];
    switch (sort) {
      case "price-asc":
        out.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        out.sort((a, b) => b.price - a.price);
        break;
      default:
        out.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
    return out;
  }, [products, search, maxPrice, sort]);

  return (
    <div>
      {/* Barre d'outils */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrer par nom…"
          className="flex-1 rounded-xl border px-4 py-2 text-sm outline-none focus:border-brand-500"
        />
        <div className="flex items-center gap-2 text-sm">
          <label className="whitespace-nowrap text-gray-600">
            ≤ {formatXOF(maxPrice)}
          </label>
          <input
            type="range"
            min={0}
            max={Math.max(priceMax, 1)}
            step={500}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-32 accent-brand-600"
            aria-label="Prix maximum"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-500"
          aria-label="Trier"
        >
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-4 text-sm text-gray-500">
        {filtered.length} produit{filtered.length > 1 ? "s" : ""}
      </p>

      {/* Grille */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white py-16 text-center">
          <span className="text-5xl">🔍</span>
          <p className="mt-3 font-semibold text-gray-700">Aucun produit trouvé</p>
          <p className="text-sm text-gray-500">
            Essayez un autre mot-clé ou élargissez la fourchette de prix.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
