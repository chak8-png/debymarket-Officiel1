// Catalogue des catégories — SOURCE DE VÉRITÉ (partagée client + serveur).
// Structure à 2 niveaux : Univers (depth 0) → Sous-catégorie (depth 1).
// Le menu, les pages /categories/[slug], le dashboard et l'export se
// construisent TOUS automatiquement à partir de cette liste.
import type { Category } from "../db/schema";

const row = (
  id: number,
  slug: string,
  name: string,
  depth: number,
  icon: string,
  parentId: number | null = null,
  position = 0
): Category => ({ id, slug, name, depth, icon, parentId, position });

export const CATEGORY_LIST: Category[] = [
  // ── Univers 1 : Homme ────────────────────────────────────────────────
  row(2, "homme", "Homme", 0, "👔", null, 1),
  row(3, "chemise-polo", "Chemise & Polo", 1, "👔", 2, 1),
  row(4, "culotte-pantalon", "Culotte & Pantalon", 1, "👖", 2, 2),
  row(5, "blazer-costume", "Blazer & Costume", 1, "🤵", 2, 3),
  row(22, "chaussure-homme", "Chaussure", 1, "👞", 2, 4),
  row(27, "autres-homme", "Autres", 1, "🗂️", 2, 5),

  // ── Univers 2 : Femme ────────────────────────────────────────────────
  row(6, "femme", "Femme", 0, "👗", null, 2),
  row(7, "sac-a-main", "Sac à main", 1, "👜", 6, 1),
  row(8, "beaute-cosmetique", "Beauté Cosmétique", 1, "💄", 6, 2),
  row(9, "maillot-de-bain", "Maillot de bain", 1, "👙", 6, 3),
  row(10, "lingerie-sexy", "Lingerie sexy", 1, "🎀", 6, 4),
  row(11, "chaussure", "Chaussure", 1, "👠", 6, 5),
  row(28, "vetements", "Vêtements", 1, "👗", 6, 6),
  row(29, "autres-femme", "Autres", 1, "🗂️", 6, 7),

  // ── Univers 3 : Électronique & Électroménager ───────────────────────
  row(12, "electronique-electromenager", "Électronique & Électroménager", 0, "🔌", null, 3),
  row(13, "electroniques", "Électroniques", 1, "📱", 12, 1),
  row(14, "petit-electromenager", "Petit Électroménager", 1, "🥤", 12, 2),
  row(15, "power-bank", "Power Bank", 1, "🔋", 12, 3),
  row(16, "ecouteurs-casques", "Écouteurs & Casques", 1, "🎧", 12, 4),
  row(30, "ventilateurs-climatisation", "Ventilateurs & Climatisation", 1, "🌀", 12, 5),
  row(31, "maison-cuisine", "Maison & Cuisine", 1, "🍳", 12, 6),
  row(32, "autres-electronique", "Autres", 1, "🗂️", 12, 7),

  // ── Univers 4 : Quincaillerie ────────────────────────────────────────
  // Pas de sous-catégories : les produits se rangent directement ici.
  row(33, "quincaillerie", "Quincaillerie", 0, "🔧", null, 4),

  // ── Univers 5 : Jouets et jeux ──────────────────────────────────────
  row(23, "jouets-jeux", "Jouets et jeux", 0, "🧸", null, 5),
  row(24, "jouets-enfant", "Jouets enfant", 1, "🧸", 23, 1),
  row(25, "jeux-de-societe", "Jeux de société", 1, "🎲", 23, 2),
  row(26, "jouets-educatifs", "Jouets éducatifs", 1, "🧩", 23, 3),
  row(34, "jouet-electronique", "Jouet électronique", 1, "🎮", 23, 4),

  // ── Univers 6 : Produit érotique (section adulte 18+) ────────────────
  row(17, "produit-erotique", "Produit érotique", 0, "🔞", null, 6),
  row(18, "manchon-silicone", "Manchon silicone", 1, "🖤", 17, 1),
  row(19, "anneau-penien", "Anneau Pénien", 1, "⭕", 17, 2),
  row(20, "lubrifiant", "Lubrifiant", 1, "💧", 17, 3),
  row(21, "preservatifs", "Préservatifs", 1, "🛡️", 17, 4),
];

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORY_LIST.find((c) => c.slug === slug);
}

export function getCategoryById(id: number): Category | undefined {
  return CATEGORY_LIST.find((c) => c.id === id);
}

export function getChildren(id: number): Category[] {
  return CATEGORY_LIST.filter((c) => c.parentId === id).sort(
    (a, b) => a.position - b.position
  );
}

export function getRootCategories(): Category[] {
  return CATEGORY_LIST.filter((c) => c.depth === 0).sort(
    (a, b) => a.position - b.position
  );
}

// ---------------------------------------------------------------------------
// Section adulte (18+) — détection pour les badges / avertissements
// ---------------------------------------------------------------------------
const ADULT_ROOT_ID = 17; // univers « Produit érotique »
const ADULT_EXTRA_IDS = new Set<number>([10]); // « Lingerie sexy » (Femme)

/** true si la catégorie fait partie de l'espace adulte (elle ou un parent). */
export function isAdultCategory(id: number): boolean {
  if (ADULT_EXTRA_IDS.has(id)) return true;
  let current = getCategoryById(id);
  while (current) {
    if (current.id === ADULT_ROOT_ID) return true;
    current =
      current.parentId !== null ? getCategoryById(current.parentId) : undefined;
  }
  return false;
}

/** Arbre complet pour la navigation. */
export function getCategoryTree(): CategoryNode[] {
  const build = (cat: Category): CategoryNode => ({
    ...cat,
    children: getChildren(cat.id).map(build),
  });
  return getRootCategories().map(build);
}

/** Ids de la catégorie + toutes ses descendantes (inclut elle-même). */
export function getDescendantIds(slug: string): number[] {
  const root = getCategoryBySlug(slug);
  if (!root) return [];
  const ids: number[] = [root.id];
  const walk = (id: number) => {
    for (const child of CATEGORY_LIST.filter((c) => c.parentId === id)) {
      ids.push(child.id);
      walk(child.id);
    }
  };
  walk(root.id);
  return ids;
}

/** Fil d'Ariane : [Homme, Chemise & Polo]. */
export function getBreadcrumb(slug: string): Category[] {
  const crumbs: Category[] = [];
  let current = getCategoryBySlug(slug);
  while (current) {
    crumbs.unshift(current);
    current =
      current.parentId !== null ? getCategoryById(current.parentId) : undefined;
  }
  return crumbs;
}
