"use client";

import { useState } from "react";
import AddToCart from "./AddToCart";
import type { AddableProduct } from "../cart/CartProvider";
import type { ProductColor } from "@/backend/lib/product-variants";

/**
 * Panneau d'achat de la fiche produit : sélecteur de couleur (pastilles) +
 * bouton quantité / ajout au panier. La couleur choisie suit l'article
 * jusqu'à la commande (visible côté vendeur dans le Dashboard et l'export).
 */
export default function PurchasePanel({
  product,
  colors,
}: {
  product: AddableProduct;
  colors: ProductColor[];
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {colors.length > 0 && (
        <fieldset>
          <legend className="text-sm font-semibold text-gray-700">
            🎨 Couleur{" "}
            <span className="font-normal text-gray-400">
              {selected ? `: ${selected}` : "— choisissez (optionnel)"}
            </span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((c) => {
              const active = selected === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelected(active ? null : c.name)}
                  aria-pressed={active}
                  title={c.name}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-200"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span
                    aria-hidden
                    className="h-4 w-4 rounded-full border border-black/10"
                    style={{ backgroundColor: c.hex ?? "#e5e7eb" }}
                  />
                  {c.name}
                  {active && <span aria-hidden>✓</span>}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <AddToCart withQuantity product={product} color={selected} />
    </div>
  );
}
