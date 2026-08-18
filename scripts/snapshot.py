#!/usr/bin/env python3
"""Capture les pages du site en HTML autonome (CSS intégré) pour prévisualisation.

Usage : démarrer le serveur (npm run start) puis lancer ce script.
Les fichiers sont écrits dans /home/user/apercu-debymarket/
"""
import os
import re
import http.cookiejar
import urllib.request
from functools import lru_cache

BASE = os.environ.get("DEBY_BASE", "http://localhost:3105")
OUT = "/home/user/apercu-debymarket"
os.makedirs(OUT, exist_ok=True)

jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
opener.addheaders = [("User-Agent", "Mozilla/5.0 (snapshot)")]


def get(url: str) -> str:
    return opener.open(url, timeout=30).read().decode("utf-8", "replace")


def post(url: str, payload: str) -> str:
    req = urllib.request.Request(
        url, data=payload.encode(), headers={"Content-Type": "application/json"}
    )
    return opener.open(req, timeout=30).read().decode("utf-8", "replace")


# 1. Deux commandes de démonstration (remplit le dashboard admin)
post(
    BASE + "/api/checkout",
    '{"customerName":"Awa Koné","phone":"0701020304","city":"Cocody, Abidjan",'
    '"address":"Rue des Jardins, en face de la pharmacie","items":'
    '[{"productId":1,"quantity":2},{"productId":9,"quantity":1}]}',
)
post(
    BASE + "/api/checkout",
    '{"customerName":"Kofi Mensah","phone":"0551234567","city":"Marcory, Abidjan",'
    '"address":"Zone 4, rue du canal","items":[{"productId":15,"quantity":1}]}',
)

# 2. Login admin (cookie de session)
post(BASE + "/api/admin/login", '{"password":"Debymarket2026"}')
# Le cookie posé en production a l'attribut "Secure" : urllib ne le renvoie pas
# en HTTP → on l'envoie explicitement pour la capture.
opener.addheaders.append(("Cookie", "dm_admin=1"))

# Cache CSS borné : taille maximale + éviction LRU automatique.
# (Un dict global sans limite accumulerait la mémoire dans un processus
# longue durée — signalé par les analyseurs de sécurité.)
fetch_css = lru_cache(maxsize=32)(get)


def inline_css(html: str) -> str:
    """Remplace les <link rel=stylesheet> absolus par des <style> intégrés."""

    def repl(match: re.Match) -> str:
        href = match.group(1)
        return "<style>\n" + fetch_css(BASE + href) + "\n</style>"

    html = re.sub(r'<link rel="stylesheet" href="([^"]+)"[^>]*/?>', repl, html)
    # Scripts externes inutiles dans un aperçu statique → retirés
    html = re.sub(r'<script[^>]*src="[^"]*"[^>]*>\s*</script>', "", html)
    # Images produits → chemins relatifs (dossier copié à côté des HTML)
    html = html.replace('src="/images/', 'src="./images/')
    # Liens internes → '#' (navigation désactivée dans l'aperçu)
    html = re.sub(r'href="/(?!_next)', 'href="#', html)
    return html


PAGES = [
    ("01-accueil", "/"),
    ("02-produits", "/products"),
    ("03-fiche-produit", "/products/smartphone-android-128go"),
    ("04-categorie-homme", "/categories/homme"),
    ("05-categorie-femme", "/categories/femme"),
    ("06-checkout", "/checkout"),
    ("07-admin-login", "/admin/login"),
    ("08-admin-dashboard", "/admin"),
    ("09-a-propos", "/a-propos"),
]

for name, path in PAGES:
    html = inline_css(get(BASE + path))
    out_path = os.path.join(OUT, name + ".html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"✔ {out_path} ({len(html) // 1024} Ko)")

# Photos produits à côté des HTML (aperçus autonomes)
import shutil

src_images = "/home/user/debymarket/public/images"
dst_images = os.path.join(OUT, "images")
if os.path.isdir(src_images):
    shutil.copytree(src_images, dst_images, dirs_exist_ok=True)
    print("✔ images copiées →", dst_images)

print("Terminé.")
