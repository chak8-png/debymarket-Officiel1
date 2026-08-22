# 🛡️ Audit sécurité Debymarket — les 20 points de la checklist

> État des lieux mesure par mesure (mise à jour : août 2026).
> Légende : **✅ en place** · **🛠️ renforcé aujourd'hui** · **➖ non applicable au site actuel** (explications incluses — utile si le site évolue).

| # | Mesure | État | Détail chez Debymarket |
|---|--------|------|------------------------|
| 1 | **Clés API dans .env** | ✅ | `DATABASE_URL`, `ADMIN_PASSWORD` lus via `process.env` uniquement ; modèle fourni dans `.env.example` ; sur Render/Netlify : variables d'environnement du tableau de bord (jamais dans Git) |
| 2 | **.env dans .gitignore** | ✅ | `.gitignore` couvre `.env*` (seul `.env.example`, sans secret, est versionné) — vérifié : aucun secret dans l'historique Git |
| 3 | **Rate limiting sur le login** | ✅ | `handlers/admin/login.ts` : 5 échecs → blocage 15 min par IP ; le seed est aussi limité (5/min) |
| 4 | **RLS activée** | ➖ | La RLS PostgreSQL protège les accès **directs** navigateur→base (architecture Supabase). Ici, **seul le serveur** parle à la base (aucune clé DB côté client) → la RLS n'a pas d'objet. Si tu passes un jour à Supabase/PostgREST, on l'activera |
| 5 | **Mots de passe hashés** | ✅ | Comparaison par empreintes **SHA-256** en temps constant (`timingSafeEqual`) — le mot de passe n'est jamais stocké en clair ni en base |
| 6 | **Droits vérifiés côté serveur** | ✅ | Session HMAC vérifiée par `middleware.ts` sur `/admin` + `/api/admin/*` ; **prix toujours recalculés depuis la base** au checkout (jamais ceux du navigateur) ; tailles/couleurs validées contre la liste du produit |
| 7 | **Clé publique côté client** | ✅ | Seules les variables `NEXT_PUBLIC_*` touchent le navigateur (URL du site, ID Hotjar) — aucune clé secrète |
| 8 | **HTTPS partout** | ✅ | HTTPS forcé par l'hébergeur + en-tête `Strict-Transport-Security` (2 ans, preload) dans `next.config.mjs` |
| 9 | **Sessions qui expirent** | ✅ | Session admin de **8 h** (expiration signée dans le jeton) + bouton Déconnexion |
| 10 | **Inputs validés** | ✅ | Tous les handlers valident : nom/prix/catégorie/téléphone (format CI `01/05/07…`), adresses, tailles/couleurs (listes fermées), emoji… |
| 11 | **Taille max des uploads** | ✅ | Corps JSON plafonnés (`http-guards` → 413) : login 4 Ko, produits ~3,8 Mo, réglages ~1,4 Mo ; chaque image plafonnée (compression navigateur + limite serveur) |
| 12 | **Type de fichier vérifié** | ✅ 🛠️ | Uniquement `/images/…`, `https://…`, `data:image/…` ; **SVG refusé partout** (galerie + réglages + *nouveau : photo principale*) ; tout upload navigateur est re-encodé en JPEG |
| 13 | **CORS configuré** | ✅ | Mutations API : rejet si `Origin` ≠ `Host` (anti-CSRF) dans `middleware.ts` ; pas de partage cross-origin permissif |
| 14 | **Erreurs détaillées coupées** | ✅ | Messages clients génériques (« Erreur serveur, veuillez réessayer ») ; le détail technique reste dans les logs serveur |
| 15 | **console.log clean** | ✅ | 0 `console.log` côté client (vérifié) ; seuls des `console.error` côté serveur (logs Render/Netlify) |
| 16 | **Message d'erreur unique** | ✅ | Login : « Mot de passe incorrect. » — toujours identique (aucun indice d'énumération) |
| 17 | **Webhooks signés** | ➖ | Aucun webhook aujourd'hui (paiement à la livraison, WhatsApp = simple lien). Quand tu ajouteras un paiement (Wave, Orange Money…), on vérifiera la **signature HMAC** de chaque webhook — c'est prévu dans la feuille de route |
| 18 | **Dépendances à jour** | ✅ 🛠️ | `npm audit --omit=dev` = **0 vulnérabilité** ; **Dependabot** activé (`.github/dependabot.yml`) : Pull Requests de mise à jour chaque semaine |
| 19 | **Email confirmé** | ➖ | Pas de comptes clients / pas d'emails (commande par téléphone + livraison). Si tu ajoutes des comptes clients un jour, on mettra la confirmation d'email |
| 20 | **Backup auto** | ✅ 🛠️ | **Bouton « 💾 Sauvegarde du site »** dans le Dashboard → tout le site en JSON (produits, commandes, réglages). + Le code est sauvegardé sur GitHub à chaque version, et Neon conserve un historique de la base (restauration). Conseil : 1 téléchargement par semaine |

## Bonus déjà en place (au-delà de la liste)

- 🍯 **Pot de miel anti-robots** au checkout (fausses commandes de bots non enregistrées)
- 📊 **Export Excel neutralisé** contre l'injection de formules (`=HYPERLINK(…)` etc.)
- 🔒 En-têtes : CSP stricte, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, pas de `X-Powered-By`
- 🚫 `/admin` et `/api` exclus des moteurs (`noindex` + `robots.txt`)
- 🔐 Cookies de session `HttpOnly` + `Secure` + `SameSite`
- 🧾 Journal minimal côté serveur (pas de données personnelles dans les logs)

## En cas d'évolution du site (feuille de route)

| Projet futur | Mesure à ajouter à ce moment-là |
|---|---|
| Paiement en ligne (Wave/OM/Stripe) | Webhooks **signés** (17) + jamais de carte stockée |
| Comptes clients | Confirmation d'email (19), mots de passe hashés Argon2/bcrypt (5), RLS si lecture directe base (4) |
| Montée en trafic | Rate limiting distribué (Upstash), plan payant hébergeur |
