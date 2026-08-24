# 📊 Tableau de bord Debymarket — Guide du propriétaire de la boutique

> Document à remettre au client (propriétaire de la boutique).
> Aucune installation nécessaire : tout se passe dans le navigateur.

---

## 🔗 1. Comment se connecter

| | |
|---|---|
| **Adresse** | https://debymarket.netlify.app/admin |
| **Mot de passe** | *(communiqué séparément — voir §Sécurité)* |
| **Durée de session** | 8 heures (reconnexion ensuite, c'est normal) |

1. Ouvrez le lien dans Chrome, Safari ou tout autre navigateur
2. Tapez le mot de passe → **Se connecter**
3. Vous arrivez sur le tableau de bord 📊

> 💡 **Sur téléphone**, ajoutez-le à votre écran d'accueil pour l'ouvrir comme
> une application : Chrome/Safari → menu **⋮** ou **Partager** →
> **« Ajouter à l'écran d'accueil »**. Astuce : tournez le téléphone en
> mode paysage pour voir les tableaux plus largement.

---

## 🧾 2. Gérer les commandes

Chaque commande client apparaît automatiquement avec : référence, nom,
téléphone, adresse, articles et montant à encaisser.

**Faites avancer le statut** au fil du traitement :

```
En attente  →  Confirmée  →  En livraison  →  Livrée ✅
                                              (= paiement encaissé par le livreur)
```

Le client vous appelle ? Recherchez sa référence `DM-…` dans la liste.

---

## 📦 3. Gérer les produits et le stock

| Action | Comment |
|---|---|
| ➕ **Ajouter un produit** | Bouton « Ajouter un produit » : nom, prix FCFA, catégorie, photo (depuis votre téléphone/PC), stock |
| ✏️ **Modifier** | Icône crayon sur la ligne du produit |
| 📄 **Dupliquer** | Icône 📄 sur la ligne du produit : crée une **copie identique** (« Nom (copie) ») que vous modifiez ensuite avec ✏️. Idéal pour les déclinaisons d'un même article (énorme gain de temps !) |
| 🏷️ **Promotion** | Dans le formulaire (➕ ou ✏️), champ vert « Prix AVANT réduction » : saisissez l'ancien prix, **plus élevé** que le prix actuel. Le client voit alors le prix barré + un badge rouge **« −X % »** sur la photo et la fiche produit. **Vide = pas de promo** ; effacez la valeur pour arrêter la promo |
| ➖➕ **Stock** | Boutons −/+ directement dans le tableau |
| 🙈 **Masquer** | Désactivez un produit sans le supprimer (badge MASQUÉ) |
| 🗑️ **Supprimer** | Bouton corbeille (définitif) |

> Les nouveaux produits apparaissent **immédiatement** sur la boutique.
> 💡 Exemple de promo : prix actuel 8 500 F, prix AVANT 12 000 F → le site affiche ~~12 000 F~~ **8 500 F** avec un badge **« −29 % »**.

### 📸 Plusieurs photos par produit (galerie)

Dans la fenêtre d'ajout/modification d'un produit, rubrique **« 📸 Photos supplémentaires »** :

1. Bouton **＋ Ajouter** (vous pouvez sélectionner **plusieurs photos d'un coup**)
2. Jusqu'à **5 photos supplémentaires** (redimensionnées automatiquement)
3. Sur la boutique, le client fait défiler les photos via les **miniatures**
   sous la photo principale
4. Pour retirer une photo : le petit **✕** sur sa miniature

> 💡 Plus un produit est montré sous différents angles, plus le client achète en
> confiance. Prenez : face, dos, détail (couture, logo), porté si possible.

### 🎨 Proposer des couleurs

Rubrique **« 🎨 Couleurs proposées »** de la même fenêtre :

1. Choisissez la teinte dans le **nuancier** (carré de couleur)
2. Tapez son **nom** (ex : *Bleu ciel*) → **« ➕ Ajouter »** (ou touche Entrée)
3. Répétez pour chaque couleur (8 maximum) — **✕** pour retirer

Sur la fiche produit, le client clique sur la couleur voulue avant d'ajouter au
panier. La couleur choisie apparaît :

- dans la **commande** du tableau de bord (pastille violette « 🎨 »)
- dans l'**export Excel** (colonne « Couleur »)

> Pas de couleurs renseignées = le produit se vend normalement, sans choix.

### 📏 Proposer des tailles ou pointures

Rubrique **« 📏 Tailles / Pointures »** de la même fenêtre :

- Bouton **« 👕 Tailles S → XXL »** : ajoute d'un coup S, M, L, XL, XXL
- Bouton **« 👞 Pointures 39 → 45 »** : ajoute 39, 40, 41, 42, 43, 44, 45
- Champ libre pour toute autre valeur (ex : *46*, *XXXL*) — **✕** pour retirer

Sur la fiche produit, le client clique sa taille avant d'ajouter au panier.
Elle apparaît dans la **commande** (pastille bleue « 📏 ») et dans
l'**export Excel** (colonne « Taille / Pointure »).

> Pas de tailles renseignées = le produit se vend normalement, sans choix.
> Couleur + taille peuvent se combiner (ex : chemise *Noir · XL*).

## 🖼️ 3bis. Changer les images de la page d'accueil

Bouton **« 🖼️ Images de l'accueil »** en haut du tableau de bord :

1. Choisissez l'image à remplacer (grande photo d'accueil ou carte d'un univers)
2. **« 📁 Changer la photo »** → prenez/choisissez une photo sur votre téléphone
   ou votre ordinateur — elle est redimensionnée automatiquement
3. C'est en ligne **immédiatement** ✨
4. Envie de revenir en arrière ? **« ↺ Rétablir l'image d'origine »**

---

## 📥 4. Export Excel (comptabilité)

Bouton **« 📥 Télécharger Excel »** → fichier `.xlsx` avec 3 onglets :

1. **Résumé** — chiffre d'affaires encaissé, en attente, articles vendus
2. **Transactions** — une ligne par commande
3. **Articles vendus** — le détail produit par produit

Idéal : un export chaque semaine pour suivre l'activité.

## 💾 4bis. Sauvegarde complète du site

Bouton **« 💾 Sauvegarde du site »** (à côté de l'export Excel) → fichier `.json`
contenant **tout** : produits (photos, couleurs, tailles), commandes, images
d'accueil personnalisées.

> 📅 **Réflexe hebdomadaire** : téléchargez cette sauvegarde chaque semaine et
> conservez-la (clé USB, Google Drive…). En cas de pépin, votre boutique est
> restaurable.

---

## 🔒 5. Sécurité — règles d'or

- 🔑 Le mot de passe se transmet **par un canal séparé** du lien
  (ex : lien par email + mot de passe par appel/WhatsApp)
- 🚪 Utilisez le bouton **« Déconnexion »** si vous êtes sur un appareil partagé
- 🔁 Mot de passe oublié ou à changer ? → voir la dernière section
- 🔐 Personne ne peut accéder au dashboard sans le mot de passe
  (protection anti-intrusion intégrée)

---

## ⚙️ 6. Changer le mot de passe (2 minutes)

1. Netlify → votre site → **Site configuration → Environment variables**
2. Modifiez `ADMIN_PASSWORD` → nouveau mot de passe fort
3. **Deploys → Trigger deploy**
4. Reconnectez-vous avec le nouveau mot de passe

---

*Debymarket — Cocody, Abidjan · Livraison 24h · Paiement à la livraison*

---

## ⛔ Bannière rouge « Base de données injoignable » (important à connaître)

En ouvrant le tableau de bord, une **bannière ROUGE** peut apparaître en haut :

> ⛔ Base de données injoignable — ne saisissez RIEN

**Ce que ça veut dire :** le site a momentanément perdu le contact avec la base
de données (la base gratuite se « réveille » parfois lentement). La boutique
reste ouverte aux visiteurs, mais affiche des produits d'exemple.

**Ce qu'il faut faire :**
1. **N'ajoutez aucun article** tant que la bannière est visible — ils seraient
   perdus (le site REFUSE maintenant de les enregistrer, par sécurité).
2. Attendez 2-3 minutes → cliquez sur **« 🔄 Réessayer »** dans la bannière.
3. Si elle persiste au-delà de 10 minutes → prévenez le développeur.

**Bon réflexe quotidien :** après avoir enregistré un article, rechargez la
liste des produits : s'il y est toujours, c'est bien conservé. ✅

---

## 📥 Restaurer une sauvegarde (retour arrière ou migration)

Le bouton **📥 Restaurer** (à côté de 💾 Sauvegarde) recharge un fichier
`debymarket-sauvegarde-….json` téléchargé précédemment.

⚠️ **Attention : la restauration REMPLACE tout le contenu actuel**
(produits, commandes, réglages) par celui du fichier. C'est la bonne action
pour : réparer une fausse manœuvre, ou déménager la boutique vers une nouvelle
base de données. En cas de doute → demander au développeur AVANT.

Après la restauration, un message récapitule : *« X produits, Y commandes,
Z réglages »* et la page se recharge toute seule.
