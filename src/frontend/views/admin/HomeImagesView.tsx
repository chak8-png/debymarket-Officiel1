"use client";

// Page admin : /admin/images — personnalise les images de la page d'accueil.
// Upload depuis le téléphone/PC (redimensionné automatiquement en JPEG) ou
// lien d'image https. « Rétablir » revient à l'image d'origine du site.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Slot {
  key: string; // clé de réglage côté serveur
  label: string;
  hint: string;
  defaultImg: string;
  maxWidth: number; // redimensionnement
}

// Les valeurs par défaut = celles codées dans la page d'accueil
const SLOTS: Slot[] = [
  {
    key: "home.hero",
    label: "🖼️ Image principale (héros)",
    hint: "Grande photo en haut de l'accueil — format paysage conseillé (≈ 1600 px de large)",
    defaultImg:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80",
    maxWidth: 1600,
  },
  {
    key: "home.card.homme",
    label: "👔 Carte « Homme »",
    hint: "Format portrait conseillé (hauteur > largeur)",
    defaultImg:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    maxWidth: 1200,
  },
  {
    key: "home.card.femme",
    label: "👗 Carte « Femme »",
    hint: "Format portrait conseillé",
    defaultImg:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
    maxWidth: 1200,
  },
  {
    key: "home.card.electronique-electromenager",
    label: "🔌 Carte « Électronique & Électroménager »",
    hint: "Format portrait conseillé",
    defaultImg:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
    maxWidth: 1200,
  },
  {
    key: "home.card.quincaillerie",
    label: "🔧 Carte « Quincaillerie »",
    hint: "Format portrait conseillé",
    defaultImg: "/images/home/quincaillerie.jpg",
    maxWidth: 1200,
  },
  {
    key: "home.card.jouets-jeux",
    label: "🧸 Carte « Jouets et jeux »",
    hint: "Format portrait conseillé",
    defaultImg: "/images/home/jouets-jeux.jpg",
    maxWidth: 1200,
  },
  {
    key: "home.card.produit-erotique",
    label: "🌹 Carte « Produit érotique » (18+)",
    hint: "Restez élégant et non explicite — format portrait conseillé",
    defaultImg: "/images/home/produit-erotique.jpg",
    maxWidth: 1200,
  },
];

type State = Record<string, string>; // key → valeur choisie (data URI / https / "" = défaut)

/** Redimensionne le fichier image côté navigateur → data URI JPEG. */
function fileToDataUri(file: File, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas indisponible"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Fichier image illisible"));
    };
    img.src = url;
  });
}

function SlotCard({
  slot,
  saved,
  onSaved,
}: {
  slot: Slot;
  saved: string | undefined; // valeur actuellement enregistrée côté serveur
  onSaved: (key: string, value: string | null) => void;
}) {
  const [pending, setPending] = useState<string | null>(null); // modif non sauvegardée
  const [urlInput, setUrlInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const current = saved ?? slot.defaultImg; // affichée sur le site
  const preview = pending ?? current; // aperçu local

  const save = async (value: string | null) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: slot.key, value }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMsg({ ok: false, text: data.error ?? "Erreur inattendue." });
        return;
      }
      onSaved(slot.key, value && value !== "" ? value : null);
      setPending(null);
      setUrlInput("");
      setMsg({
        ok: true,
        text: value ? "✅ Image enregistrée — visible sur la boutique !" : "↺ Image d'origine rétablie.",
      });
    } catch {
      setMsg({ ok: false, text: "Connexion impossible, réessayez." });
    } finally {
      setBusy(false);
    }
  };

  const pickFile = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setMsg({ ok: false, text: "Choisissez un fichier image (JPG, PNG, WebP)." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const dataUri = await fileToDataUri(f, slot.maxWidth);
      if (dataUri.length > 1_000_000) {
        setMsg({ ok: false, text: "Image trop lourde même après compression — choisissez-en une autre." });
        return;
      }
      setPending(dataUri);
      // Enregistrement immédiat pour plus de simplicité
      await save(dataUri);
    } catch {
      setMsg({ ok: false, text: "Impossible de lire cette image." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      {/* Aperçu */}
      <div className="relative h-44 bg-sand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt={slot.label} className="h-full w-full object-cover" />
        {saved !== undefined && (
          <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow">
            ✓ Personnalisée
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white">
          Aperçu
        </span>
      </div>

      <div className="p-5">
        <h3 className="font-display text-base font-semibold">{slot.label}</h3>
        <p className="mt-0.5 text-xs text-gray-500">{slot.hint}</p>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            📁 Changer la photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          {saved !== undefined && (
            <button
              type="button"
              onClick={() => save("")}
              disabled={busy}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-brand-400 hover:text-brand-700 disabled:opacity-50"
            >
              ↺ Rétablir l'image d'origine
            </button>
          )}
        </div>

        {/* Lien d'image (optionnel) */}
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-gray-500 hover:text-brand-600">
            …ou coller le lien d'une image (https)
          </summary>
          <div className="mt-2 flex gap-2">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://exemple.com/photo.jpg"
              inputMode="url"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-brand-500"
            />
            <button
              type="button"
              disabled={busy || !urlInput.trim().startsWith("https://")}
              onClick={() => save(urlInput.trim())}
              className="shrink-0 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-40"
            >
              Enregistrer
            </button>
          </div>
        </details>

        {busy && <p className="mt-3 text-xs font-semibold text-brand-600">⏳ Enregistrement…</p>}
        {msg && (
          <p className={`mt-3 text-xs font-semibold ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}

export default function HomeImagesView() {
  const [saved, setSaved] = useState<State>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setSaved(d.settings ?? {}))
      .finally(() => setLoaded(true));
  }, []);

  const onSaved = (key: string, value: string | null | undefined) =>
    setSaved((prev) => {
      const next = { ...prev };
      if (value === null || value === undefined || value === "") delete next[key];
      else next[key] = value;
      return next;
    });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            🖼️ Images de la page d'accueil
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Changez la grande photo d'accueil et les cartes des univers — les
            photos sont envoyées depuis votre téléphone ou votre ordinateur et
            visibles <strong>immédiatement</strong> sur la boutique.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-brand-400 hover:text-brand-700"
        >
          ← Tableau de bord
        </Link>
      </div>

      {!loaded ? (
        <p className="mt-10 text-center text-sm text-gray-400">Chargement…</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {SLOTS.map((slot) => (
            <SlotCard key={slot.key} slot={slot} saved={saved[slot.key]} onSaved={onSaved} />
          ))}
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm leading-relaxed text-blue-900">
        💡 <strong>Conseils :</strong> photos nettes et lumineuses, sans texte
        dessus. L'image est compressée automatiquement (JPEG) pour charger vite
        sur les téléphones de vos clients. Vous pouvez revenir à l'image
        d'origine à tout moment avec « ↺ Rétablir ».
      </div>
    </div>
  );
}
