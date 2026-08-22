// VUE : page « À propos » — présentation de la boutique + coordonnées.
import Logo from "@/frontend/components/ui/Logo";
import {
  DELIVERY_TIME,
  DELIVERY_AREA,
  SUPPORT_PHONE,
  SUPPORT_PHONE_2,
  SITE_EMAIL,
  SITE_ADDRESS_1,
  SITE_ADDRESS_2,
  OPENING_HOURS,
  WHATSAPP_URL,
  toTelHref,
} from "@/backend/lib/constants";

const CONTACTS = [
  {
    icon: "📞",
    label: "Service client",
    value: `+225 ${SUPPORT_PHONE}`,
    href: toTelHref(SUPPORT_PHONE),
  },
  {
    icon: "📞",
    label: "Service après-vente",
    value: `+225 ${SUPPORT_PHONE_2}`,
    href: toTelHref(SUPPORT_PHONE_2),
  },
  {
    icon: "✉️",
    label: "Email",
    value: SITE_EMAIL,
    href: `mailto:${SITE_EMAIL}`,
  },
];

const VALUES = [
  {
    icon: "🚚",
    title: `Livraison en ${DELIVERY_TIME}`,
    text: `Commandez aujourd'hui, recevez demain — partout à ${DELIVERY_AREA}.`,
  },
  {
    icon: "💵",
    title: "Paiement à la livraison",
    text: "Vous ne payez qu'à la réception de votre colis, en espèces. Zéro risque.",
  },
  {
    icon: "🛡️",
    title: "Qualité vérifiée",
    text: "Chaque article est sélectionné et contrôlé avant d'être mis en ligne.",
  },
];

export default function AboutView() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Présentation */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          À propos de <span className="text-brand-600">Debymarket</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-gray-600">
          Debymarket est une boutique en ligne ivoirienne basée à {DELIVERY_AREA}.
          Notre mission est simple : vous proposer des produits de qualité au
          meilleur prix, avec un service pensé pour la vie d&apos;ici — commander
          en quelques clics, être livré en {DELIVERY_TIME} et payer en espèces
          uniquement à la réception de votre colis.
        </p>
      </div>

      {/* Nos engagements */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {VALUES.map((v) => (
          <div
            key={v.title}
            className="rounded-2xl border bg-white p-5 text-center shadow-sm"
          >
            <span className="text-3xl">{v.icon}</span>
            <h2 className="mt-2 font-display text-base font-semibold">
              {v.title}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{v.text}</p>
          </div>
        ))}
      </div>

      {/* Bloc contact — fond vert (comme la maquette) */}
      <section className="mt-12 overflow-hidden rounded-3xl bg-emerald-900 px-6 py-10 text-center text-emerald-50 shadow-lg">
        <div className="flex justify-center">
          <Logo light />
        </div>
        <h2 className="mt-6 font-display text-xl font-semibold text-white">
          📍 Nous trouver & nous contacter
        </h2>
        <p className="mt-4 font-semibold text-white">
          {SITE_ADDRESS_1}
          <br />
          <span className="text-emerald-200">{SITE_ADDRESS_2}</span>
        </p>

        <ul className="mx-auto mt-6 max-w-md space-y-2.5 text-sm">
          {CONTACTS.map((c) => (
            <li key={c.label}>
              <a
                href={c.href}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-medium text-emerald-50 transition hover:bg-emerald-800 hover:text-white"
              >
                <span>{c.icon}</span>
                <span className="font-bold">{c.value}</span>
                <span className="text-emerald-300">- {c.label}</span>
              </a>
            </li>
          ))}
          <li className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-medium text-emerald-50">
            <span>🕐</span>
            <span>{OPENING_HOURS}</span>
          </li>
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-emerald-400"
          >
            💬 Commander sur WhatsApp
          </a>
          <a
            href={toTelHref(SUPPORT_PHONE)}
            className="rounded-xl border border-emerald-400/60 px-5 py-2.5 text-sm font-bold text-emerald-50 transition hover:bg-emerald-800"
          >
            📞 Appeler la boutique
          </a>
        </div>
      </section>
    </div>
  );
}
