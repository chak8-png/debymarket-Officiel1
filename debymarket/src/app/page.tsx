// Route : / — aiguillage uniquement, la vue est dans frontend/views.
// force-dynamic : l'accueil affiche stock, nouveautés et IMAGES PERSONNALISÉES
// (dashboard) — le HTML doit être régénéré à chaque visite, pas figé au build.
export const dynamic = "force-dynamic";

export { default } from "@/frontend/views/public/HomeView";
