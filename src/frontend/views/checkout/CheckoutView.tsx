"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useCart, itemKey } from "@/frontend/components/cart/CartProvider";
import { formatXOF } from "@/backend/lib/format";
import { DELIVERY_TIME, DELIVERY_AREA } from "@/backend/lib/constants";
import { trackEvent } from "@/frontend/components/analytics/track";

type Confirmation = { reference: string; total: number } | null;

export default function CheckoutView() {
  const { items, subtotal, deliveryFee, total, setQuantity, removeItem, clear } =
    useCart();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Cocody, Abidjan");
  const [address, setAddress] = useState("");
  // 🍯 Pot de miel anti-robots : reste vide chez un humain (champ invisible)
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          city,
          address,
          website, // pot de miel anti-robots (vide chez un humain)
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity, color: i.color ?? undefined })),
        }),
      });
      const data = (await res.json()) as
        | { ok: true; reference: string; total: number }
        | { ok: false; error: string };

      if (!res.ok || !data.ok) {
        setError("error" in data ? data.error : "Erreur inattendue.");
        return;
      }
      trackEvent("purchase", { reference: data.reference, total: data.total });
      setConfirmation({ reference: data.reference, total: data.total });
      clear();
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  // ── Écran de confirmation ───────────────────────────────────────────
  if (confirmation) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-[2rem] border border-ink-100 bg-white p-10">
          <div className="text-6xl">✅</div>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
            Commande confirmée !
          </h1>
          <p className="mt-2 text-ink-500">
            Merci pour votre confiance. Votre commande est en préparation.
          </p>
          <div className="mt-6 rounded-2xl bg-sand p-5 text-left text-sm">
            <p>
              <strong>Référence :</strong>{" "}
              <span className="font-mono font-bold text-brand-700">
                {confirmation.reference}
              </span>
            </p>
            <p className="mt-1">
              <strong>Montant à payer à la livraison :</strong>{" "}
              <span className="font-bold text-brand-700">
                {formatXOF(confirmation.total)}
              </span>
            </p>
            <p className="mt-1">
              <strong>Délai :</strong> livraison en {DELIVERY_TIME} sur {DELIVERY_AREA}
            </p>
          </div>
          <p className="mt-4 text-sm text-ink-500">
            💡 Préparez si possible le montant exact — vous payez le livreur à la
            réception du colis.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/products"
              className="rounded-full bg-ink-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              Continuer mes achats
            </Link>
            <Link
              href="/"
              className="rounded-full border border-ink-200 bg-white px-6 py-3 text-sm font-semibold transition hover:border-ink-950"
            >
              Accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Panier vide ─────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="text-6xl">🛒</div>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
          Votre panier est vide
        </h1>
        <p className="mt-2 text-ink-500">
          Ajoutez des produits avant de passer commande.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-full bg-ink-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Voir les produits
        </Link>
      </div>
    );
  }

  // ── Formulaire de commande ──────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Finaliser ma commande
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        💵 Paiement à la livraison — aucun paiement en ligne
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Formulaire */}
        <form
          onSubmit={submit}
          className="h-fit space-y-4 rounded-[2rem] border border-ink-100 bg-white p-6 sm:p-8"
        >
          <h2 className="font-display text-lg font-semibold">
            📋 Vos informations de livraison
          </h2>

          {/* 🍯 Anti-robots : invisible et hors tabulation — un humain ne le
              remplit JAMAIS ; les bots si (champ classique des formulaires). */}
          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
          />

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="name">
              Nom complet *
            </label>
            <input
              id="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              placeholder="Ex : Awa Koné"
              className="w-full rounded-xl border border-ink-200 bg-cream px-4 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="phone">
              Téléphone *
            </label>
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              inputMode="tel"
              placeholder="Ex : 07 00 00 00 00"
              className="w-full rounded-xl border border-ink-200 bg-cream px-4 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="city">
              Commune / Ville *
            </label>
            <select
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-ink-200 bg-cream px-4 py-2.5 text-sm outline-none focus:border-brand-500"
            >
              {[
                "Cocody, Abidjan",
                "Yopougon, Abidjan",
                "Plateau, Abidjan",
                "Adjamé, Abidjan",
                "Marcory, Abidjan",
                "Treichville, Abidjan",
                "Abobo, Abidjan",
                "Koumassi, Abidjan",
                "Port-Bouët, Abidjan",
                "Bingerville",
                "Anyama",
                "Autre (préciser dans l'adresse)",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="address">
              Adresse / Repère *
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              rows={3}
              placeholder="Ex : Rue des Jardins, en face de la pharmacie du coin…"
              className="w-full rounded-xl border border-ink-200 bg-cream px-4 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brand-500 py-3.5 font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            {loading
              ? "Envoi de la commande…"
              : `Confirmer la commande — ${formatXOF(total)} à la livraison`}
          </button>
          <p className="text-center text-xs text-ink-400">
            En confirmant, vous acceptez de payer {formatXOF(total)} en espèces à la
            réception du colis (livraison en {DELIVERY_TIME}).
          </p>
        </form>

        {/* Récapitulatif */}
        <aside className="h-fit rounded-[2rem] border border-ink-100 bg-white p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold">🧾 Récapitulatif</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={itemKey(item)} className="flex items-center gap-3 text-sm">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sand text-2xl">
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
                </span>
                <div className="flex-1">
                  <p className="line-clamp-1 font-medium">
                    {item.name}
                    {item.color && (
                      <span className="ml-1.5 text-xs font-normal text-ink-400">
                        · {item.color}
                      </span>
                    )}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(itemKey(item), item.quantity - 1)}
                      className="rounded border border-ink-200 px-1.5 text-xs"
                    >
                      −
                    </button>
                    <span className="text-xs font-semibold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(itemKey(item), item.quantity + 1)}
                      className="rounded border border-ink-200 px-1.5 text-xs"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(itemKey(item))}
                      className="text-xs text-brand-600"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
                <span className="font-semibold">
                  {formatXOF(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-ink-100 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Sous-total</dt>
              <dd>{formatXOF(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Livraison ({DELIVERY_TIME})</dt>
              <dd>
                {deliveryFee === 0 ? (
                  <span className="font-medium text-emerald-700">Offerte</span>
                ) : (
                  formatXOF(deliveryFee)
                )}
              </dd>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-bold">
              <dt>Total à payer</dt>
              <dd className="text-brand-600">{formatXOF(total)}</dd>
            </div>
          </dl>
          <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            💵 Règlement en espèces à la réception — rien à payer maintenant.
          </p>
        </aside>
      </div>
    </div>
  );
}
