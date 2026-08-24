"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Logo from "../ui/Logo";
import { useCart } from "../cart/CartProvider";
import { getCategoryTree, isAdultCategory } from "@/backend/lib/categories";

const NAV = getCategoryTree();

/** Petit badge rouge « 18+ » pour les catégories de l'espace adulte. */
const AdultBadge = () => (
  <span className="ml-1 rounded bg-red-100 px-1 py-0.5 align-middle text-[10px] font-bold leading-none text-red-600">
    18+
  </span>
);

export default function Header() {
  const router = useRouter();
  const { count, openCart } = useCart();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    setMobileOpen(false);
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-cream/90 backdrop-blur">
      {/* Ligne principale */}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5">
        <button
          className="rounded-full p-2 text-ink-700 hover:bg-sand md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          ☰
        </button>

        <Logo />

        {/* Recherche */}
        <form
          onSubmit={submitSearch}
          className="mx-auto flex w-full max-w-xl flex-1 items-center"
        >
          <div className="flex w-full items-center rounded-full border border-ink-200 bg-white p-1 focus-within:border-ink-950">
            <span className="pl-3 text-ink-400">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="search"
              placeholder="Rechercher un produit, une catégorie…"
              className="w-full bg-transparent px-2 py-1.5 text-sm outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-ink-950 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600"
            >
              Rechercher
            </button>
          </div>
        </form>

        {/* Panier */}
        <button
          onClick={openCart}
          className="relative flex shrink-0 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-950 transition hover:border-ink-950"
          aria-label="Ouvrir le panier"
        >
          🛒
          <span className="hidden sm:inline">Panier</span>
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-xs font-bold text-white">
              {count}
            </span>
          )}
        </button>
      </div>

      {/* Navigation desktop : 4 catégories + À Propos */}
      <nav className="hidden border-t border-ink-100 md:block">
        <ul className="mx-auto flex max-w-7xl items-center gap-1 px-4">
          {NAV.map((root) => (
            <li key={root.id} className="group relative">
              <Link
                href={`/categories/${root.slug}`}
                className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-ink-600 transition hover:text-brand-600"
              >
                {root.name}
                {isAdultCategory(root.id) && <AdultBadge />}
                <span className="text-xs text-ink-300">▾</span>
              </Link>

              {/* Méga-menu */}
              <div className="invisible absolute left-0 top-full z-50 min-w-72 rounded-2xl border border-ink-100 bg-white p-5 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                <div className="space-y-4">
                  {root.children.length === 0 ? (
                    <p className="text-sm text-ink-500">Voir la catégorie →</p>
                  ) : (
                    root.children.map((child) => (
                      <div key={child.id}>
                        <Link
                          href={`/categories/${child.slug}`}
                          className="font-display text-sm font-semibold text-ink-950 hover:text-brand-600"
                        >
                          {child.icon} {child.name}
                          {isAdultCategory(child.id) && <AdultBadge />}
                        </Link>
                        {child.children.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {child.children.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/categories/${sub.slug}`}
                                className="rounded-full bg-sand px-2.5 py-1 text-xs text-ink-600 transition hover:bg-brand-100 hover:text-brand-700"
                              >
                                {sub.name}
                                {isAdultCategory(sub.id) && <AdultBadge />}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </li>
          ))}
          <li>
            <Link
              href="/a-propos"
              className="block px-4 py-3 text-sm font-medium text-ink-600 transition hover:text-brand-600"
            >
              À Propos
            </Link>
          </li>
          <li className="ml-auto">
            <span className="px-4 py-3 text-xs font-semibold text-emerald-700">
              💵 Paiement à la livraison
            </span>
          </li>
        </ul>
      </nav>

      {/* Navigation mobile : 4 catégories + À Propos */}
      {mobileOpen && (
        <nav className="border-t border-ink-100 bg-cream px-4 py-3 md:hidden">
          {NAV.map((root) => (
            <div key={root.id} className="mt-1">
              <Link
                href={`/categories/${root.slug}`}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 font-display text-sm font-semibold text-ink-950"
              >
                {root.icon} {root.name}
                {isAdultCategory(root.id) && <AdultBadge />}
              </Link>
              <div className="flex flex-wrap gap-1.5 px-3 pb-1">
                {root.children.flatMap((child) =>
                  (child.children.length > 0 ? child.children : [child]).map(
                    (sub) => (
                      <Link
                        key={sub.id}
                        href={`/categories/${sub.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-full bg-sand px-2.5 py-1 text-xs text-ink-600"
                      >
                        {sub.name}
                        {isAdultCategory(sub.id) && <AdultBadge />}
                      </Link>
                    )
                  )
                )}
              </div>
            </div>
          ))}
          <Link
            href="/a-propos"
            onClick={() => setMobileOpen(false)}
            className="block rounded-lg px-3 py-2 font-display text-sm font-semibold text-ink-950"
          >
            ℹ️ À Propos
          </Link>
        </nav>
      )}
    </header>
  );
}
