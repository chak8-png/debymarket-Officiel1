"use client";

// Page admin : /admin/reglages — réglages du site modifiables SANS développeur.
// Premier réglage proposé : le Pixel Meta (publicités Facebook / Instagram) —
// changer l'ID, le désactiver, ou revenir au réglage d'origine. Effet ~5 min.
import { useEffect, useState } from "react";
import AdminShell from "@/frontend/components/admin/AdminShell";
import DotWave from "@/frontend/components/ui/DotWave";
import { DEFAULT_META_PIXEL_ID } from "@/backend/lib/constants";

const KEY = "meta.pixel.id";

type Feedback = { ok: boolean; text: string } | null;

export default function ReglagesView() {
  const [loading, setLoading] = useState(true);
  const [override, setOverride] = useState<string | null>(null); // valeur en base
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const isOff = override === "off";
  const effectiveId = override === null ? DEFAULT_META_PIXEL_ID : override;

  // Charge le réglage courant
  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { settings?: Record<string, string> }) => {
        const v = d?.settings?.[KEY] ?? null;
        setOverride(v);
        setInput(v && v !== "off" ? v : "");
      })
      .catch(() =>
        setFeedback({ ok: false, text: "Lecture impossible — rechargez la page." })
      )
      .finally(() => setLoading(false));
  }, []);

  async function save(value: string | null, successText: string) {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: KEY, value }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Enregistrement impossible.");
      }
      setOverride(value);
      setInput(value && value !== "off" ? value : "");
      setFeedback({ ok: true, text: successText });
    } catch (e) {
      setFeedback({
        ok: false,
        text: e instanceof Error ? e.message : "Erreur inattendue.",
      });
    } finally {
      setSaving(false);
    }
  }

  const submit = () => {
    const id = input.trim();
    if (!/^\d{6,20}$/.test(id)) {
      setFeedback({
        ok: false,
        text: "ID invalide : 6 à 20 CHIFFRES uniquement (ex. 3079190972439220).",
      });
      return;
    }
    void save(id, "✅ Pixel enregistré — actif sur le site sous ~5 minutes.");
  };

  return (
    <AdminShell
      title="Réglages"
      subtitle="Paramètres du site modifiables sans développeur — appliqués en quelques minutes."
    >
      <div className="mt-5 max-w-2xl">
        {/* ── Pixel Meta ─────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-merchant-border/40 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold tracking-tight">
              🎯 Pixel Facebook & Instagram
            </h2>
            {isOff ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-200">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Désactivé
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 ring-1 ring-green-200">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Actif
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-merchant-sub">
            Le Pixel mesure les visiteurs, les paniers et les ventes venues de vos
            publicités. Vous pouvez changer son ID, le désactiver temporairement,
            ou revenir au réglage d&apos;origine.
          </p>

          {loading ? (
            <DotWave size={10} className="mt-6" label="Chargement…" />
          ) : (
            <div className="mt-5 space-y-4">
              {/* ID courant */}
              <div className="rounded-xl bg-merchant-low px-4 py-3 text-sm">
                <span className="font-semibold text-merchant-sub">
                  Pixel actuellement actif :{" "}
                </span>
                {isOff ? (
                  <span className="font-bold text-red-600">aucun (désactivé)</span>
                ) : (
                  <span className="font-mono font-bold text-merchant-primary">
                    {effectiveId}
                  </span>
                )}
                {override === null && !isOff && (
                  <span className="ml-2 rounded-full bg-merchant-container px-2 py-0.5 text-[10px] font-bold text-merchant-primary">
                    réglage d&apos;origine
                  </span>
                )}
              </div>

              {/* Champ ID */}
              <div>
                <label
                  htmlFor="pixel-id"
                  className="text-sm font-bold text-merchant-text"
                >
                  ID du Pixel
                </label>
                <input
                  id="pixel-id"
                  type="text"
                  inputMode="numeric"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ex. 3079190972439220"
                  className="mt-1.5 w-full rounded-xl border border-merchant-border/70 bg-cream px-4 py-2.5 font-mono text-sm outline-none focus:border-merchant-primary"
                />
                <p className="mt-1.5 text-xs text-merchant-sub">
                  📍 Où le trouver : business.facebook.com → Gestionnaire
                  d&apos;événements → le numéro à 15-16 chiffres sous le nom du
                  Pixel.
                </p>
              </div>

              {/* Retour d'information */}
              {feedback && (
                <p
                  role="status"
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                    feedback.ok
                      ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                      : "bg-red-50 text-red-700 ring-1 ring-red-200"
                  }`}
                >
                  {feedback.text}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={submit}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-merchant-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-merchant-primarydark disabled:opacity-50"
                >
                  {saving ? "⏳ Enregistrement…" : "💾 Enregistrer"}
                </button>
                {!isOff && (
                  <button
                    type="button"
                    onClick={() =>
                      void save("off", "⛔ Pixel désactivé — plus aucun suivi sur le site.")
                    }
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                  >
                    ⛔ Désactiver
                  </button>
                )}
                {override !== null && (
                  <button
                    type="button"
                    onClick={() =>
                      void save(null, "↺ Réglage d'origine restauré (Pixel par défaut).")
                    }
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl border border-merchant-border/70 bg-white px-4 py-2.5 text-sm font-bold text-merchant-text transition hover:border-merchant-primary hover:text-merchant-primary disabled:opacity-50"
                  >
                    ↺ Revenir au réglage d&apos;origine
                  </button>
                )}
              </div>

              <p className="text-xs text-merchant-sub">
                ⏱️ Les changements sont visibles côté visiteurs sous ~5 minutes
                (actualisez avec Ctrl+F5 pour vérifier).
              </p>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
