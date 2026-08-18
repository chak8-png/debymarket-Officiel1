// Route : /admin — aiguillage uniquement, la vue est dans frontend/views.
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administration" };

// Toujours à jour (les commandes changent en permanence)
export const dynamic = "force-dynamic";

export { default } from "@/frontend/views/admin/DashboardView";
