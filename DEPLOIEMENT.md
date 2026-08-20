# 🚀 Déploiement de Debymarket (debymarket.netlify.app)

La nouvelle version est en ligne sur https://debymarket.netlify.app ✅
Ce guide sert à : **(a)** mettre à jour le code, **(b)** reconnecter / recréer
la base de données, **(c)** repartir de zéro si besoin.

**Prérequis** : votre compte Netlify + un compte GitHub.
Temps estimé : **15 minutes**.

---

## Étape 1 — Pousser le code sur GitHub

Le projet est déjà initialisé en local. Sur github.com : **New repository** → `debymarket`
(sans README). Puis dans le dossier du projet :

```bash
git remote add origin https://github.com/VOTRE-USER/debymarket.git
git branch -M main
git push -u origin main
```

## Étape 2 — Base de données PostgreSQL gratuite (Neon)

1. Sur **https://neon.tech** → *Sign up* → **New project** → nom : `debymarket`
2. Copiez la **connection string** affichée : `postgresql://...neon.tech/debymarket?sslmode=require`

> 💡 **Rien d'autre à faire en local** — pas d'installation Node, pas de commande :
> la création des tables ET le remplissage des 85 articles se font à l'étape 4,
> directement sur le site en ligne (le seed crée les tables automatiquement).

## Étape 3 — Brancher sur Netlify

**Option A — remplacer le site existant (conserve l'URL debymarket.netlify.app) :**
1. Netlify → votre site **debymarket** → **Site configuration → Build & deploy → Continuous deployment**
2. **Link repository** → GitHub → choisissez `debymarket`
3. Netlify détecte Next.js automatiquement (le `netlify.toml` fourni configure build + Node 20)

**Option B — nouveau site :**
**Add new site → Import an existing project → GitHub → debymarket**

**Variables d'environnement** — *Site configuration → Environment variables* :

| Clé | Valeur |
|---|---|
| `DATABASE_URL` | votre connection string Neon |
| `ADMIN_PASSWORD` | votre mot de passe admin **fort** |
| `NEXT_PUBLIC_APP_URL` | https://debymarket.netlify.app |

Puis **Deploy** (ou *Trigger deploy*).

## Étape 4 — Créer les tables et remplir la boutique (une seule fois)

Une fois la nouvelle version en ligne, ouvrez **PowerShell** sur Windows
(touche Windows → tapez « PowerShell » → Entrée) et lancez :

```powershell
curl.exe -X POST https://debymarket.netlify.app/api/seed -H "x-seed-secret: Debymarket2026"
```

> ⚠️ Bien écrire **curl.exe** (et pas juste `curl`, qui est un alias PowerShell différent).
> Si vous avez défini un `ADMIN_PASSWORD` différent sur Netlify, utilisez-le à la place.

Cette seule commande **crée les 4 tables** puis insère le catalogue.

Réponse attendue : `{"ok":true,"categories":25,"products":85}`

Vérification côté Neon : dans votre projet → **Tables** → vous voyez
`categories`, `products`, `orders`, `order_items` remplies.

## Étape 5 — Vérifier

- ✅ **/products** → 85 articles avec photos
- ✅ Passer une **commande test** → référence DM-… affichée
- ✅ **/admin** → la commande apparaît, changer le statut en « Confirmée »
- ✅ Le panier persiste au rechargement

---

### 💡 Bon à savoir
- **Le site marche aussi sans base de données** (mode démo en mémoire) : même si la DB est en panne, la boutique reste visible — seules les commandes ne sont pas persistées. C'est ce qui évitera la page d'erreur actuelle.
- `npm run db:studio` en local : explorateur visuel de la base Neon.
- Le seed en production exige `x-seed-secret` (votre `ADMIN_PASSWORD`) — personne d'autre ne peut le déclencher.
- 🔄 **Après chaque mise à jour du code touchant à la base** (nouvelles colonnes…),
  relancez simplement la commande seed de l'étape 4 : elle est idempotente —
  elle **ajoute les colonnes manquantes** et complète le catalogue, sans jamais
  effacer ni dupliquer vos données (produits ajoutés au dashboard et commandes
  conservés ✅).
- 🚫 **Vous ne voulez PAS les 85 articles de démonstration ?** Remplacez l'URL du
  seed par `/api/seed?tables=1` : seules les **tables et colonnes** sont créées /
  mises à niveau — aucun article démo n'est inséré, vos produits restent les
  seuls de la boutique.

---

## Alternative Render (fichier `render.yaml` fourni)

1. **render.com** → *Sign up with GitHub* (gratuit, sans carte)
2. Dashboard → **New + → Blueprint** → choisir le dépôt `debymarket`
   (le fichier `render.yaml` pré-remplit build, démarrage, région Francfort)
3. Renseignez les secrets demandés (`DATABASE_URL`, `ADMIN_PASSWORD`) → **Deploy**
4. Puis le seed : `curl.exe -X POST https://VOTRE-NOM.onrender.com/api/seed -H "x-seed-secret: …"`

> ⚠️ Plan gratuit Render : le site **s'endort après 15 min sans visite**
> (30-60 s de réveil à la première visite). Le plan **Starter (7 $/mois)**
> supprime la veille.

## Alternative Vercel — ⚠️ payante pour l'e-commerce

Le déploiement fonctionnerait sans changer une ligne de code (Next.js natif)…
**mais** les conditions Vercel interdisent l'usage commercial sur le plan gratuit
Hobby : une boutique impose le plan **Pro (~20 $/mois/utilisateur)**.
Si vous y allez quand même : mêmes variables d'environnement qu'à l'étape 3,
utilisez de préférence la chaîne Neon **« Pooled connection »** (`-pooler`),
le `netlify.toml` est simplement ignoré.

---

## ⚠️ Dépannage : la boutique affiche les produits « démo »

Si le site montre soudain des produits d'exemple (chemise polo, awale…) au
lieu du vrai catalogue :

1. **Vérifier Neon** (console.neon.tech) : le projet est-il actif ?
   L'offre gratuite s'endort après inactivité et a un quota mensuel
   (~190 h de calcul) — voir l'onglet *Usage*.
2. **Vérifier Render** → *Environment* : `DATABASE_URL` doit être la chaîne
   exacte copiée depuis Neon (commence par `postgresql://`, contient
   `neon.tech`). Une retouche accidentelle de cette variable = mode démo.
3. Redémarrer le service (*Manual Deploy → Restart*).

Le site réessaie désormais automatiquement la connexion (réveil Neon),
refuse toute écriture tant que la base est injoignable (plus de perte de
données), et `/api/health` indique le mode en temps réel (`persistant`).

---

## 🔄 Migration Neon → Render Postgres + passage au pack payant (~7 800 F/mois)

> **Objectif** : base de données chez Render (Basic-256 MB, ~3 600 F/mois, toujours
> réveillée, même datacenter que le site) + site en plan Starter (~4 200 F/mois,
> plus de sieste de 15 min). Migration des produits/commandes SANS ligne de
> commande, grâce aux boutons 💾 Sauvegarde / 📥 Restaurer du dashboard.

### 0. Prérequis — récupérer les vraies données AVANT tout changement
1. S'assurer que `DATABASE_URL` pointe encore vers **Neon** et que le site
   affiche les vrais produits (sinon corriger la variable d'abord).
2. Dashboard `/admin` → **💾 Sauvegarde du site** → garder le fichier
   `debymarket-sauvegarde-AAAA-MM-JJ.json` précieusement.
   *(Si Neon est suspendu pour quota épuisé : soit passer Neon en payant le
   temps de faire la sauvegarde, soit ressaisir les produits plus tard.)*

### 1. Déployer la version avec la fonction Restaurer
Pousser le code ≥ commit « restauration » (Render déploie automatiquement).

### 2. Créer la base chez Render
1. Dashboard Render → **New +** → **PostgreSQL**
2. **Name** : `debymarket-db` — **Region** : **Frankfurt (EU Central)**
   ⚠️ LA MÊME région que le service web (latence minimale, URL interne)
3. **Instance Type** : **Basic-256 MB** (~6 $/mois) → **Create**
4. Attendre *Status: Available* → copier l'**Internal Database URL**
   (commence par `postgresql://`, hôte interne `dpg-…-a`).

### 3. Brancher le site sur la nouvelle base
1. Service web → **Environment** → `DATABASE_URL` = Internal Database URL
2. **Save Changes** (redéploiement automatique)
3. Initialiser la structure (PowerShell) :
   `curl.exe -X POST "https://debymarket.com/api/seed?tables=1" -H "x-seed-secret: MOT_DE_PASSE_ADMIN"`
   → réponse attendue : `{"ok":true,"tablesOnly":true}`

### 4. Restaurer les données
`/admin` → **📥 Restaurer** → choisir le fichier JSON de l'étape 0 →
confirmer (⚠️ remplace tout) → message « Restauration réussie » → la page
se recharge avec les produits et commandes d'avant. ✅

### 5. Passer le site en Starter (plus de sieste)
Service → **Settings** → **Instance Type** → **Starter** (~7 $/mois).

### 6. Vérifications finales
- `https://debymarket.com/api/health` → `"persistant":true`
- Catalogue = vrais produits, commandes présentes dans /admin
- Boutique : chargement instantané (plus d'écran de réveil) ⚡

### 7. Côté Neon
Le projet peut être laissé en pause (gratuit) — il sert de sauvegarde froide
le temps d'être sûr que tout roule chez Render.
