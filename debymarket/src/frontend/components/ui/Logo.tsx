import Link from "next/link";

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center"
      aria-label="Accueil Debymarket"
    >
      {light ? (
        // Badge blanc sur fond foncé (footer) pour garder le logo lisible
        <span className="inline-flex items-center rounded-2xl bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="Debymarket" className="h-14 w-auto" />
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/images/logo.png" alt="Debymarket" className="h-11 w-auto" />
      )}
    </Link>
  );
}
