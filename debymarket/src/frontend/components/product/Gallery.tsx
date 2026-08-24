"use client";

import { useState } from "react";
import PaymentBadge from "../payment/PaymentBadge";

const GRADIENTS = [
  "from-brand-100 to-amber-50",
  "from-amber-100 to-yellow-50",
  "from-brand-50 to-rose-50",
];

/**
 * Galerie photos de la fiche produit.
 * `images` = photo principale + photos supplémentaires (déjà dédoublonnées).
 * Sans photo : l'emoji de secours est affiché (avec variantes d'arrière-plan).
 */
export default function Gallery({
  images,
  emoji,
  name,
}: {
  images: string[];
  emoji: string;
  name: string;
}) {
  // Sans photo : on garde 3 vignettes « cadrages » autour de l'emoji (style historique)
  const count = images.length > 0 ? images.length : 3;
  const thumbs = Array.from({ length: count }, (_, i) => i);
  const [active, setActive] = useState(0);
  const current = images.length > 0 ? images[Math.min(active, images.length - 1)] : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Visuel principal */}
      <div
        className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br ${GRADIENTS[active % GRADIENTS.length]}`}
      >
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current}
            alt={active === 0 ? name : `${name} — photo ${active + 1}`}
            className="absolute inset-0 h-full w-full object-cover transition duration-300 hover:scale-105"
          />
        ) : (
          <span
            className="select-none text-[10rem] transition-transform duration-300 hover:scale-110 sm:text-[12rem]"
            role="img"
            aria-label={name}
          >
            {emoji}
          </span>
        )}

        {/* Compteur photos */}
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white">
            📷 {Math.min(active, images.length - 1) + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Miniatures cliquables (masquées si une seule image) */}
      {count > 1 && (
        <div className="flex flex-wrap gap-2">
          {thumbs.map((i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br text-3xl transition ${GRADIENTS[i % GRADIENTS.length]} ${
                i === active
                  ? "ring-2 ring-brand-500 ring-offset-2"
                  : "opacity-70 hover:opacity-100"
              }`}
              aria-label={`Photo ${i + 1}`}
            >
              {images[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={images[i]}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                emoji
              )}
            </button>
          ))}
        </div>
      )}

      <PaymentBadge compact />
    </div>
  );
}
