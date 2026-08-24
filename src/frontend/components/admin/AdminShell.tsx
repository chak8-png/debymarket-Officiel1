"use client";

// « Chrome » du tableau de bord marchand : barre haute + menu latéral.
// Design « Merchant Pro » : surfaces bleutées claires (palette merchant),
// bleu primaire, vert accent — cohérent avec la charte Debymarket.
// RESPONSIVE : sur PC le menu est fixe à gauche ; sur mobile il s'ouvre
// en panneau par-dessus l'écran (bouton ☰), rien ne déborde.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import LogoutButton from "./LogoutButton";

const MENU = [
  { href: "/admin", icon: "📊", label: "Tableau de bord" },
  { href: "/admin#commandes", icon: "🧾", label: "Commandes" },
  { href: "/admin#stock", icon: "🛍️", label: "Stock produits" },
  { href: "/admin/images", icon: "🖼️", label: "Images de l'accueil" },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {MENU.map((item) => {
        const isActive = item.href === "/admin/images"
          ? pathname === "/admin/images"
          : pathname === "/admin" && !item.href.includes("#");
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "bg-merchant-primary text-white shadow-sm"
                : "text-merchant-sub hover:bg-merchant-low hover:text-merchant-primary"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-merchant-sub transition hover:bg-merchant-low hover:text-merchant-primary"
      >
        <span className="text-base">🛒</span>
        Voir la boutique
      </Link>
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      {/* Identité marchand */}
      <div className="flex items-center gap-3 px-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-merchant-primary text-lg text-white shadow-sm">
          🛍️
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-merchant-text">
            DebyMarket Admin
          </p>
          <p className="text-[11px] font-medium text-merchant-sub">
            ✓ Marchand vérifié
          </p>
        </div>
      </div>

      {/* Action principale */}
      <Link
        href="/admin/images"
        onClick={onNavigate}
        className="flex items-center justify-center gap-2 rounded-xl bg-merchant-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-merchant-primarydark"
      >
        🖼️ Images de l'accueil
      </Link>

      <NavItems onNavigate={onNavigate} />

      <div className="mt-auto space-y-2 border-t border-merchant-border/50 pt-3">
        <LogoutButton />
      </div>
    </div>
  );
}

export default function AdminShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Boutons d'action affichés à droite du titre (Excel, sauvegarde…). */
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="min-h-screen bg-merchant-bg text-merchant-text">
      {/* ── Barre haute ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-merchant-border/50 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-2 px-3 sm:gap-3 sm:px-5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-xl text-merchant-primary transition hover:bg-merchant-low lg:hidden"
          >
            ☰
          </button>
          <Link
            href="/admin"
            className="font-display text-lg font-bold tracking-tight text-merchant-primary sm:text-xl"
          >
            DebyMarket <span className="hidden sm:inline">Merchant</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-merchant-border/70 bg-white px-3 py-2 text-xs font-bold text-merchant-text shadow-sm transition hover:border-merchant-primary hover:text-merchant-primary sm:text-sm"
            >
              🛒 <span className="hidden sm:inline">Voir la boutique</span>
              <span className="sm:hidden">Boutique</span>
            </Link>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-merchant-container text-sm" title="Compte marchand">
              👤
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        {/* ── Menu latéral (PC) ─────────────────────────────────────── */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-merchant-border/50 bg-merchant-low lg:block">
          <SidebarBody />
        </aside>

        {/* ── Menu latéral (mobile — panneau coulissant) ────────────── */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            <div
              className="absolute inset-0 bg-ink-950/40"
              onClick={close}
              aria-hidden="true"
            />
            <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-merchant-low shadow-xl">
              <div className="flex items-center justify-between border-b border-merchant-border/50 px-4 py-3">
                <span className="text-sm font-bold text-merchant-primary">Menu</span>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Fermer le menu"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-merchant-sub hover:bg-white"
                >
                  ✕
                </button>
              </div>
              <div className="h-[calc(100%-3.25rem)]">
                <SidebarBody onNavigate={close} />
              </div>
            </div>
          </div>
        )}

        {/* ── Contenu ───────────────────────────────────────────────── */}
        <main className="min-w-0 flex-1 px-3 py-5 sm:px-5 lg:px-8 lg:py-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 text-sm text-merchant-sub">{subtitle}</p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            ) : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
