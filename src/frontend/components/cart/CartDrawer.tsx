"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { formatXOF } from "@/backend/lib/format";

export default function CartDrawer() {
  const router = useRouter();
  const {
    items,
    subtotal,
    deliveryFee,
    total,
    isOpen,
    closeCart,
    setQuantity,
    removeItem,
  } = useCart();

  if (!isOpen) return null;

  const goToCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <button
        aria-label="Fermer le panier"
        onClick={closeCart}
        className="absolute inset-0 bg-black/40"
      />

      {/* Panneau */}
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold">
            🛒 Mon panier{" "}
            <span className="text-sm font-medium text-gray-500">
              ({items.reduce((s, i) => s + i.quantity, 0)} article
              {items.length !== 1 ? "s" : ""})
            </span>
          </h2>
          <button
            onClick={closeCart}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Fermer"
          >
            ✕
          </button>
        </header>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <span className="text-5xl">🛒</span>
              <p className="font-semibold text-gray-700">Votre panier est vide</p>
              <button
                onClick={closeCart}
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                Continuer mes achats →
              </button>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 py-4">
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={closeCart}
                    className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sand text-3xl"
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      item.image
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="line-clamp-2 text-sm font-medium hover:text-brand-600"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 text-sm font-bold text-brand-600">
                      {formatXOF(item.price)}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border">
                        <button
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-50"
                          aria-label="Diminuer"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-50"
                          aria-label="Augmenter"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pied */}
        {items.length > 0 && (
          <footer className="border-t px-5 py-4">
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Sous-total</dt>
                <dd className="font-medium">{formatXOF(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Livraison (24h)</dt>
                <dd className="font-medium">{formatXOF(deliveryFee)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd className="text-brand-600">{formatXOF(total)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-center text-xs text-gray-500">
              💵 Vous payez à la réception de votre colis
            </p>
            <button
              onClick={goToCheckout}
              className="mt-3 w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              Commander — Paiement à la livraison
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
