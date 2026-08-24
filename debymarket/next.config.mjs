/** @type {import('next').NextConfig} */

// En-têtes de sécurité appliqués à TOUTES les réponses (défense en profondeur).
const SECURITY_HEADERS = [
  // Empêche le navigateur de deviner le type MIME (anti exécution de contenu)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Anti-clickjacking : la boutique ne peut pas être mise en iframe par un site tiers
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Ne fuit pas l'URL complète vers les sites externes
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Désactive les API sensibles non utilisées (caméra, micro, géoloc…)
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // Force HTTPS pour toujours (Netlify sert en HTTPS)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Politique de contenu (CSP) — bloque l'exécution de scripts/styles externes non voulus
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // images : locales, data URI (photos produits uploadées) et https (visuels d'accueil)
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'", // Next/Tailwind injectent des styles inline
      "script-src 'self' 'unsafe-inline' https://static.hotjar.com", // Next inline + Hotjar
      "connect-src 'self' https://*.hotjar.com https://*.hotjar.io wss://*.hotjar.com", // nos API + Hotjar
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "frame-src https://*.hotjar.com", // widgets éventuels Hotjar (sondages)
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,

  // Ne pas annoncer « X-Powered-By: Next.js » (divulgation d'information :
  // moins un attaquant en sait sur la pile technique, mieux c'est).
  poweredByHeader: false,

  // Anti-SSRF : l'optimiseur d'images n'a le droit d'aller chercher AUCUNE
  // image distante (nos images sont locales ou data URI ; les <img> distants
  // passent directement par le navigateur, jamais par notre serveur).
  images: {
    remotePatterns: [],
  },

  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // Le dashboard et ses API manipulent des données sensibles (commandes,
      // clients, chiffre d'affaires) : JAMAIS de mise en cache — ni navigateur,
      // ni proxy intermédiaire.
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
          // Ne pas indexer l'administration dans les moteurs de recherche
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
