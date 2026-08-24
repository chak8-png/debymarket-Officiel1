// Hotjar (heatmaps & enregistrements de sessions) — chargé UNIQUEMENT si la
// variable d'environnement NEXT_PUBLIC_HOTJAR_ID contient votre Site ID
// (chiffres uniquement). Sans variable : aucun script tiers n'est chargé.
import Script from "next/script";

export default function Hotjar() {
  const raw = (process.env.NEXT_PUBLIC_HOTJAR_ID ?? "").trim();
  if (!/^\d+$/.test(raw)) return null; // jamais défini/invalide → rien

  return (
    <Script id="hotjar" strategy="afterInteractive">
      {`(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:${raw},hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`}
    </Script>
  );
}
