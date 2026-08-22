// robots.txt généré par Next.js (/robots.txt).
// L'administration, les API et le tunnel de commande ne doivent PAS être
// indexés par les moteurs de recherche (réduit la surface d'attaque visible).
import type { MetadataRoute } from "next";

const BASE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://debymarket.netlify.app"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/checkout", "/confirmation"],
      },
    ],
    // Indique aux moteurs où trouver le plan du site
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
