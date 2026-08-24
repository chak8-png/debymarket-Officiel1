import Link from "next/link";
import Logo from "../ui/Logo";
import { getRootCategories, getChildren } from "@/backend/lib/categories";
import {
  DELIVERY_TIME,
  DELIVERY_AREA,
  SUPPORT_PHONE,
  SUPPORT_PHONE_2,
  SITE_EMAIL,
  OPENING_HOURS,
  toTelHref,
} from "@/backend/lib/constants";

export default function Footer() {
  const roots = getRootCategories();

  return (
    <footer className="mt-20 bg-ink-950 text-ink-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {/* Marque */}
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-400">
            Le marché en ligne pensé pour la vie ivoirienne : livraison en{" "}
            {DELIVERY_TIME} à {DELIVERY_AREA} et paiement en espèces à la
            réception.
          </p>
          <p className="mt-4 text-sm font-semibold">
            <a
              href={toTelHref(SUPPORT_PHONE)}
              className="text-white transition hover:text-emerald-400"
            >
              📞 {SUPPORT_PHONE}
            </a>{" "}
            <span className="text-xs text-ink-500">— Service client</span>
          </p>
          <p className="mt-1 text-sm font-semibold">
            <a
              href={toTelHref(SUPPORT_PHONE_2)}
              className="text-white transition hover:text-emerald-400"
            >
              📞 {SUPPORT_PHONE_2}
            </a>{" "}
            <span className="text-xs text-ink-500">— Service après-vente</span>
          </p>
          <p className="mt-1 text-sm font-semibold">
            <a
              href={`mailto:${SITE_EMAIL}`}
              className="text-white transition hover:text-emerald-400"
            >
              ✉️ {SITE_EMAIL}
            </a>
          </p>
          <p className="mt-1 text-xs text-ink-500">🕐 {OPENING_HOURS}</p>
        </div>

        {/* Boutique */}
        <div>
          <h3 className="font-display text-base font-semibold text-white">
            Boutique
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/products" className="transition hover:text-brand-400">
                Tous les produits
              </Link>
            </li>
            <li>
              <Link href="/a-propos" className="transition hover:text-brand-400">
                À Propos
              </Link>
            </li>
            {roots.map((root) => (
              <li key={root.id}>
                <Link
                  href={`/categories/${root.slug}`}
                  className="transition hover:text-brand-400"
                >
                  {root.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Catégories populaires */}
        <div>
          <h3 className="font-display text-base font-semibold text-white">
            Populaires
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {["chemise-polo", "sac-a-main", "power-bank", "ecouteurs-casques", "beaute-cosmetique"].map(
              (slug) => {
                const cat = roots
                  .flatMap((r) => getChildren(r.id))
                  .find((c) => c.slug === slug);
                return cat ? (
                  <li key={slug}>
                    <Link
                      href={`/categories/${slug}`}
                      className="transition hover:text-brand-400"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ) : null;
              }
            )}
          </ul>
        </div>

        {/* Infos pratiques */}
        <div>
          <h3 className="font-display text-base font-semibold text-white">
            Bon à savoir
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-ink-400">
            <li>
              🚚 Livraison en {DELIVERY_TIME}
            </li>
            <li>💵 Paiement à la livraison</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-6 text-center text-xs text-ink-500">
        <p className="font-semibold text-ink-400">
          © 2026 Debymarket — Tous droits réservés.
        </p>
        <p className="mt-1">
          Abidjan, Côte d&apos;Ivoire · Livraison en {DELIVERY_TIME} · Paiement
          à la livraison
        </p>
      </div>
    </footer>
  );
}
