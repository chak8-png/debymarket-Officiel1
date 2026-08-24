// Route : /products — aiguillage uniquement, la vue est dans frontend/views.
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tous les produits" };

export { default } from "@/frontend/views/public/ProductsView";
