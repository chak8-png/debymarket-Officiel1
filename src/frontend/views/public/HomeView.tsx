import Link from "next/link";
import { fetchProducts } from "@/backend/lib/products";
import { HOME_IMAGE_KEYS, getSettings } from "@/backend/lib/settings";
import {
  DELIVERY_TIME,
  DELIVERY_AREA,
  SUPPORT_PHONE,
  SUPPORT_PHONE_2,
} from "@/backend/lib/constants";
import ProductCard from "@/frontend/components/product/ProductCard";

// Visuels lifestyle (mêmes références Unsplash que la maquette d'origine)
const IMG = {
  hero: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80",
  mode: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
  femme: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
  electro: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
  menager: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80",
  jouets: "/images/home/jouets-jeux.jpg", // visuel local (jouets colorés)
  erotique: "/images/home/produit-erotique.jpg", // visuel local (roses & soie)
};

const UNIVERS = [
  {
    slug: "homme", // sert de clé pour la personnalisation d'image (dashboard)
    name: "Homme",
    href: "/categories/homme",
    desc: "Chemises, pantalons, costumes & vestes.",
    img: IMG.mode,
  },
  {
    slug: "femme",
    name: "Femme",
    href: "/categories/femme",
    desc: "Sacs, beauté, maillots de bain & chaussures.",
    img: IMG.femme,
  },
  {
    slug: "electronique-electromenager",
    name: "Électronique & Électroménager",
    href: "/categories/electronique-electromenager",
    desc: "High-tech, audio & équipement de la maison.",
    img: IMG.electro,
  },
  {
    slug: "jouets-jeux",
    name: "Jouets et jeux",
    href: "/categories/jouets-jeux",
    desc: "Jouets, jeux de société & éveil pour petits et grands.",
    img: IMG.jouets,
  },
  {
    slug: "produit-erotique",
    name: "Produit érotique",
    href: "/categories/produit-erotique",
    desc: "Espace adulte — commandes en emballage discret.",
    img: IMG.erotique,
    adult: true,
  },
];

const TRUST = [
  {
    icon: "🚚",
    title: "Livraison rapide",
    text: `${DELIVERY_AREA} en ${DELIVERY_TIME} chrono, intérieur sous 72h.`,
  },
  {
    icon: "💵",
    title: "Paiement à la livraison",
    text: "Vous payez en espèces à la réception. Zéro avance, zéro risque.",
  },
  {
    icon: "🛡️",
    title: "Garantie officielle",
    text: "Produits neufs, garantie constructeur.",
  },
  {
    icon: "🎧",
    title: "Service client lun–ven (8h–19h)",
    text: `Une équipe à ${DELIVERY_AREA} pour vous accompagner : ${SUPPORT_PHONE} / ${SUPPORT_PHONE_2}.`,
  },
];

export default async function HomeView() {
  const [featured, homeImages] = await Promise.all([
    fetchProducts({ featured: true, limit: 8 }),
    // Images d'accueil personnalisées via le dashboard (clé absente = défaut)
    getSettings(HOME_IMAGE_KEYS),
  ]);

  // Grande image principale : personnalisée ou image par défaut
  const heroImage = homeImages["home.hero"] ?? IMG.hero;
  // Cartes univers : idem, carte par carte (clé = slug de l'univers)
  const universCards = UNIVERS.map((u) => ({
    ...u,
    img: homeImages[`home.card.${u.slug}`] ?? u.img,
  }));

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="overflow-hidden border-b border-ink-100">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          {/* Texte */}
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-1.5 text-xs font-semibold text-ink-600">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              Livraison en {DELIVERY_TIME} à {DELIVERY_AREA} &amp; dans tout le pays
            </span>

            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink-950 sm:text-5xl lg:text-6xl">
              Le marché en ligne{" "}
              <span className="italic text-brand-600">pensé pour vous.</span>
            </h1>

            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-500">
              Le meilleur de l&apos;électronique, de l&apos;électroménager et de la
              mode — sélectionnés pour la vie ivoirienne, livrés à votre porte.
              Vous payez à la réception.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="rounded-full bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Explorer la boutique →
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-600">✓</span> Paiement à la livraison
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-600">✓</span> Service client lun–ven (8h–19h)
              </li>
            </ul>
          </div>

          {/* Visuel + cartes flottantes */}
          <div className="relative animate-fade-up fade-delay-1">
            <span className="absolute -top-5 left-6 z-10 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-ink-700 shadow-lg backdrop-blur">
              ✨ Collection 2026
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt="Shopping mode et lifestyle"
              className="h-[420px] w-full rounded-[2rem] object-cover sm:h-[520px]"
            />

            {/* Carte "commande confirmée" */}
            <div className="absolute -bottom-6 left-4 flex animate-fade-up items-center gap-3 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur fade-delay-2 sm:left-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                ✓
              </span>
              <div>
                <p className="text-sm font-bold text-ink-950">Commande confirmée</p>
                <p className="text-xs text-ink-500">
                  Livraison en {DELIVERY_TIME} 🚚
                </p>
              </div>
            </div>

            {/* Carte "paiement à la livraison" */}
            <div className="absolute -right-3 top-16 animate-fade-up rounded-2xl bg-ink-950 p-4 text-white shadow-xl fade-delay-3 sm:right-6">
              <p className="text-xs text-white/60">Zéro stress</p>
              <p className="font-display text-xl font-semibold">
                💵 Payez <span className="text-emerald-400">à la réception</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Univers (cartes photo) ────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
              Nos univers
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
              Trouvez ce que vous cherchez.
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden shrink-0 text-sm font-semibold text-ink-950 underline decoration-brand-500 decoration-2 underline-offset-4 hover:text-brand-600 sm:block"
          >
            Tout voir →
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {universCards.map((u) => (
            <Link
              key={u.name}
              href={u.href}
              className="group relative block h-80 overflow-hidden rounded-3xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={u.img}
                alt={u.name}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/15 to-transparent" />
              {"adult" in u && u.adult && (
                <span className="absolute right-4 top-4 rounded-full bg-red-600/95 px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-white shadow">
                  18+
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                  Collection
                </p>
                <h3 className="mt-1 font-display text-2xl font-semibold">
                  {u.name}
                </h3>
                <p className="mt-1 line-clamp-1 text-sm text-white/75">{u.desc}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-white/90 transition group-hover:text-brand-300 group-hover:underline">
                  Découvrir →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Sélection ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
              Coups de cœur
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
              Notre sélection.
            </h2>
          </div>
          <Link
            href="/products"
            className="shrink-0 text-sm font-semibold text-ink-950 underline decoration-brand-500 decoration-2 underline-offset-4 hover:text-brand-600"
          >
            Tout voir →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ── Réassurance ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div
              key={t.title}
              className="rounded-2xl border border-ink-100 bg-white p-6"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-xl">
                {t.icon}
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-950">
                {t.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Présentation (contenu éditorial + SEO) ─────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid gap-8 rounded-[2rem] border border-ink-100 bg-white p-8 sm:p-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
              Qui sommes-nous ?
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
              Debymarket, votre boutique en ligne à Abidjan
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-ink-600">
              <p>
                Debymarket est un marché en ligne ivoirien installé à Cocody,
                à Abidjan. Notre idée est simple : commander sur internet doit
                être aussi rassurant qu&apos;acheter en boutique. C&apos;est
                pourquoi nous avons fait le choix du <strong>paiement à la
                livraison</strong> — vous réglez votre commande en espèces,
                uniquement à la réception de votre colis, après avoir vérifié
                vos articles. Aucune avance, aucune carte bancaire à saisir,
                aucun risque.
              </p>
              <p>
                Notre catalogue réunit quatre univers : la mode <strong>homme</strong>
                (chemises, polos, pantalons, costumes et blazers), l&apos;univers
                <strong> femme</strong> (sacs à main, beauté et cosmétique,
                maillots de bain, chaussures), l&apos;<strong>électronique et
                l&apos;électroménager</strong> (téléphonie, écouteurs, power
                banks, petit équipement de la maison) ainsi qu&apos;un espace
                réservé aux adultes, géré avec discrétion. Chaque produit est
                sélectionné, vérifié et proposé au prix juste en francs CFA.
              </p>
              <p>
                La livraison est assurée en <strong>24 heures sur Abidjan</strong> :
                Cocody, Yopougon, Plateau, Adjamé, Marcory, Treichville, Abobo,
                Koumassi, Port-Bouët et Bingerville, pour un forfait unique de
                1 000 FCFA. Une question avant ou après votre commande ? Notre
                service client vous répond du lundi au vendredi, de 8h à 19h,
                par téléphone, WhatsApp ou email.
              </p>
            </div>
          </div>

          {/* ── FAQ (accordéons natifs) ─────────────────────────────── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
              Bon à savoir
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
              Questions fréquentes
            </h2>
            <div className="mt-5 space-y-3">
              {FAQ.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-2xl border border-ink-100 bg-cream px-5 py-4 open:bg-white open:shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink-950 [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="ml-3 shrink-0 text-brand-600 transition group-open:rotate-45">
                      ＋
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink-600">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* Données structurées FAQ pour Google (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQ.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
      </section>
    </div>
  );
}

// Questions fréquentes affichées en bas d'accueil (SEO + réassurance).
const FAQ = [
  {
    q: "Comment payer ma commande ?",
    a: "Uniquement à la livraison : vous payez en espèces au livreur, à la réception de votre colis. Aucun paiement en ligne n'est demandé — c'est la garantie de ne jamais avancer d'argent sans avoir vu vos articles.",
  },
  {
    q: "Quel est le délai de livraison ?",
    a: "24 heures sur Abidjan et sa périphérie (Cocody, Yopougon, Plateau, Adjamé, Marcory, Treichville, Abobo, Koumassi, Port-Bouët, Bingerville). Votre colis est préparé dès la validation de votre commande.",
  },
  {
    q: "Combien coûte la livraison ?",
    a: "Un forfait unique de 1 000 FCFA, quel que soit le montant ou le nombre d'articles de votre commande. Le montant total à payer vous est confirmé à la commande : pas de surprise.",
  },
  {
    q: "Comment passer commande ?",
    a: "Ajoutez vos articles au panier, renseignez votre nom, votre téléphone et votre adresse de livraison, puis validez. Vous pouvez aussi commander directement sur WhatsApp si vous préférez échanger avec notre équipe.",
  },
  {
    q: "Puis-je joindre le service client ?",
    a: `Oui, du lundi au vendredi de 8h00 à 19h00 : service client au ${SUPPORT_PHONE}, service après-vente au ${SUPPORT_PHONE_2}, ou par email. Nous vous aidons pour le suivi de commande, un échange ou un conseil produit.`,
  },
];
