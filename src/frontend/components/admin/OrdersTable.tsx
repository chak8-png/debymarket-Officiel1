"use client";

// Tableau des commandes avec FICHE DÉTAILLÉE : un clic sur une commande
// (ou sur 👁️) ouvre sa fiche : articles commandés (quantités, options,
// prix), coordonnées du client avec boutons Appeler / WhatsApp, récap
// des montants et statut modifiable. Confortable sur mobile et PC.
import { useEffect, useState } from "react";
import { formatXOF } from "@/backend/lib/format";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/backend/lib/constants";
import OrderStatusSelect from "./OrderStatusSelect";
import DotWave from "@/frontend/components/ui/DotWave";

export interface AdminOrderItemDTO {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  variant: string | null;
  size: string | null;
}

export interface AdminOrderDTO {
  id: number;
  reference: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string; // date en texte ISO (sérialisable)
  items: AdminOrderItemDTO[];
}

/** Infos produit renvoyées par GET /api/admin/products/[id] (aperçu admin). */
interface ProductInfo {
  id: number;
  name: string;
  slug: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  image: string;
  imageUrl: string | null;
  isActive: boolean;
  description: string;
  categoryLabel: string;
}

/** Numéro au format international pour wa.me (CI : 0XXXXXXXXX → 225…). */
function whatsappNumber(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.length < 8) return null;
  if (d.startsWith("00")) return d.slice(2);
  if (d.length === 10 && d.startsWith("0")) return `225${d}`;
  if (d.length === 8) return `225${d}`;
  return d;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function OrdersTable({ orders }: { orders: AdminOrderDTO[] }) {
  const [selected, setSelected] = useState<AdminOrderDTO | null>(null);
  // Aperçu produit (clic sur un article commandé)
  const [viewItem, setViewItem] = useState<AdminOrderItemDTO | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  /** Charge les infos + la photo du produit cliqué (à la demande). */
  async function openProduct(item: AdminOrderItemDTO) {
    setViewItem(item);
    setProductInfo(null);
    setProductError(null);
    setProductLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${item.productId}`);
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        product?: ProductInfo;
      };
      if (!res.ok || !data.ok || !data.product) {
        throw new Error(data.error ?? "Produit introuvable.");
      }
      setProductInfo(data.product);
    } catch (e) {
      setProductError(
        e instanceof Error ? e.message : "Chargement impossible."
      );
    } finally {
      setProductLoading(false);
    }
  }

  const closeProduct = () => {
    setViewItem(null);
    setProductInfo(null);
    setProductError(null);
  };

  // Fermer avec Échap : d'abord l'aperçu produit, puis la fiche commande
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (viewItem) closeProduct();
        else setSelected(null);
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, viewItem]);

  // Fermer la fiche commande → réinitialise aussi l'aperçu produit
  const closeOrder = () => {
    closeProduct();
    setSelected(null);
  };

  const wa = selected ? whatsappNumber(selected.phone) : null;

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-merchant-border/40 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
              <th className="px-4 py-3">Référence</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Livraison</th>
              <th className="px-4 py-3">Articles</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Paiement</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => setSelected(order)}
                className="cursor-pointer transition hover:bg-merchant-low"
                title="Cliquer pour voir le détail de la commande"
              >
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-merchant-primary">
                  <span className="mr-1.5 text-merchant-sub">👁️</span>
                  {order.reference}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-xs text-gray-500">{order.phone}</p>
                </td>
                <td className="max-w-52 px-4 py-3 text-xs">
                  <p className="font-medium">{order.city}</p>
                  <p className="line-clamp-2 text-gray-500">{order.address}</p>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {order.items.map((i) => (
                    <p key={i.productId} className="line-clamp-1">
                      {i.quantity}× {i.name}
                      {i.variant && (
                        <span className="ml-1 rounded-full bg-violet-100 px-2 py-0.5 align-middle text-[10px] font-bold text-violet-700">
                          🎨 {i.variant}
                        </span>
                      )}
                      {i.size && (
                        <span className="ml-1 rounded-full bg-sky-100 px-2 py-0.5 align-middle text-[10px] font-bold text-sky-700">
                          📏 {i.size}
                        </span>
                      )}
                    </p>
                  ))}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-brand-600">
                  {formatXOF(order.total)}
                </td>
                <td className="px-4 py-3 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 font-semibold ${
                      order.paymentStatus === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {PAYMENT_STATUS_LABELS[order.paymentStatus] ??
                      order.paymentStatus}
                  </span>
                </td>
                <td
                  className="px-4 py-3"
                  onClick={(e) => e.stopPropagation()} // ne pas ouvrir la fiche en changeant le statut
                >
                  <OrderStatusSelect orderId={order.id} status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Fiche détaillée de la commande ────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 p-0 sm:items-center sm:p-6"
          onClick={closeOrder}
          role="dialog"
          aria-modal="true"
          aria-label={`Détail de la commande ${selected.reference}`}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="flex items-start justify-between gap-3 border-b bg-merchant-low px-5 py-4">
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold text-merchant-primary">
                  {selected.reference}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {formatDate(selected.createdAt)} ·{" "}
                  {selected.paymentMethod === "cod"
                    ? "Paiement à la livraison 💵"
                    : selected.paymentMethod}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    selected.paymentStatus === "paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {PAYMENT_STATUS_LABELS[selected.paymentStatus] ??
                    selected.paymentStatus}
                </span>
                <button
                  type="button"
                  onClick={closeOrder}
                  aria-label="Fermer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm hover:text-gray-900"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Client + livraison */}
              <div className="rounded-2xl border bg-gray-50/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Client & livraison
                </p>
                <p className="mt-2 font-semibold">{selected.customerName}</p>
                <p className="text-sm text-gray-600">
                  📍 {selected.address}, {selected.city}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`tel:${selected.phone.replace(/\s/g, "")}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:border-merchant-primary hover:text-merchant-primary sm:flex-none"
                  >
                    📞 {selected.phone}
                  </a>
                  {wa && (
                    <a
                      href={`https://wa.me/${wa}?text=${encodeURIComponent(
                        `Bonjour ${selected.customerName}, Debymarket ici — au sujet de votre commande ${selected.reference}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-green-700 sm:flex-none"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Articles commandés */}
              <p className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-400">
                Articles commandés ({selected.items.length})
              </p>
              <ul className="mt-2 divide-y rounded-2xl border">
                {selected.items.map((item, idx) => (
                  <li key={`${item.productId}-${idx}`}>
                    <button
                      type="button"
                      onClick={() => openProduct(item)}
                      title="Voir la photo et les infos de cet article"
                      className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-merchant-low"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug">
                          <span className="mr-1 font-bold text-merchant-primary">
                            {item.quantity}×
                          </span>
                          {item.name}
                          <span className="ml-1.5 text-merchant-primary">👁️</span>
                        </p>
                        {(item.variant || item.size) && (
                          <p className="mt-1 flex flex-wrap gap-1.5">
                            {item.variant && (
                              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                                🎨 {item.variant}
                              </span>
                            )}
                            {item.size && (
                              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                                📏 {item.size}
                              </span>
                            )}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-gray-400">
                          {formatXOF(item.unitPrice)} / unité
                        </p>
                      </div>
                      <p className="whitespace-nowrap text-sm font-bold">
                        {formatXOF(item.unitPrice * item.quantity)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>

              {/* Montants */}
              <div className="mt-4 space-y-1.5 rounded-2xl border bg-gray-50/60 p-4 text-sm">
                <p className="flex justify-between text-gray-600">
                  <span>Sous-total articles</span>
                  <span>{formatXOF(selected.subtotal)}</span>
                </p>
                <p className="flex justify-between text-gray-600">
                  <span>Livraison (24h)</span>
                  <span>{formatXOF(selected.deliveryFee)}</span>
                </p>
                <p className="flex justify-between border-t pt-1.5 text-base font-bold text-merchant-primary">
                  <span>Total à encaisser</span>
                  <span>{formatXOF(selected.total)}</span>
                </p>
              </div>

              {/* Statut de la commande */}
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border p-4">
                <p className="text-sm font-semibold text-gray-600">
                  Statut :{" "}
                  <span className="text-gray-400">
                    {(ORDER_STATUS_LABELS as Record<string, string>)[
                      selected.status
                    ] ?? selected.status}
                  </span>
                </p>
                <OrderStatusSelect
                  orderId={selected.id}
                  status={selected.status}
                />
              </div>
              <p className="mt-2 text-center text-[11px] text-gray-400">
                « Livrée » enregistre automatiquement le paiement encaissé.
              </p>
            </div>

            {/* ── Aperçu produit (clic sur un article commandé) ─────────── */}
            {viewItem && (
              <div className="absolute inset-0 z-10 flex flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
                <div className="flex items-center justify-between gap-2 border-b bg-merchant-low px-5 py-3">
                  <button
                    type="button"
                    onClick={closeProduct}
                    className="text-sm font-bold text-merchant-primary hover:underline"
                  >
                    ← Retour à la commande
                  </button>
                  <button
                    type="button"
                    onClick={closeOrder}
                    aria-label="Fermer"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm hover:text-gray-900"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {productLoading ? (
                    <DotWave size={10} className="mt-10" label="Chargement…" />
                  ) : productError ? (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      ⚠️ {productError}
                      <p className="mt-1 text-xs text-red-500">
                        Article commandé : « {viewItem.name} » (photo indisponible —
                        produit retiré du catalogue ?)
                      </p>
                    </div>
                  ) : productInfo ? (
                    <>
                      <div className="overflow-hidden rounded-2xl border bg-sand">
                        {productInfo.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={productInfo.imageUrl}
                            alt={productInfo.name}
                            className="aspect-square w-full object-cover"
                          />
                        ) : (
                          <span className="flex aspect-square w-full items-center justify-center text-7xl">
                            {productInfo.image}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-4 text-base font-bold leading-snug">
                        {productInfo.name}
                        {!productInfo.isActive && (
                          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 align-middle text-[10px] font-bold text-red-600">
                            MASQUÉ
                          </span>
                        )}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {productInfo.categoryLabel}
                      </p>
                      <div className="mt-3 flex flex-wrap items-baseline gap-2">
                        <p className="text-xl font-bold text-brand-600">
                          {formatXOF(productInfo.price)}
                        </p>
                        {productInfo.oldPrice !== null &&
                          productInfo.oldPrice > productInfo.price && (
                            <s className="text-sm font-medium text-gray-400">
                              {formatXOF(productInfo.oldPrice)}
                            </s>
                          )}
                      </div>
                      <p
                        className={`mt-2 text-sm font-semibold ${
                          productInfo.stock <= 5
                            ? "text-amber-600"
                            : "text-gray-500"
                        }`}
                      >
                        📦 Stock : {productInfo.stock} restant
                        {productInfo.stock !== 1 ? "s" : ""}
                      </p>
                      {productInfo.description && (
                        <p className="mt-3 max-h-28 overflow-y-auto rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
                          {productInfo.description}
                        </p>
                      )}
                      <a
                        href={`/products/${productInfo.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-merchant-border/70 bg-white px-4 py-2.5 text-sm font-bold text-merchant-primary shadow-sm transition hover:border-merchant-primary"
                      >
                        🔗 Voir la fiche sur la boutique
                      </a>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
