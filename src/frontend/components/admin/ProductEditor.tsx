"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  MAX_COLORS,
  MAX_GALLERY,
  MAX_SIZES,
  type ProductColor,
} from "@/backend/lib/product-variants";

// Éditeur de produit : bouton qui ouvre une fenêtre modale avec le formulaire.
// - Sans `product` : mode CRÉATION (« ➕ Ajouter un produit »)
// - Avec `product` : mode ÉDITION (bouton ✏️ dans la liste du stock)
// La photo est redimensionnée côté navigateur (max 800px, JPEG) puis envoyée
// encodée en base64 — aucun fichier à gérer côté serveur.

export interface CategoryOption {
  id: number;
  label: string; // ex : « 👗 Mode › Femme › Sac à main »
}

export interface EditableProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  image: string;
  imageUrl: string | null;
  /** Photos supplémentaires (ordre conservé). */
  gallery: string[];
  /** Couleurs proposées à la vente. */
  colors: ProductColor[];
  /** Tailles / pointures proposées (ex. S, M, L, XL, XXL ou 39…45). */
  sizes: string[];
  isFeatured: boolean;
  isActive: boolean;
}

/** Redimensionne une image côté client → data URI JPEG. */
async function fileToDataUri(
  file: File,
  maxDim = 800,
  quality = 0.82
): Promise<string> {
  const MAX = maxDim;
  const draw = (
    source: CanvasImageSource,
    width: number,
    height: number
  ): string => {
    const scale = Math.min(1, MAX / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  };

  try {
    const bitmap = await createImageBitmap(file);
    return draw(bitmap, bitmap.width, bitmap.height);
  } catch {
    // Repli : élément <img> + URL d'objet
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        try {
          resolve(draw(img, img.naturalWidth, img.naturalHeight));
        } catch (e) {
          reject(e);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Image illisible"));
      };
      img.src = url;
    });
  }
}

interface FormState {
  name: string;
  price: string;
  categoryId: string;
  description: string;
  image: string;
  isFeatured: boolean;
  isActive: boolean;
  stock: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  price: "",
  categoryId: "",
  description: "",
  image: "🛍️",
  isFeatured: false,
  isActive: true,
  stock: "10",
};

export default function ProductEditor({
  categories,
  product,
}: {
  categories: CategoryOption[];
  product?: EditableProduct;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoTouched, setPhotoTouched] = useState(false);
  const [gallery, setGallery] = useState<string[]>([]);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState("");
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#1d4ed8");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const isEdit = Boolean(product);

  const openModal = () => {
    if (product) {
      setForm({
        name: product.name,
        price: String(product.price),
        categoryId: String(product.categoryId),
        description: product.description,
        image: product.image || "🛍️",
        isFeatured: product.isFeatured,
        isActive: product.isActive,
        stock: "0", // inutilisé en édition (stock géré via −/+)
      });
      setPhoto(product.imageUrl);
      setPhotoTouched(false);
      setGallery(product.gallery ?? []);
      setColors(product.colors ?? []);
      setSizes(product.sizes ?? []);
    } else {
      setForm({ ...EMPTY_FORM, categoryId: String(categories[0]?.id ?? "") });
      setPhoto(null);
      setPhotoTouched(false);
      setGallery([]);
      setColors([]);
      setSizes([]);
    }
    setColorName("");
    setColorHex("#1d4ed8");
    setSizeInput("");
    setError(null);
    setOpen(true);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const dataUri = await fileToDataUri(file);
      if (dataUri.length > 790_000) {
        setError("Photo trop lourde même après compression — choisissez-en une autre.");
        return;
      }
      setPhoto(dataUri);
      setPhotoTouched(true);
    } catch {
      setError("Impossible de lire cette image (formats acceptés : JPG, PNG…).");
    }
  };

  const onGalleryFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    for (const file of Array.from(files)) {
      if (gallery.length >= MAX_GALLERY) break;
      try {
        const dataUri = await fileToDataUri(file, 640, 0.75);
        if (dataUri.length > 440_000) {
          setError("Une photo de galerie reste trop lourde — ignorée.");
          continue;
        }
        const uri = dataUri;
        setGallery((prev) =>
          prev.length >= MAX_GALLERY || prev.includes(uri) ? prev : [...prev, uri]
        );
      } catch {
        setError("Une image n'a pas pu être lue — ignorée.");
      }
    }
    if (galleryRef.current) galleryRef.current.value = "";
  };

  const addColor = () => {
    const name = colorName.trim().slice(0, 30);
    if (name === "") return;
    if (colors.some((c) => c.name.toLocaleLowerCase("fr") === name.toLocaleLowerCase("fr"))) {
      setError("Cette couleur est déjà dans la liste.");
      return;
    }
    if (colors.length >= MAX_COLORS) return;
    setError(null);
    setColors((prev) => [...prev, { name, hex: colorHex }]);
    setColorName("");
  };

  /** Ajoute une étiquette de taille/pointure unique (insensible à la casse). */
  const addSize = (raw: string) => {
    const label = raw.trim().slice(0, 10);
    if (label === "") return;
    setError(null);
    setSizes((prev) => {
      if (prev.length >= MAX_SIZES) return prev;
      const key = label.toLocaleLowerCase("fr");
      if (prev.some((x) => x.toLocaleLowerCase("fr") === key)) return prev;
      return [...prev, label];
    });
  };

  /** Raccourcis : série complète de tailles vêtement ou de pointures. */
  const addSizePreset = (labels: string[]) => {
    setError(null);
    setSizes((prev) => {
      const keys = new Set(prev.map((x) => x.toLocaleLowerCase("fr")));
      const next = [...prev];
      for (const l of labels) {
        if (next.length >= MAX_SIZES) break;
        if (!keys.has(l.toLocaleLowerCase("fr"))) {
          keys.add(l.toLocaleLowerCase("fr"));
          next.push(l);
        }
      }
      return next;
    });
    setSizeInput("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const price = Math.round(Number(form.price));
    const categoryId = Number(form.categoryId);
    if (form.name.trim().length < 2)
      return setError("Le nom doit contenir au moins 2 caractères.");
    if (!Number.isFinite(price) || price < 0)
      return setError("Prix invalide (entier en FCFA, ex : 8500).");
    if (!categoryId) return setError("Choisissez une catégorie.");

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      price,
      categoryId,
      description: form.description.trim(),
      image: form.image.trim() || "🛍️",
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    };
    if (!isEdit) {
      payload.stock = Math.max(0, Math.floor(Number(form.stock)) || 0);
      payload.imageUrl = photo ?? "";
    } else if (photoTouched) {
      payload.imageUrl = photo ?? ""; // "" = retirer la photo
    }
    payload.gallery = gallery;
    payload.colors = colors;
    payload.sizes = sizes;

    setLoading(true);
    try {
      const res = await fetch(
        isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Enregistrement impossible — réessayez.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Connexion impossible — vérifiez votre réseau.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
  const labelCls = "block text-xs font-bold text-gray-600 mb-1";

  return (
    <>
      {isEdit ? (
        <button
          type="button"
          onClick={openModal}
          title="Modifier ce produit (nom, prix, photo…)"
          aria-label={`Modifier ${product!.name}`}
          className="flex h-6 w-6 items-center justify-center rounded-md text-xs hover:bg-white"
        >
          ✏️
        </button>
      ) : (
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
        >
          ➕ Ajouter un produit
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold tracking-tight">
                {isEdit ? "✏️ Modifier le produit" : "➕ Ajouter un produit"}
              </h3>
              <button
                type="button"
                onClick={() => !loading && setOpen(false)}
                aria-label="Fermer"
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submit} className="mt-4 space-y-4">
              <div>
                <label className={labelCls} htmlFor="pe-name">Nom du produit *</label>
                <input
                  id="pe-name"
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex : Chemise homme en lin"
                  maxLength={120}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="pe-price">Prix (FCFA) *</label>
                  <input
                    id="pe-price"
                    className={inputCls}
                    type="number"
                    min={0}
                    step={1}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="8500"
                    required
                  />
                </div>
                {!isEdit && (
                  <div>
                    <label className={labelCls} htmlFor="pe-stock">Stock initial</label>
                    <input
                      id="pe-stock"
                      className={inputCls}
                      type="number"
                      min={0}
                      step={1}
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls} htmlFor="pe-cat">Catégorie *</label>
                <select
                  id="pe-cat"
                  className={inputCls}
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls} htmlFor="pe-desc">Description</label>
                <textarea
                  id="pe-desc"
                  className={`${inputCls} min-h-20 resize-y`}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Matière, taille, couleur, qualité…"
                  maxLength={2000}
                />
              </div>

              {/* Photo */}
              <div>
                <span className={labelCls}>Photo du produit</span>
                <div className="flex items-center gap-3">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-sand text-3xl">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt="Aperçu"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      form.image || "🛍️"
                    )}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onFile(e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100"
                    >
                      📷 Choisir une photo…
                    </button>
                    {photo && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhoto(null);
                          setPhotoTouched(true);
                        }}
                        className="text-left text-xs font-semibold text-red-500 hover:underline"
                      >
                        Retirer la photo
                      </button>
                    )}
                    <p className="text-[11px] leading-tight text-gray-400">
                      JPG/PNG — redimensionnée automatiquement. Sans photo,
                      l&apos;emoji ci-dessous est affiché.
                    </p>
                  </div>
                </div>
              </div>

              {/* 📸 Galerie : photos supplémentaires */}
              <div>
                <span className={labelCls}>
                  📸 Photos supplémentaires{" "}
                  <span className="font-normal text-gray-400">
                    ({gallery.length}/{MAX_GALLERY} — miniatures sous la photo principale)
                  </span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {gallery.map((src, idx) => (
                    <span
                      key={idx}
                      className="relative h-16 w-16 overflow-hidden rounded-xl border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Photo ${idx + 2}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setGallery(gallery.filter((_, i) => i !== idx))
                        }
                        aria-label={`Retirer la photo ${idx + 2}`}
                        title="Retirer"
                        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] text-white transition hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {gallery.length < MAX_GALLERY && (
                    <>
                      <input
                        ref={galleryRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => onGalleryFiles(e.target.files)}
                      />
                      <button
                        type="button"
                        onClick={() => galleryRef.current?.click()}
                        className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-300 text-brand-500 transition hover:bg-brand-50"
                      >
                        <span className="text-xl leading-none">＋</span>
                        <span className="mt-0.5 text-[9px] font-bold">Ajouter</span>
                      </button>
                    </>
                  )}
                </div>
                <p className="mt-1 text-[11px] leading-tight text-gray-400">
                  Jusqu&apos;à {MAX_GALLERY} photos (redimensionnées à 640px) — le
                  client pourra les faire défiler sur la fiche produit.
                </p>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div>
                  <label className={labelCls} htmlFor="pe-emoji">
                    Emoji de secours (si pas de photo)
                  </label>
                  <input
                    id="pe-emoji"
                    className={inputCls}
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="🛍️"
                    maxLength={8}
                  />
                </div>
                <div className="flex flex-col gap-2 pt-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) =>
                        setForm({ ...form, isFeatured: e.target.checked })
                      }
                      className="h-4 w-4 rounded accent-emerald-600"
                    />
                    ⭐ À la une
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm({ ...form, isActive: e.target.checked })
                      }
                      className="h-4 w-4 rounded accent-brand-600"
                    />
                    👁️ Visible sur la boutique
                  </label>
                </div>
              </div>

              {/* 🎨 Couleurs proposées */}
              <div>
                <span className={labelCls}>
                  🎨 Couleurs proposées{" "}
                  <span className="font-normal text-gray-400">
                    ({colors.length}/{MAX_COLORS} — optionnel)
                  </span>
                </span>
                {colors.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {colors.map((c) => (
                      <span
                        key={c.name}
                        className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700"
                      >
                        <span
                          aria-hidden
                          className="h-3.5 w-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: c.hex ?? "#e5e7eb" }}
                        />
                        {c.name}
                        <button
                          type="button"
                          onClick={() =>
                            setColors(colors.filter((x) => x.name !== c.name))
                          }
                          aria-label={`Retirer la couleur ${c.name}`}
                          title="Retirer"
                          className="text-gray-400 transition hover:text-red-500"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {colors.length < MAX_COLORS && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      aria-label="Nuancier"
                      title="Choisir la teinte"
                      className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-gray-200 bg-white p-1"
                    />
                    <input
                      value={colorName}
                      onChange={(e) => setColorName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addColor();
                        }
                      }}
                      placeholder="Nom (ex : Bleu ciel)"
                      maxLength={30}
                      aria-label="Nom de la couleur"
                      className={`${inputCls} flex-1`}
                    />
                    <button
                      type="button"
                      onClick={addColor}
                      className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      ➕ Ajouter
                    </button>
                  </div>
                )}
                <p className="mt-1 text-[11px] leading-tight text-gray-400">
                  Le client choisira une de ces couleurs sur la fiche — elle sera
                  indiquée dans la commande et l&apos;export Excel.
                </p>
              </div>

              {/* 📏 Tailles / pointures proposées */}
              <div>
                <span className={labelCls}>
                  📏 Tailles / Pointures{" "}
                  <span className="font-normal text-gray-400">
                    ({sizes.length}/{MAX_SIZES} — optionnel)
                  </span>
                </span>
                {sizes.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {sizes.map((sz) => (
                      <span
                        key={sz}
                        className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700"
                      >
                        {sz}
                        <button
                          type="button"
                          onClick={() => setSizes(sizes.filter((x) => x !== sz))}
                          aria-label={`Retirer la taille ${sz}`}
                          title="Retirer"
                          className="text-gray-400 transition hover:text-red-500"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {sizes.length < MAX_SIZES && (
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          addSizePreset(["S", "M", "L", "XL", "XXL"])
                        }
                        className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
                      >
                        👕 Tailles S → XXL
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          addSizePreset(["39", "40", "41", "42", "43", "44", "45"])
                        }
                        className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
                      >
                        👞 Pointures 39 → 45
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={sizeInput}
                        onChange={(e) => setSizeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSize(sizeInput);
                            setSizeInput("");
                          }
                        }}
                        placeholder="Autre (ex : 46, XXL…)"
                        maxLength={10}
                        aria-label="Taille ou pointure personnalisée"
                        className={`${inputCls} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          addSize(sizeInput);
                          setSizeInput("");
                        }}
                        className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        ➕ Ajouter
                      </button>
                    </div>
                  </div>
                )}
                <p className="mt-1 text-[11px] leading-tight text-gray-400">
                  Le client choisira la taille sur la fiche — elle sera indiquée
                  dans la commande et l&apos;export Excel.
                </p>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                  ⚠️ {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="rounded-xl border px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading
                    ? "Enregistrement…"
                    : isEdit
                      ? "💾 Enregistrer"
                      : "✅ Créer le produit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
