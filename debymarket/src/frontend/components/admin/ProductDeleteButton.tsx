"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Bouton 🗑️ : supprime définitivement un produit après confirmation.
export default function ProductDeleteButton({
  productId,
  name,
}: {
  productId: number;
  name: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    if (
      !window.confirm(
        `Supprimer définitivement « ${name} » ?\n\nLe produit disparaîtra de la boutique. Cette action est irréversible.`
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        window.alert("Suppression impossible — réessayez.");
      }
    } catch {
      window.alert("Connexion impossible — vérifiez votre réseau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={loading}
      title="Supprimer ce produit"
      aria-label={`Supprimer ${name}`}
      className="flex h-6 w-6 items-center justify-center rounded-md text-xs hover:bg-white disabled:opacity-40"
    >
      {loading ? "⏳" : "🗑️"}
    </button>
  );
}
