import Link from "next/link";

export default function NotFoundView() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <div className="text-6xl">🔍</div>
      <h1 className="mt-4 text-2xl font-display font-semibold tracking-tight">Page introuvable</h1>
      <p className="mt-2 text-gray-600">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-brand-600 px-6 py-3 font-bold text-white hover:bg-brand-700"
        >
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/products"
          className="rounded-xl border px-6 py-3 font-semibold hover:border-brand-400"
        >
          Voir les produits
        </Link>
      </div>
    </div>
  );
}
