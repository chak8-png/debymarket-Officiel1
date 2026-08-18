// Mini tracker d'événements (branchable plus tard sur GA4, Meta Pixel…).
"use client";

export function trackEvent(name: string, data: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const win = window as unknown as { dataLayer?: unknown[] };
  win.dataLayer = win.dataLayer ?? [];
  win.dataLayer.push({ event: name, ...data });
  if (process.env.NODE_ENV === "development") {
    console.debug(`[analytics] ${name}`, data);
  }
}
