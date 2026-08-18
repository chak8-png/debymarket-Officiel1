# 🛍️ Debymarket

Boutique e-commerce ivoirienne — **Next.js (App Router) · TypeScript · Tailwind CSS · PostgreSQL + Drizzle**.
Design éditorial : fond crème, texte encre, accent framboise, titres **Fraunces** + corps **Inter**.

- 🚚 **Livraison en 24h** sur Abidjan (forfait 1 000 FCFA)
- 💵 **Paiement à la livraison** uniquement (aucun paiement en ligne)
- 🗂️ Catalogue 3 niveaux : Mode (Homme/Femme) · Électronique & Électroménager
- 📊 Dashboard admin : commandes, produits & stock, **images d'accueil personnalisables** (`/admin/images`), **export Excel des transactions**

## 🚀 Démarrage rapide

```bash
npm install
npm run dev
```

Puis ouvrir **http://localhost:3000** — le site fonctionne immédiatement en
**mode démo** (85 articles en mémoire, aucune base requise).

### Avec une vraie base PostgreSQL (optionnel)

```bash
cp .env.example .env.local       # renseigner DATABASE_URL
npx drizzle-kit push             # crée les tables
curl -X POST http://localhost:3000/api/seed   # insère les 85 articles + catégories
npm run dev
```

## 🔐 Administration

- URL : **http://localhost:3000/admin**
- Mot de passe par défaut : `Debymarket2026` → personnalisez-le via la variable
  `ADMIN_PASSWORD` (aucun indice de mot de passe n'apparaît sur la page de connexion)
  (variable d'environnement) **avant toute mise en production**
- Fonctions : liste des commandes, changement de statut (la commande « Livrée »
  est automatiquement marquée payée — argent encaissé par le livreur),
  📥 export Excel des transactions, gestion complète du catalogue
  (ci-dessous) et alertes de stock

### 📦 Gérer les produits (sans toucher au code)

Dans le dashboard, section **« Produits & stock par catégorie »** :

- **➕ Ajouter un produit** : nom, prix (FCFA), catégorie, description, photo
  (redimensionnée automatiquement), stock initial, « à la une », visibilité.
  L'adresse (slug) est générée automatiquement.
- **✏️ Modifier** : toutes les infos d'un produit existant.
- **🗑️ Supprimer** : retrait définitif de la boutique (avec confirmation).
- **− / +** : ajuster le stock (sauvegarde immédiate, rouge si stock ≤ 5).
- Un produit **masqué** (visibilité décochée) disparaît de la boutique mais
  reste listé dans le dashboard (badge MASQUÉ) — pratique pour les ruptures.

> ⚠️ En mode démo (sans base), le catalogue et les commandes sont gardés dans
> un fichier temporaire partagé — utilisez PostgreSQL pour la production
> (obligatoire en hébergement serverless type Netlify).

## 🛒 Parcours client

1. Navigation par catégories / recherche (en-tête + méga-menu)
2. Fiche produit → ajout au panier (persisté en `localStorage`)
3. Checkout : nom, téléphone, commune, adresse — aucun paiement en ligne
4. Les prix sont **recalculés côté serveur** depuis la base (anti-fraude)
5. Confirmation avec référence de commande (ex : `DM-LX3K9A-4F2Q`)
6. Livraison en 24h, règlement en espèces au livreur

## 📁 Structure (voir ARCHITECTURE.md à la racine du workspace)

Frontend et backend **strictement séparés** — `app/` ne contient que des coquilles de routage :

```
src/
├── frontend/           # 100% de l'affichage
│   ├── components/     # cart/, layout/, product/, payment/, admin/, ui/, analytics/
│   ├── layouts/        # RootLayoutContent (header, footer, polices…)
│   ├── providers/      # AppProviders (CartProvider + CartDrawer)
│   ├── styles/         # globals.css
│   └── views/          # Les pages : public/ · checkout/ · admin/
├── backend/            # 100% de la logique (server-only)
│   ├── db/             # client Drizzle + schéma (products, categories, orders, order_items)
│   ├── lib/            # categories, products (+ stock), format, constants, seed-data
│   ├── services/       # orders (création + statuts)
│   └── handlers/       # Logique HTTP des API : checkout, seed, admin/*
└── app/                # 🐚 Coquilles de routage uniquement (ré-exports, 1-4 lignes)
middleware.ts           # Protection de /admin et /api/admin
```

## ⚙️ Variables d'environnement

| Variable | Rôle | Obligatoire |
|---|---|---|
| `DATABASE_URL` | PostgreSQL (sinon : mode démo mémoire) | Non (recommandé en prod) |
| `ADMIN_PASSWORD` | Mot de passe du dashboard `/admin` | ⚠️ Oui en prod |
| `NEXT_PUBLIC_APP_URL` | URL publique du site | Non |

## 📜 Commandes utiles

```bash
npm run dev          # développement
npm run build        # build de production
npm run start        # serveur de production
npm run db:push      # pousser le schéma Drizzle
npm run db:studio    # explorateur visuel de la DB
```
"# debymarket-Officiel1"  
