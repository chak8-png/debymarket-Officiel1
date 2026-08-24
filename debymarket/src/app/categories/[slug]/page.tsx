export const dynamic = "force-dynamic";
// Route : /categories/[slug] — aiguillage uniquement, la vue est dans frontend/views.
import type { Metadata } from "next";
import { getCategoryBySlug } from "@/backend/lib/categories";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  return { title: category?.name ?? "Catégorie" };
}

export { default } from "@/frontend/views/public/CategoryView";
