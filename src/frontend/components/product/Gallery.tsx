"use client";

import { useState } from "react";
import PaymentBadge from "../payment/PaymentBadge";

const GRADIENTS = [
  "from-brand-100 to-amber-50",
  "from-amber-100 to-yellow-50",
  "from-brand-50 to-rose-50",
];

export default function Gallery({
  imageUrl,
  emoji,
  name,
}: {
  imageUrl?: string | null;
  emoji: string;
  name: string;
}) {
  const thumbs = [0, 1, 2];
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      {/* Visuel principal */}
      <div
        className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br ${GRADIENTS[active % GRADIENTS.length]}`}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
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
      </div>

      {/* Miniatures (variantes de cadrage) */}
      <div className="flex gap-2">
        {thumbs.map((i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br text-3xl transition ${GRADIENTS[i % GRADIENTS.length]} ${
              i === active
                ? "ring-2 ring-brand-500 ring-offset-2"
                : "opacity-70 hover:opacity-100"
            }`}
            aria-label={`Visuel ${i + 1}`}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              emoji
            )}
          </button>
        ))}
      </div>

      <PaymentBadge compact />
    </div>
  );
}
