"use client";

// Bouton « Déconnexion » — appelle POST /api/admin/logout (supprime le cookie
// de session signé) puis renvoie vers l'écran de connexion.
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      title="Fermer la session d'administration sur cet appareil"
      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
    >
      {busy ? "…" : "🚪"} Déconnexion
    </button>
  );
}
