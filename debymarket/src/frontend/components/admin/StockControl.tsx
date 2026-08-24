"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Contrôle du stock : boutons −/+ et saisie directe, sauvegarde via PATCH.
export default function StockControl({
  productId,
  stock,
}: {
  productId: number;
  stock: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(stock);
  const [loading, setLoading] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const lastSaved = useRef(stock);

  // Si la prop change (refresh serveur), on resynchronise l'affichage
  useEffect(() => {
    setValue(stock);
    lastSaved.current = stock;
  }, [stock]);

  const save = async (next: number) => {
    const clean = Math.max(0, Math.floor(next) || 0);
    setValue(clean);
    if (clean === lastSaved.current) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: clean }),
      });
      if (res.ok) {
        lastSaved.current = clean;
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 900);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const low = value <= 5;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-0.5 py-0.5 transition-colors ${
        savedFlash
          ? "border-green-400 bg-green-50"
          : low
            ? "border-red-200 bg-red-50/50"
            : "border-gray-200 bg-gray-50/60"
      }`}
      title="Stock — modifiez avec − / + ou en saisissant la quantité"
    >
      <button
        type="button"
        onClick={() => save(value - 1)}
        disabled={loading || value <= 0}
        aria-label="Diminuer le stock"
        className="flex h-6 w-6 items-center justify-center rounded-md text-sm font-bold text-gray-500 hover:bg-white hover:text-red-600 disabled:opacity-30"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        value={value}
        disabled={loading}
        onChange={(e) => setValue(Math.max(0, Math.floor(Number(e.target.value)) || 0))}
        onBlur={(e) => save(Number(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        aria-label="Quantité en stock"
        className={`w-10 appearance-none rounded-md bg-white text-center text-sm font-bold outline-none focus:ring-2 focus:ring-brand-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
          low ? "text-red-600" : "text-green-700"
        } ${loading ? "opacity-50" : ""}`}
      />
      <button
        type="button"
        onClick={() => save(value + 1)}
        disabled={loading}
        aria-label="Augmenter le stock"
        className="flex h-6 w-6 items-center justify-center rounded-md text-sm font-bold text-gray-500 hover:bg-white hover:text-green-600 disabled:opacity-30"
      >
        +
      </button>
    </span>
  );
}
