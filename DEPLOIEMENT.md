# 🚀 Déploiement de Debymarket (remplacer debymarket.netlify.app)

Le site actuel https://debymarket.netlify.app est cassé (erreur serveur sur /products,
boutique vide). Ce guide le remplace proprement par la nouvelle version.

**Prérequis** : votre compte Netlify (celui du site actuel) + un compte GitHub.
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
