// VUE : tableau de bord admin (stats, commandes, stock par catégorie).
import Link from "next/link";
import { listOrders } from "@/backend/services/orders";
import { fetchProducts } from "@/backend/lib/products";
import {
  parseGallery,
  parseColors,
} from "@/backend/lib/product-variants";
import {
  getRootCategories,
  getChildren,
  getCategoryById,
} from "@/backend/lib/categories";
import type { Category } from "@/backend/db/schema";
import { formatXOF } from "@/backend/lib/format";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
} from "@/backend/lib/constants";
import OrderStatusSelect from "@/frontend/components/admin/OrderStatusSelect";
import StockControl from "@/frontend/components/admin/StockControl";
import ProductEditor from "@/frontend/components/admin/ProductEditor";
import LogoutButton from "@/frontend/components/admin/LogoutButton";
import ProductDeleteButton from "@/frontend/components/admin/ProductDeleteButton";

/** Catégories feuilles (niveau le plus fin) d'un univers donné. */
function leafCategories(root: Category): Category[] {
  const walk = (cat: Category): Category[] => {
    const children = getChildren(cat.id);
    if (children.length === 0) return [cat];
    return children.flatMap(walk);
  };
  return walk(root);
}

/** Libellé complet d'une catégorie : « Mode › Femme › Sac à main ». */
function breadcrumb(cat: Category): string {
  const path: string[] = [cat.name];
  let current = cat;
  while (current.parentId) {
    const parent = getCategoryById(current.parentId);
    if (!parent) break;
    path.unshift(parent.name);
    current = parent;
  }
  return path.join(" › ");
}

export default async function DashboardView() {
  const [orders, products] = await Promise.all([
    listOrders(),
    fetchProducts({ limit: 500, includeInactive: true }), // l'admin voit aussi les produits masqués
  ]);

  // Univers du catalogue
  const roots = getRootCategories();
  const rootLeaves = roots.map((root) => ({ root, leaves: leafCategories(root) }));
  const visibleCategoryIds = new Set(
    rootLeaves.flatMap(({ leaves }) => leaves.map((c) => c.id))
  );
  const productsByCategory = (categoryId: number) =>
    products.filter((p) => p.categoryId === categoryId);

  // Options du sélecteur de catégorie (formulaire d'ajout/édition)
  const categoryOptions = rootLeaves
    .flatMap(({ leaves }) => leaves)
    .map((c) => ({ id: c.id, label: `${c.icon ?? "•"} ${breadcrumb(c)}` }));

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const revenue = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((s, o) => s + o.total, 0);
  const lowStock = products.filter(
    (p) => p.stock <= 5 && visibleCategoryIds.has(p.categoryId)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          📊 Tableau de bord
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/images"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
            title="Changer la grande photo d'accueil et les cartes des univers"
          >
            🖼️ Images de l'accueil
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-brand-600 hover:underline"
          >
            ← Retour à la boutique
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* Statistiques */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-gray-500">Commandes</p>
          <p className="mt-1 text-2xl font-display font-semibold tracking-tight">
            {orders.length}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-gray-500">En attente</p>
          <p className="mt-1 text-2xl font-display font-semibold tracking-tight text-amber-600">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-gray-500">CA encaissé</p>
          <p className="mt-1 text-2xl font-display font-semibold tracking-tight text-green-600">
            {formatXOF(revenue)}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-gray-500">Produits suivis</p>
          <p className="mt-1 text-2xl font-display font-semibold tracking-tight">
            {products.filter((p) => visibleCategoryIds.has(p.categoryId)).length}
          </p>
        </div>
      </div>

      {/* Commandes / Historique des transactions */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            🧾 Historique des transactions
          </h2>
          <a
            href="/api/admin/export"
            download
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            title="Télécharger l'historique complet au format Excel (.xlsx)"
          >
            📥 Télécharger Excel
          </a>
        </div>
        {orders.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed bg-white px-6 py-10 text-center text-sm text-gray-500">
            Aucune commande pour le moment. Les nouvelles commandes apparaîtront
            ici (livraison 24h, paiement à la livraison).
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border bg-white">
            <table className="w-full min-w-[900px] text-sm">
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
                  <tr key={order.id} className="align-top hover:bg-brand-50/40">
                    <td className="px-4 py-3 font-mono text-xs font-bold">
                      {order.reference}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
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
                            <span className="ml-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 align-middle">
                              🎨 {i.variant}
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
                    <td className="px-4 py-3">
                      <OrderStatusSelect orderId={order.id} status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-gray-400">
          Marquer « Livrée » enregistre automatiquement le paiement (l&apos;argent a
          été encaissé par le livreur). L&apos;export Excel contient 3 onglets :
          Résumé, Transactions et Articles vendus.
        </p>
      </section>

      {/* Produits & stock par catégorie */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            📦 Produits & stock par catégorie
          </h2>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-gray-400 sm:inline">
              ✏️ modifier · 🗑️ supprimer · − / + pour le stock
            </span>
            <ProductEditor categories={categoryOptions} />
          </div>
        </div>

        {lowStock.length > 0 && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
            ⚠️ {lowStock.length} produit(s) bientôt en rupture :{" "}
            {lowStock.map((p) => p.name).join(", ")}
          </p>
        )}

        {rootLeaves.map(({ root, leaves }) => (
          <div key={root.id} className="mt-8">
            <h3 className="flex items-center gap-2 text-base font-bold">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sand text-lg">
                {root.icon}
              </span>
              {root.name}
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {leaves.map((cat) => {
                const items = productsByCategory(cat.id);
                return (
                  <div
                    key={cat.id}
                    className="overflow-hidden rounded-2xl border bg-white"
                  >
                    <div className="flex items-center justify-between border-b bg-sand/60 px-4 py-2.5">
                      <h4 className="text-sm font-bold">
                        {cat.icon} {cat.name}
                      </h4>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-500">
                        {items.length} article{items.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    {items.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-gray-400">
                        Aucun produit — ajoutez-en un avec le bouton « ➕
                        Ajouter un produit » ci-dessus.
                      </p>
                    ) : (
                      <ul className="divide-y text-sm">
                        {items.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-center justify-between gap-2 px-4 py-2"
                          >
                            <span className="line-clamp-1">
                              {p.name}
                              {!p.isActive && (
                                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 align-middle">
                                  MASQUÉ
                                </span>
                              )}
                              {p.isFeatured && (
                                <span className="ml-2 align-middle" title="Produit à la une">
                                  ⭐
                                </span>
                              )}
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {formatXOF(p.price)}
                              </span>
                              <ProductEditor
                                categories={categoryOptions}
                                product={{
                                  id: p.id,
                                  name: p.name,
                                  description: p.description,
                                  price: p.price,
                                  categoryId: p.categoryId,
                                  image: p.image,
                                  imageUrl: p.imageUrl,
                                  gallery: parseGallery(p.gallery),
                                  colors: parseColors(p.colors),
                                  isFeatured: p.isFeatured,
                                  isActive: p.isActive,
                                }}
                              />
                              <ProductDeleteButton productId={p.id} name={p.name} />
                              <StockControl productId={p.id} stock={p.stock} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
