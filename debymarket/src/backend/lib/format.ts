// Utilitaires PARTAGÉS (client + serveur) — aucune donnée sensible ici.
// C'est volontairement le seul module backend importable depuis le frontend.

/** 12500 → "12 500 FCFA" */
export function formatXOF(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

/** "Chemise & Polo" → "chemise-polo" */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Référence de commande, ex: "DM-LX3K9A-4F2Q" */
export function generateReference(prefix = "DM"): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}
