// VUE : tableau de bord admin (stats, commandes, stock par catégorie).
import { listOrders } from "@/backend/services/orders";
import { fetchProducts } from "@/backend/lib/products";
import {
  parseGallery,
  parseColors,
  parseSizes,
} from "@/backend/lib/product-variants";
import {
  getRootCategories,
  getChildren,
  getCategoryById,
} from "@/backend/lib/categories";
import type { Category } from "@/backend/db/schema";
import { formatXOF } from "@/backend/lib/format";
import OrdersTable, {
  type AdminOrderDTO,
} from "@/frontend/components/admin/OrdersTable";
import StockControl from "@/frontend/components/admin/StockControl";
import ProductEditor from "@/frontend/components/admin/ProductEditor";
import AdminShell from "@/frontend/components/admin/AdminShell";
import ProductDeleteButton from "@/frontend/components/admin/ProductDeleteButton";
import ProductDuplicateButton from "@/frontend/components/admin/ProductDuplicateButton";
import DbStatusBanner from "@/frontend/components/admin/DbStatusBanner";
import RestoreButton from "@/frontend/components/admin/RestoreButton";

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

/** Carte de statistique : icône teintée, chiffre fort et contexte. */
function StatCard({
  icon,
  tint,
  label,
  value,
  valueClassName = "",
  hint,
}: {
  icon: string;
  tint: "blue" | "amber" | "green" | "violet";
  label: string;
  value: string;
  valueClassName?: string;
  hint: string;
}) {
  const tints: Record<string, string> = {
    blue: "bg-merchant-container text-merchant-primary",
    amber: "bg-amber-100 text-amber-600",
    green: "bg-green-100 text-merchant-green",
    violet: "bg-violet-100 text-violet-600",
  };
  return (
    <div className="rounded-2xl border border-merchant-border/40 bg-white p-4 shadow-sm transition hover:shadow-md lg:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="pt-0.5 text-[11px] font-bold uppercase tracking-wider text-merchant-sub">
          {label}
        </p>
        <span
          aria-hidden
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${tints[tint]}`}
        >
          {icon}
        </span>
      </div>
      <p
        className={`mt-1 truncate font-display text-2xl font-bold tracking-tight tabular-nums lg:text-3xl ${valueClassName}`}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] font-medium text-merchant-sub">{hint}</p>
    </div>
  );
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

  // Commandes sérialisées pour le tableau interactif (dates → texte ISO)
  const orderDtos: AdminOrderDTO[] = orders.map((o) => ({
    id: o.id,
    reference: o.reference,
    customerName: o.customerName,
    phone: o.phone,
    city: o.city,
    address: o.address,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    total: o.total,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      variant: i.variant,
      size: i.size,
    })),
  }));

  return (
    <AdminShell
      title="Tableau de bord"
      subtitle="Vue d'ensemble de votre boutique — commandes, chiffre d'affaires et stock."
    >
      <DbStatusBanner />

      {/* Statistiques clés */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          icon="🧾"
          tint="blue"
          label="Commandes"
          value={String(orders.length)}
          hint="depuis le lancement"
        />
        <StatCard
          icon="⏳"
          tint="amber"
          label="En attente"
          value={String(pendingCount)}
          valueClassName="text-amber-600"
          hint={
            pendingCount > 0 ? "à confirmer rapidement" : "tout est traité ✓"
          }
        />
        <StatCard
          icon="💰"
          tint="green"
          label="CA encaissé"
          value={formatXOF(revenue)}
          valueClassName="text-merchant-green"
          hint="paiements reçus à la livraison"
        />
        <StatCard
          icon="📦"
          tint="violet"
          label="Produits"
          value={String(
            products.filter((p) => visibleCategoryIds.has(p.categoryId)).length
          )}
          hint="articles au catalogue"
        />
      </div>

      {/* Commandes / Historique des transactions */}
      <section id="commandes" className="mt-8 scroll-mt-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
              🧾 Historique des transactions
              <span className="rounded-full bg-merchant-container px-2.5 py-0.5 text-xs font-bold text-merchant-primary tabular-nums">
                {orders.length}
              </span>
            </h2>
            <p className="mt-0.5 text-sm text-merchant-sub">
              Cliquez sur une commande pour voir le détail, les articles et
              contacter le client.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/admin/export"
              download
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
              title="Télécharger l'historique complet au format Excel (.xlsx)"
            >
              📥 Télécharger Excel
            </a>
            <a
              href="/api/admin/backup"
              download
              className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700 shadow-sm transition hover:bg-sky-100"
              title="Sauvegarde complète de la boutique (produits, commandes, réglages) au format JSON"
            >
              💾 Sauvegarde du site
            </a>
            <RestoreButton />
          </div>
        </div>
        {orders.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed bg-white px-6 py-10 text-center text-sm text-gray-500">
            Aucune commande pour le moment. Les nouvelles commandes apparaîtront
            ici (livraison 24h, paiement à la livraison).
          </p>
        ) : (
          <div className="mt-4">
            <OrdersTable orders={orderDtos} />
          </div>
        )}
        <p className="mt-2 text-xs text-gray-400">
          Marquer « Livrée » enregistre automatiquement le paiement (l&apos;argent a
          été encaissé par le livreur). L&apos;export Excel contient 3 onglets :
          Résumé, Transactions et Articles vendus.
        </p>
      </section>

      {/* Produits & stock par catégorie */}
      <section id="stock" className="mt-10 scroll-mt-16">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              📦 Produits & stock par catégorie
            </h2>
            <p className="mt-0.5 text-sm text-merchant-sub">
              Prix, promotions, visibilité boutique et niveaux de stock.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-gray-400 sm:inline">
              ✏️ modifier · 📄 dupliquer · 🗑️ supprimer · − / + stock
            </span>
            <ProductEditor categories={categoryOptions} />
          </div>
        </div>

        {lowStock.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-bold text-amber-800">
              <span aria-hidden>⚠️</span> Stock faible — {lowStock.length}{" "}
              produit(s) à réapprovisionner
            </p>
            <div className="flex flex-wrap gap-1.5">
              {lowStock.map((p) => (
                <span
                  key={p.id}
                  className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200"
                >
                  {p.name} · {p.stock}
                </span>
              ))}
            </div>
          </div>
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
                    className="overflow-hidden rounded-2xl border border-merchant-border/40 bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-merchant-border/30 bg-merchant-low/70 px-4 py-2.5">
                      <h4 className="text-sm font-bold">
                        {cat.icon} {cat.name}
                      </h4>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-merchant-primary ring-1 ring-merchant-border/40 tabular-nums">
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
                            className="flex items-center justify-between gap-2 px-4 py-2 transition hover:bg-merchant-low/50"
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
                              {p.oldPrice !== null && p.oldPrice > p.price && (
                                <span
                                  className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white align-middle"
                                  title={`Promotion : ${formatXOF(p.oldPrice)} → ${formatXOF(p.price)}`}
                                >
                                  −{Math.round((1 - p.price / p.oldPrice) * 100)}%
                                </span>
                              )}
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              <span className="text-xs font-semibold text-gray-600 tabular-nums">
                                {formatXOF(p.price)}
                              </span>
                              <ProductEditor
                                categories={categoryOptions}
                                product={{
                                  id: p.id,
                                  name: p.name,
                                  description: p.description,
                                  price: p.price,
                                  oldPrice: p.oldPrice,
                                  categoryId: p.categoryId,
                                  image: p.image,
                                  imageUrl: p.imageUrl,
                                  gallery: parseGallery(p.gallery),
                                  colors: parseColors(p.colors),
                                  sizes: parseSizes(p.sizes),
                                  isFeatured: p.isFeatured,
                                  isActive: p.isActive,
                                }}
                              />
                              <ProductDuplicateButton productId={p.id} name={p.name} />
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
    </AdminShell>
  );
}
