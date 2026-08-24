"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Bandeau d'alerte du tableau de bord : teste /api/health à l'ouverture.
 * Si la boutique est en MODE DÉMO (base de données injoignable), la
 * propriétaire est prévenue AVANT de saisir : tout article ajouté dans cet
 * état serait DÉFINITIVEMENT perdu au prochain redémarrage de l'hébergeur.
 */
export default function DbStatusBanner() {
  const [demo, setDemo] = useState(false);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = (await res.json()) as { persistant?: boolean };
      setDemo(data.persistant !== true);
    } catch {
      setDemo(false); // souci réseau côté navigateur : pas de fausse alerte
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  if (!demo) return null;

  return (
    <div
      role="alert"
      className="mb-6 rounded-2xl border-2 border-red-300 bg-red-50 p-5 text-red-900 shadow-sm"
    >
      <p className="font-display text-lg font-bold">
        ⛔ Base de données injoignable — ne saisissez RIEN
      </p>
      <p className="mt-1 text-sm leading-relaxed">
        La boutique est temporairement en <b>mode démonstration</b> : les
        produits affichés sont des exemples, et tout article ajouté ou modifié
        dans cet état serait <b>définitivement perdu</b>. Attendez quelques
        minutes puis cliquez sur « Réessayer » ; si le message persiste,
        prévenez votre développeur.
      </p>
      <button
        type="button"
        onClick={() => void check()}
        disabled={checking}
        className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {checking ? "Vérification…" : "🔄 Réessayer"}
      </button>
    </div>
  );
}
