// Meta Pixel (publicités Facebook & Instagram).
// L'ID se résout AU CHARGEMENT : réglage admin en base (dashboard → Réglages)
// > valeur par défaut du code. "off" côté admin = aucun script chargé.
"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PIXEL_ID, fbqTrack } from "./track";

export default function MetaPixel() {
  const pathname = usePathname();
  const firstRender = useRef(true);
  // null = résolution en cours · "" = pixel désactivé · sinon l'ID actif
  const [pixelId, setPixelId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/config/pixel", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("http"))))
      .then((d: { pixelId?: unknown }) => {
        if (!alive) return;
        const id =
          typeof d.pixelId === "string" && /^\d{6,20}$/.test(d.pixelId)
            ? d.pixelId
            : "";
        setPixelId(id);
      })
      .catch(() => {
        if (alive) setPixelId(PIXEL_ID); // réseau/HS → défaut du code
      });
    return () => {
      alive = false;
    };
  }, []);

  // Pages vues lors des navigations internes (App Router = SPA)
  useEffect(() => {
    if (!pixelId) return;
    if (firstRender.current) {
      firstRender.current = false; // la 1re PageView vient du snippet de base
      return;
    }
    fbqTrack("PageView");
  }, [pathname, pixelId]);

  if (!pixelId) return null; // pas encore résolu OU désactivé → rien

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');
fbq('track','PageView');`}
      </Script>
      {/* Repli sans JavaScript (balise image officielle) */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
