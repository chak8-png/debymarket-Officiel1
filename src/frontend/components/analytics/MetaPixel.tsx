// Meta Pixel (publicités Facebook & Instagram) — chargé UNIQUEMENT si un ID
// de Pixel valide est configuré (NEXT_PUBLIC_META_PIXEL_ID ou track.ts).
// Sans ID : AUCUN script tiers n'est chargé, le site reste identique.
"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { PIXEL_ID, fbqTrack } from "./track";

export default function MetaPixel() {
  const pathname = usePathname();
  const firstRender = useRef(true);

  // Pages vues lors des navigations internes (Next.js App Router = SPA :
  // la 1re PageView est tirée par le snippet de base, on suit les suivantes).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    fbqTrack("PageView");
  }, [pathname]);

  if (!PIXEL_ID) return null; // pas d'ID → rien du tout

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');
fbq('track','PageView');`}
      </Script>
      {/* Repli sans JavaScript (balise image officielle) */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
