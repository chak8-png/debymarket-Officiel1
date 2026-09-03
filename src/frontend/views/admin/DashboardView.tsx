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

      {/* Statistiques */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <div className="rounded-2xl border border-merchant-border/40 bg-white p-4 shadow-sm lg:p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-merchant-sub">Commandes</p>
          <p className="mt-1 text-xl font-display font-bold tracking-tight lg:text-2xl">
            {orders.length}
          </p>
        </div>
        <div className="rounded-2xl border border-merchant-border/40 bg-white p-4 shadow-sm lg:p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-merchant-sub">En attente</p>
          <p className="mt-1 text-xl font-display font-bold tracking-tight text-amber-600 lg:text-2xl">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-2xl border border-merchant-border/40 bg-white p-4 shadow-sm lg:p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-merchant-sub">CA encaissé</p>
          <p className="mt-1 text-xl font-display font-bold tracking-tight text-merchant-green lg:text-2xl">
            {formatXOF(revenue)}
          </p>
        </div>
        <div className="rounded-2xl border border-merchant-border/40 bg-white p-4 shadow-sm lg:p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-merchant-sub">Produits suivis</p>
          <p className="mt-1 text-xl font-display font-bold tracking-tight lg:text-2xl">
            {products.filter((p) => visibleCategoryIds.has(p.categoryId)).length}
          </p>
        </div>
      </div>

      {/* Commandes / Historique des transactions */}
      <section id="commandes" className="mt-8 scroll-mt-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            🧾 Historique des transactions
          </h2>
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            📦 Produits & stock par catégorie
          </h2>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-gray-400 sm:inline">
              ✏️ modifier · 📄 dupliquer · 🗑️ supprimer · − / + stock
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
