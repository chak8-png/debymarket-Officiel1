// Événement Meta « ViewContent » : tiré à l'ouverture d'une fiche produit.
// (Composant client minuscule branché dans la vue produit, qui est serveur.)
"use client";

import { useEffect, useRef } from "react";
import { fbqTrack } from "./track";

export default function PixelViewContent({
  id,
  name,
  price,
}: {
  id: number;
  name: string;
  price: number;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fbqTrack("ViewContent", {
      content_ids: [id],
      content_name: name,
      content_type: "product",
      value: price,
      currency: "XOF",
    });
  }, [id, name, price]);

  return null;
}
