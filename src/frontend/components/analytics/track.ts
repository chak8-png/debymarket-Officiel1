// Mini tracker d'événements (dataLayer) + passerelle Meta Pixel (fbq).
"use client";

// ── Meta Pixel ────────────────────────────────────────────────────────────
// ID du Pixel (chiffres uniquement). Priorité à la variable d'environnement
// NEXT_PUBLIC_META_PIXEL_ID (réglage Render) ; sinon valeur collée ci-dessous.
// (Un ID de Pixel est PUBLIC par nature : visible dans le code de la page,
//  ce n'est pas un secret comme un mot de passe.)
const HARDCODED_PIXEL_ID = "3079190972439220"; // Pixel Debymarket (actif)

const rawPixelId = (
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? HARDCODED_PIXEL_ID
).trim();

/** ID du Meta Pixel valide, ou "" = pixel totalement désactivé (rien chargé). */
export const PIXEL_ID = /^\d+$/.test(rawPixelId) ? rawPixelId : "";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Envoie un événement standard au Meta Pixel.
 * Sans effet si le pixel n'est pas configuré ou pas encore chargé.
 */
export function fbqTrack(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  window.fbq("track", event, params);
}

// ── Tracker interne (dataLayer, console en dev) ───────────────────────────
export function trackEvent(name: string, data: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const win = window as unknown as { dataLayer?: unknown[] };
  win.dataLayer = win.dataLayer ?? [];
  win.dataLayer.push({ event: name, ...data });
  if (process.env.NODE_ENV === "development") {
    console.debug(`[analytics] ${name}`, data);
  }
}
