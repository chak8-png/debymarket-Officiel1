// Données de démonstration — utilisées en "mode démo" (sans DATABASE_URL)
// et par POST /api/seed pour remplir la base PostgreSQL.
import "server-only";
import type { Product } from "../db/schema";
import { getCategoryById } from "./categories";

// Dates décalées par id → les ids les plus récents apparaissent en "Nouveautés"
const BASE_TIME = Date.now();

// Photo par sous-catégorie (public/images/products/*) — jpg = photo IA, svg = visuel marque
const PHOTO_EXT: Record<string, "jpg" | "svg"> = {
  "chemise-polo": "jpg",
  "culotte-pantalon": "jpg",
  "blazer-costume": "jpg",
  "sac-a-main": "jpg",
  "beaute-cosmetique": "jpg",
  "maillot-de-bain": "jpg",
  "chaussure": "jpg",
  "chaussure-homme": "jpg",
  "jouets-enfant": "jpg",
  "jeux-de-societe": "jpg",
  "jouets-educatifs": "jpg",
  "electroniques": "jpg",
  "petit-electromenager": "jpg",
  "power-bank": "svg",
  "ecouteurs-casques": "svg",
};

function imageFor(categoryId: number): string | null {
  const slug = getCategoryById(categoryId)?.slug;
  const ext = slug ? PHOTO_EXT[slug] : undefined;
  return slug && ext ? `/images/products/${slug}.${ext}` : null;
}

const p = (
  id: number,
  slug: string,
  name: string,
  price: number,
  categoryId: number,
  image: string,
  opts: Partial<Product> = {}
): Product => ({
  id,
  slug,
  name,
  price,
  categoryId,
  image,
  imageUrl: imageFor(categoryId),
  description: "",
  oldPrice: null,
  stock: 25,
  rating: 4,
  isFeatured: false,
  isActive: true,
  createdAt: new Date(BASE_TIME - id * 3600_000), // -1h par id
  ...opts,
});

export const PRODUCTS: Product[] = [
  // ══════════════════════════════════════════════════════════════════
  // MODE > HOMME > Chemise & Polo
  // ══════════════════════════════════════════════════════════════════
  p(1, "chemise-homme-slim-blanche", "Chemise homme slim blanche", 8500, 3, "👔", {
    description: "Chemise slim en coton stretch, coupe moderne. Idéale bureau et soirées.",
    oldPrice: null,
    rating: 5,
    isFeatured: true,
    stock: 18,
  }),
  p(2, "polo-homme-coton", "Polo homme 100% coton", 6500, 3, "⛳", {
    description: "Polo piqué respirant, col boutonné. Disponible en plusieurs coloris.",
  }),
  p(27, "chemise-homme-rayee-manches-longues", "Chemise rayée manches longues", 7500, 3, "👔", {
    description: "Chemise à fines rayures, tissu anti-froissage, parfaite pour le bureau.",
  }),
  p(28, "chemise-homme-lin-beige", "Chemise en lin beige", 9500, 3, "👕", {
    description: "Lin léger et respirant, coupe droite. Le confort par temps chaud.",
    rating: 5,
    stock: 9,
  }),
  p(29, "polo-homme-premium", "Polo premium col mao", 8500, 3, "🏌️", {
    description: "Polo premium à col mao, finitions soignées, plusieurs coloris.",
    oldPrice: null,
  }),

  // ══════════════════════════════════════════════════════════════════
  // MODE > HOMME > Culotte & Pantalon
  // ══════════════════════════════════════════════════════════════════
  p(3, "pantalon-chino-homme", "Pantalon chino homme", 9000, 4, "👖", {
    description: "Chino ajusté confortable, parfait au quotidien.",
  }),
  p(4, "jean-slim-homme", "Jean slim homme", 11000, 4, "👖", {
    description: "Jean slim stretch, délavage tendance, très résistant.",
  }),
  p(30, "pantalon-cargo-homme", "Pantalon cargo homme", 12000, 4, "🩳", {
    description: "Cargo multipoches, coupe regular, tissu robuste.",
    rating: 5,
  }),
  p(31, "short-bermuda-homme", "Short bermuda homme", 6000, 4, "🩳", {
    description: "Bermuda léger en coton, idéal pour le week-end.",
    oldPrice: null,
  }),
  p(32, "pantalon-costume-homme", "Pantalon de costume", 10000, 4, "👔", {
    description: "Pantalon habillé à pinces, tombe impeccable.",
  }),

  // ══════════════════════════════════════════════════════════════════
  // MODE > HOMME > Blazer & Costume
  // ══════════════════════════════════════════════════════════════════
  p(5, "blazer-homme-noir", "Blazer homme noir", 25000, 5, "🤵", {
    description: "Blazer ajusté une boutonnière, finitions soignées.",
  }),
  p(6, "costume-homme-2-pieces", "Costume homme 2 pièces", 45000, 5, "🕴️", {
    description: "Veste + pantalon assortis. Élégant pour mariages et cérémonies.",
    oldPrice: null,
    rating: 5,
    isFeatured: true,
    stock: 7,
  }),
  p(33, "blazer-homme-lin-beige", "Blazer en lin beige", 28000, 5, "🧥", {
    description: "Blazer léger en lin mélangé, style décontracté chic.",
  }),
  p(34, "costume-homme-3-pieces", "Costume homme 3 pièces", 65000, 5, "🎩", {
    description: "Veste + gilet + pantalon. Le grand classique des grandes occasions.",
    oldPrice: null,
    rating: 5,
    isFeatured: true,
    stock: 4,
  }),
  p(35, "veste-croisee-homme", "Veste croisée bleu marine", 32000, 5, "🤵", {
    description: "Veste croisée structurée, boutons métal dorés.",
  }),

  // ══════════════════════════════════════════════════════════════════
  // MODE > FEMME > Sac à main
  // ══════════════════════════════════════════════════════════════════
  p(7, "sac-a-main-cuir-femme", "Sac à main femme cuir PU", 15000, 7, "👜", {
    description: "Grand sac à main élégant, bandoulière amovible incluse.",
    oldPrice: null,
    rating: 5,
    isFeatured: true,
  }),
  p(8, "sac-bandouliere-femme", "Sac bandoulière femme", 9500, 7, "👝", {
    description: "Petit sac pratique et léger, idéal pour les sorties.",
  }),
  p(36, "sac-cabas-femme", "Sac cabas grande capacité", 12000, 7, "👜", {
    description: "Cabas spacieux avec pochette intérieure zippée.",
  }),
  p(37, "pochette-soiree-femme", "Pochette de soirée", 6500, 7, "👛", {
    description: "Pochette élégante à chaîne dorée, parfaite pour les événements.",
    oldPrice: null,
  }),
  p(38, "sac-a-dos-femme", "Sac à dos femme chic", 13500, 7, "🎒", {
    description: "Sac à dos en simili cuir, compartiment tablette.",
    oldPrice: null,
    rating: 5,
  }),

  // ══════════════════════════════════════════════════════════════════
  // MODE > FEMME > Beauté Cosmétique
  // ══════════════════════════════════════════════════════════════════
  p(9, "kit-maquillage-12-pieces", "Kit maquillage 12 pièces", 12000, 8, "💄", {
    description: "Coffret complet : palette, rouges à lèvres, pinceaux…",
    rating: 5,
    isFeatured: true,
  }),
  p(10, "coffret-beaute-visage", "Coffret beauté visage", 7500, 8, "🧴", {
    description: "Routine complète : crème hydratante, sérum et masque.",
  }),
  p(39, "kit-pinceaux-maquillage", "Kit 12 pinceaux maquillage", 5000, 8, "🖌️", {
    description: "Pinceaux doux synthétiques avec trousse de rangement.",
  }),
  p(40, "palette-fards-a-paupieres", "Palette 35 fards à paupières", 8000, 8, "🎨", {
    description: "35 teintes mattes et irisées hautement pigmentées.",
    oldPrice: null,
    stock: 11,
  }),
  p(41, "fond-de-teint-liquide", "Fond de teint liquide longue tenue", 6500, 8, "🧴", {
    description: "Couvrance modulable, fini naturel, tenue 12h.",
  }),

  // ══════════════════════════════════════════════════════════════════
  // MODE > FEMME > Maillot de bain
  // ══════════════════════════════════════════════════════════════════
  p(11, "maillot-de-bain-2-pieces", "Maillot de bain 2 pièces", 8000, 9, "👙", {
    description: "Bikini tendance, tissu extensible à séchage rapide.",
  }),
  p(42, "maillot-de-bain-1-piece", "Maillot de bain 1 pièce noir", 9000, 9, "🩱", {
    description: "Une pièce sculptant, dos nageur, très flatteur.",
    rating: 5,
  }),
  p(43, "bikini-taille-haute", "Bikini taille haute", 7500, 9, "👙", {
    description: "Ensemble taille haute rétro, imprimé tropical.",
    oldPrice: null,
  }),
  p(44, "pareo-plage", "Paréo de plage", 4000, 9, "🏖️", {
    description: "Grand paréo léger 180×90 cm, motifs wax.",
  }),

  // ══════════════════════════════════════════════════════════════════
  // MODE > FEMME > Chaussure
  // ══════════════════════════════════════════════════════════════════
  p(13, "escarpins-femme", "Escarpins femme talon 8cm", 13500, 11, "👠", {
    description: "Escarpins vernis, talon stable, parfaits pour vos événements.",
  }),
  p(14, "baskets-femme", "Baskets femme tendance", 14000, 11, "👟", {
    description: "Baskets légères et confortables, style urbain.",
  }),
  p(48, "sandales-talons-femme", "Sandales à talons", 11000, 11, "👡", {
    description: "Sandales élégantes à bride fine, talon 6 cm.",
    oldPrice: null,
  }),
  p(49, "ballerines-femme", "Ballerines femme", 7500, 11, "🥿", {
    description: "Ballerines souples, intérieur en cuir, idéales au quotidien.",
  }),
  p(50, "mocassins-homme-cuir", "Mocassins homme cuir", 15000, 11, "👞", {
    description: "Mocassins en cuir véritable, cousus main.",
    rating: 5,
    isFeatured: true,
  }),

  // ══════════════════════════════════════════════════════════════════
  // ÉLECTRONIQUE & ÉLECTROMÉNAGER > Électroniques
  // ══════════════════════════════════════════════════════════════════
  p(15, "smartphone-android-128go", "Smartphone Android 128 Go", 65000, 13, "📱", {
    description: "Écran 6,5\", double SIM, batterie longue durée, garantie 12 mois.",
    oldPrice: null,
    rating: 5,
    isFeatured: true,
    stock: 10,
  }),
  p(16, "montre-connectee", "Montre connectée", 18000, 13, "⌚", {
    description: "Notifications, sport, fréquence cardiaque. Compatible Android/iOS.",
  }),
  p(51, "tablette-10-pouces", "Tablette 10 pouces 64 Go", 55000, 13, "💻", {
    description: "Tablette HD 10\", idéale études et divertissement. Garantie 12 mois.",
    rating: 5,
  }),
  p(52, "tv-led-32-pouces", "TV LED 32 pouces HD", 95000, 13, "📺", {
    description: "TV 32\" HD Ready, 2 HDMI, USB. Livrée avec support mural.",
    oldPrice: null,
    rating: 5,
    isFeatured: true,
    stock: 5,
  }),
  p(53, "enceinte-bluetooth", "Enceinte Bluetooth portable", 12500, 13, "🔊", {
    description: "Son puissant 20W, étanche IPX6, autonomie 12h.",
    oldPrice: null,
  }),
  p(54, "cle-usb-64go", "Clé USB 64 Go", 3500, 13, "💾", {
    description: "Clé USB 3.0 rapide, boîtier métal.",
  }),

  // ══════════════════════════════════════════════════════════════════
  // ÉLECTRONIQUE & ÉLECTROMÉNAGER > Petit Électroménager
  // ══════════════════════════════════════════════════════════════════
  p(17, "mixeur-blender-1-5l", "Mixeur blender 1,5 L", 14500, 14, "🥤", {
    description: "Blender 500W avec bol gradué, idéal jus et purées.",
  }),
  p(18, "bouilloire-electrique", "Bouilloire électrique 1,8 L", 9900, 14, "☕", {
    description: "Chauffe rapide, arrêt automatique, sans fil sur socle.",
  }),
  p(55, "ventilateur-sur-pied", "Ventilateur sur pied", 15000, 14, "🌀", {
    description: "3 vitesses, oscillant, silencieux. L'allié contre la chaleur.",
    rating: 5,
    isFeatured: true,
  }),
  p(56, "fer-a-repasser-vapeur", "Fer à repasser vapeur", 10500, 14, "👔", {
    description: "Semelle antiadhésive, jet de vapeur 120 g/min.",
  }),
  p(57, "machine-a-cafe", "Machine à café 12 tasses", 22000, 14, "☕", {
    description: "Cafetière programmable avec maintien au chaud.",
    oldPrice: null,
    stock: 8,
  }),
  p(58, "mixeur-plongeant", "Mixeur plongeant 3-en-1", 8500, 14, "🥣", {
    description: "Mixeur + fouet + hachoir, idéal sauces et soupes.",
  }),

  // ══════════════════════════════════════════════════════════════════
  // ÉLECTRONIQUE & ÉLECTROMÉNAGER > Power Bank
  // ══════════════════════════════════════════════════════════════════
  p(19, "power-bank-20000mah", "Power Bank 20 000 mAh", 11000, 15, "🔋", {
    description: "Charge rapide 22,5W, 2 ports USB + USB-C.",
    oldPrice: null,
    rating: 5,
    isFeatured: true,
    imageUrl: "/images/products/power-bank-20000mah.jpg",
  }),
  p(20, "power-bank-10000mah", "Power Bank 10 000 mAh", 7500, 15, "🔋", {
    description: "Compact et léger, recharge 2 fois un smartphone.",
    imageUrl: "/images/products/power-bank-10000mah.jpg",
  }),
  p(59, "power-bank-solaire-20000", "Power Bank solaire 20 000 mAh", 13000, 15, "🔆", {
    description: "Recharge solaire + USB, lampe LED intégrée. Parfait en déplacement.",
    rating: 5,
    imageUrl: "/images/products/power-bank-solaire.jpg",
  }),
  p(60, "power-bank-magnetique", "Power Bank magnétique 10 000 mAh", 9500, 15, "🧲", {
    description: "S'aimante au dos du téléphone, charge sans fil 15W.",
    oldPrice: null,
    imageUrl: "/images/products/power-bank-magnetique.jpg",
  }),

  // ══════════════════════════════════════════════════════════════════
  // ÉLECTRONIQUE & ÉLECTROMÉNAGER > Écouteurs & Casques
  // ══════════════════════════════════════════════════════════════════
  p(21, "ecouteurs-bluetooth-tws", "Écouteurs Bluetooth TWS", 6000, 16, "🎧", {
    description: "Réduction de bruit, boîtier de charge, autonomie 24h.",
    oldPrice: null,
    rating: 5,
    imageUrl: "/images/products/ecouteurs-bluetooth-tws.jpg",
  }),
  p(22, "casque-sans-fil", "Casque sans fil pliable", 15000, 16, "🎧", {
    description: "Son immersif, coussinets confort, autonomie 40h.",
    imageUrl: "/images/products/casque-sans-fil.jpg",
  }),
  p(61, "ecouteurs-filaires", "Écouteurs filaires (lot de 2)", 2500, 16, "🎵", {
    description: "Lot économique de 2 écouteurs intra-auriculaires.",
  }),
  p(62, "ecouteurs-sport", "Écouteurs sport anti-transpiration", 7000, 16, "🏃", {
    description: "Crochets d'oreille, résistants à la sueur, autonomie 10h.",
    imageUrl: "/images/products/ecouteurs-sport.jpg",
  }),
  p(63, "casque-gamer-rgb", "Casque gamer RGB", 19900, 16, "🎮", {
    description: "Micro rétractable, son surround 7.1, rétroéclairage RGB.",
    oldPrice: null,
    stock: 6,
    imageUrl: "/images/products/casque-gamer-rgb.jpg",
  }),

  // ══════════════════════════════════════════════════════════════════
  // MODE > FEMME > Lingerie sexy (section 18+)
  // ══════════════════════════════════════════════════════════════════
  p(70, "ensemble-lingerie-dentelle-2-pieces", "Ensemble lingerie dentelle 2 pièces", 9500, 10, "🎀", {
    description: "Soutien-gorge + tanga en dentelle florale douce. Plusieurs coloris et tailles.",
    rating: 5,
  }),
  p(71, "nuisette-satin-elegante", "Nuisette en satin élégante", 12000, 10, "🎀", {
    description: "Nuisette fluide en satin, bretelles réglables, finitions dentelle.",
  }),
  p(72, "body-dentelle-ajustable", "Body en dentelle ajustable", 13500, 10, "🎀", {
    description: "Body sculptant en dentelle extensible, fermeture à agrafes, bonnets souples.",
  }),
  p(73, "bas-autofixants-dentelle", "Bas autofixants en dentelle", 4500, 10, "🎀", {
    description: "Bas fins avec bande de dentelle silicone antidérapante.",
  }),

  // ══════════════════════════════════════════════════════════════════
  // PRODUIT ÉROTIQUE (section adulte 18+) — emballage discret garanti
  // ══════════════════════════════════════════════════════════════════
  p(74, "manchon-silicone-ultra-doux", "Manchon en silicone ultra-doux", 9500, 18, "🖤", {
    description: "Silicone médical hypoallergénique, texture douce, facile à nettoyer. Emballage discret.",
  }),
  p(75, "manchon-silicone-texture", "Manchon silicone texture perlée", 11500, 18, "🖤", {
    description: "Texture interne stimulante, silicone souple de qualité. Emballage discret.",
  }),
  p(76, "manchon-vibrant-rechargeable-usb", "Manchon vibrant rechargeable USB", 14900, 18, "🖤", {
    description: "10 modes de vibration, rechargeable USB, étanche. Livré dans un emballage neutre.",
    rating: 5,
  }),
  p(77, "anneau-penien-silicone-souple", "Anneau pénien en silicone souple", 5500, 19, "⭕", {
    description: "Anneau extensible en silicone doux, confortable, taille universelle.",
  }),
  p(78, "anneau-penien-vibrant-rechargeable", "Anneau pénien vibrant rechargeable", 8900, 19, "⭕", {
    description: "Vibrations réglables, silicone doux, rechargeable USB, étanche.",
  }),
  p(79, "anneau-penien-double-silicone", "Anneau pénien double silicone", 7500, 19, "⭕", {
    description: "Double anneau extensible pour un maintien renforcé, silicone médical.",
  }),
  p(80, "lubrifiant-eau-100ml", "Lubrifiant à base d'eau 100 ml", 6500, 20, "💧", {
    description: "Formule à base d'eau, compatible préservatifs, ne colle pas, sans parfum.",
  }),
  p(81, "lubrifiant-effet-chauffant-50ml", "Lubrifiant effet chauffant 50 ml", 7500, 20, "💧", {
    description: "Sensation de chaleur douce, base d'eau, compatible préservatifs.",
  }),
  p(82, "lubrifiant-silicone-longue-duree", "Lubrifiant silicone longue durée 100 ml", 8900, 20, "💧", {
    description: "Glisse très longue durée, quelques gouttes suffisent. Non compatible avec les accessoires en silicone.",
  }),
  p(83, "preservatifs-classiques-x12", "Préservatifs classiques (boîte de 12)", 3500, 21, "🛡️", {
    description: "Préservatifs lubrifiés, testés électroniquement, norme CE.",
  }),
  p(84, "preservatifs-ultra-fins-x10", "Préservatifs ultra-fins (boîte de 10)", 3900, 21, "🛡️", {
    description: "Finesse maximale pour plus de sensations, sécurité testée.",
  }),
  p(85, "preservatifs-textures-x12", "Préservatifs texturés (boîte de 12)", 4200, 21, "🛡️", {
    description: "Surface perlée et nervurée, lubrifiés, norme CE.",
  }),
  p(86, "preservatifs-retardants-x10", "Préservatifs retardants (boîte de 10)", 4900, 21, "🛡️", {
    description: "Lubrifiant à effet retardant doux, testés électroniquement.",
    rating: 5,
  }),

  // ══════════════════════════════════════════════════════════════════
  // HOMME > Chaussure
  // ══════════════════════════════════════════════════════════════════
  p(87, "mocassins-cuir-homme", "Mocassins en cuir homme", 25000, 22, "👞", {
    description: "Cuir véritable souple, semelle cousue main — habillé ou décontracté.",
    rating: 5,
  }),
  p(88, "baskets-urbaines-homme", "Baskets urbaines homme", 20000, 22, "👟", {
    description: "Baskets confortables à semelle épaisse amortissante, esprit streetwear.",
  }),
  p(89, "derbies-cuir-homme", "Derbies en cuir homme", 30000, 22, "👞", {
    description: "Derbies élégantes en cuir pleine fleur — bureau, cérémonies, grandes occasions.",
    rating: 5,
  }),
  p(90, "sandales-cuir-homme", "Sandales en cuir homme", 12000, 22, "🩴", {
    description: "Sandales en cuir robuste, brides ajustables, confort au quotidien.",
  }),

  // ══════════════════════════════════════════════════════════════════
  // JOUETS ET JEUX
  // ══════════════════════════════════════════════════════════════════
  // ── Jouets enfant ────────────────────────────────────────────────────
  p(91, "voiture-telecommandee-rc", "Voiture télécommandée RC", 15000, 24, "🚗", {
    description: "Buggy radiocommandé tout-terrain, batterie rechargeable USB, vitesse 15 km/h.",
    rating: 5,
  }),
  p(92, "figurines-super-heros-x6", "Figurines super-héros (set de 6)", 9500, 24, "🦸", {
    description: "6 figurines articulées de 15 cm, peinture détaillée — dès 4 ans.",
  }),
  p(93, "pistolet-a-eau-geant", "Pistolet à eau géant", 6500, 24, "🔫", {
    description: "Réservoir 1,2 L, portée 10 m — le champion des après-midi sous le soleil.",
  }),

  // ── Jeux de société ─────────────────────────────────────────────────
  p(94, "awale-bois-artisanal", "Awalé en bois artisanal", 8000, 25, "🎲", {
    description: "Grand classique africain sculpté à la main, 48 graines incluses — le jeu de stratégie d'ici.",
    rating: 5,
  }),
  p(95, "jeu-de-cartes-uno-x2", "Jeu de cartes UNO", 4500, 25, "🃏", {
    description: "Le jeu de cartes familial incontournable — 108 cartes, règles en français.",
  }),
  p(96, "echecs-magnetiques-voyage", "Échecs magnétiques de voyage", 7500, 25, "♟️", {
    description: "Échiquier pliant 25 cm, pièces feutrées aimantées — jouez partout.",
  }),

  // ── Jouets éducatifs ────────────────────────────────────────────────
  p(97, "blocs-construction-120-pieces", "Blocs de construction (120 pièces)", 12000, 26, "🧱", {
    description: "Baril de 120 briques compatibles grandes marques — créativité sans fin dès 3 ans.",
    rating: 5,
  }),
  p(98, "tableau-magnetique-alphabet", "Tableau magnétique alphabet", 8500, 26, "🔤", {
    description: "Lettres + chiffres aimantés colorés et ardoise effaçable — apprendre en s'amusant.",
  }),
  p(99, "puzzle-carte-afrique-500", "Puzzle carte de l'Afrique (500 pièces)", 9000, 26, "🧩", {
    description: "Carte illustrée du continent en 500 pièces — géographie et patience en famille.",
  }),
];
