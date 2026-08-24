"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Bouton 📄 : duplique un produit en 1 clic (copie conforme + « (copie) »).
// Idéal pour créer vite une déclinaison d'un article existant.
export default function ProductDuplicateButton({
  productId,
  name,
}: {
  productId: number;
  name: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onDuplicate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/duplicate`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        product?: { name?: string };
      };
      if (res.ok && data.ok) {
        window.alert(
          `✅ Copie créée : « ${data.product?.name ?? name + " (copie)"} »\n\nRetrouvez-la dans la liste et modifiez-la avec ✏️.`
        );
        router.refresh();
      } else {
        window.alert("Duplication impossible — réessayez.");
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
      onClick={onDuplicate}
      disabled={loading}
      title="Dupliquer ce produit (copie identique, modifiable)"
      aria-label={`Dupliquer ${name}`}
      className="flex h-6 w-6 items-center justify-center rounded-md text-xs hover:bg-white disabled:opacity-40"
    >
      {loading ? "⏳" : "📄"}
    </button>
  );
}
