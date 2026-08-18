"use client";

import { useState } from "react";
import { useCart, type AddableProduct } from "../cart/CartProvider";
import { trackEvent } from "../analytics/track";

export default function AddToCart({
  product,
  withQuantity = false,
}: {
  product: AddableProduct;
  withQuantity?: boolean;
}) {
  const { addItem, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const add = (qty: number) => {
    addItem(product, qty);
    trackEvent("add_to_cart", { productId: product.id, quantity: qty });
    openCart();
  };

  if (!withQuantity) {
    // Version compacte (carte produit)
    return (
      <button
        onClick={() => add(1)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white shadow transition hover:bg-brand-700"
        aria-label={`Ajouter ${product.name} au panier`}
        title="Ajouter au panier"
      >
        <span className="text-lg leading-none">+</span>
      </button>
    );
  }

  // Version complète (page produit)
  return (
    <div className="flex items-stretch gap-3">
      <div className="flex items-center rounded-xl border">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="px-4 py-3 text-lg text-gray-600 hover:bg-gray-50"
          aria-label="Diminuer la quantité"
        >
          −
        </button>
        <span className="w-10 text-center font-bold">{quantity}</span>
        <button
          onClick={() => setQuantity((q) => Math.min(20, q + 1))}
          className="px-4 py-3 text-lg text-gray-600 hover:bg-gray-50"
          aria-label="Augmenter la quantité"
        >
          +
        </button>
      </div>
      <button
        onClick={() => add(quantity)}
        className="flex-1 rounded-xl bg-brand-600 px-6 py-3 font-bold text-white transition hover:bg-brand-700"
      >
        🛒 Ajouter au panier
      </button>
    </div>
  );
}
