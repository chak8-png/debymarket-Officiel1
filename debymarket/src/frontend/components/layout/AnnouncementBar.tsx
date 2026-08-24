import {
  SUPPORT_PHONE,
  SUPPORT_PHONE_2,
  toTelHref,
} from "@/backend/lib/constants";

/** Bandeau défilant en haut du site. */
export default function AnnouncementBar() {
  const items: React.ReactNode[] = [
    <>🚚 Livraison en 24h à Abidjan</>,
    <>
      📞 Service client lun–ven 8h–19h :{" "}
      <a href={toTelHref(SUPPORT_PHONE)} className="font-semibold underline-offset-2 hover:underline">
        {SUPPORT_PHONE}
      </a>{" "}
      ·{" "}
      <a href={toTelHref(SUPPORT_PHONE_2)} className="font-semibold underline-offset-2 hover:underline">
        {SUPPORT_PHONE_2}
      </a>
    </>,
    <>💵 Paiement à la livraison — payez à la réception du colis</>,
  ];

  return (
    <div
      className="overflow-hidden bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 py-2 text-white"
      role="note"
    >
      <div className="animate-marquee flex w-max">
        {[0, 1].map((dup) => (
          <div
            key={dup}
            aria-hidden={dup === 1}
            className="flex items-center gap-12 whitespace-nowrap pr-12 text-xs sm:text-sm"
          >
            {items.map((content, i) => (
              <span key={i} className="flex items-center gap-3">
                {content}
                <span className="text-white/40">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
