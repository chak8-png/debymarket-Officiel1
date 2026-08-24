"use client";

import { useRef, useState } from "react";

/**
 * Bouton « 📥 Restaurer une sauvegarde » du tableau de bord.
 * Envoie le fichier JSON (téléchargé via « 💾 Sauvegarde du site ») à
 * /api/admin/restore qui REMPLACE tout le contenu (migration ou retour
 * arrière), puis recharge la page pour afficher les données restaurées.
 */
export default function RestoreButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFileSelected(file: File) {
    if (file.size > 50 * 1024 * 1024) {
      alert("⚠️ Fichier trop volumineux (50 Mo maximum).");
      return;
    }
    const raw = await file.text();
    try {
      JSON.parse(raw);
    } catch {
      alert("⚠️ Ce fichier n'est pas lisible : choisis le fichier debymarket-sauvegarde-….json");
      return;
    }
    const sure = window.confirm(
      "📥 Restauration de la boutique\n\n" +
        "⚠️ Le contenu ACTUEL (produits, commandes, réglages) sera entièrement REMPLACÉ par celui de la sauvegarde.\n\n" +
        "Continuer ?"
    );
    if (!sure) return;

    setBusy(true);
    try {
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: raw,
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        stats?: {
          produits: number;
          produitsIgnores: number;
          commandes: number;
          reglages: number;
        };
      };
      if (res.ok && data.ok && data.stats) {
        const s = data.stats;
        const ignored = s.produitsIgnores > 0 ? ` (${s.produitsIgnores} ignorés)` : "";
        alert(
          `✅ Restauration réussie !\n\n` +
            `• ${s.produits} produits${ignored}\n` +
            `• ${s.commandes} commandes\n` +
            `• ${s.reglages} réglages`
        );
        window.location.reload();
      } else {
        alert(`⚠️ Restauration refusée :\n${data.error ?? "erreur inconnue"}`);
      }
    } catch {
      alert("⚠️ Connexion impossible — vérifiez Internet et réessayez.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFileSelected(f);
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm transition hover:bg-violet-100 disabled:opacity-50"
        title="Restaurer une sauvegarde JSON (remplace tout le contenu actuel)"
      >
        {busy ? "Restauration…" : "📥 Restaurer"}
      </button>
    </>
  );
}
