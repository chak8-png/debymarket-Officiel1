// Page : /admin/images — personnalisation des images d'accueil.
// (protégée par middleware.ts : session admin signée requise)
import type { Metadata } from "next";
import HomeImagesView from "@/frontend/views/admin/HomeImagesView";

export const metadata: Metadata = {
  title: "Images de l'accueil — Debymarket Admin",
};

export const dynamic = "force-dynamic";

export default function AdminImagesPage() {
  return <HomeImagesView />;
}
