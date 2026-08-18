#!/usr/bin/env python3
"""Génère une version STATIQUE du site (vitrine) déployable par glisser-déposer Netlify.

Crawl le serveur local, intègre le CSS, retire les scripts JS (vitrine figée),
copie images + polices, et écrit chaque page en …/index.html (URLs propres).
Les liens /checkout sont remplacés par le lien WhatsApp de commande.

Usage : démarrer le serveur (npm run start) puis lancer ce script.
Sortie : /home/user/site-vitrine/ (+ zip à côté via deploy_zip.sh si voulu)
"""
import os
import re
import shutil
import urllib.parse
import urllib.request
from collections import deque
from functools import lru_cache

BASE = os.environ.get("DEBY_BASE", "http://localhost:3105")
OUT = "/home/user/site-vitrine"
WHATSAPP = (
    "https://wa.me/2250703134582?text="
    "Bonjour%20Debymarket%20!%20Je%20souhaite%20passer%20une%20commande%20%F0%9F%9B%92"
)

shutil.rmtree(OUT, ignore_errors=True)
os.makedirs(OUT, exist_ok=True)

opener = urllib.request.build_opener()
opener.addheaders = [("User-Agent", "Mozilla/5.0 (vitrine)")]


def get(url: str) -> str:
    return opener.open(url, timeout=30).read().decode("utf-8", "replace")


# Cache CSS borné : taille maximale + éviction LRU automatique.
# (Un dict global sans limite accumulerait la mémoire dans un processus
# longue durée — signalé par les analyseurs de sécurité.)
fetch_css = lru_cache(maxsize=32)(get)


def inline_css(html: str) -> str:
    """Intègre le CSS, supprime les JS/chunks inutiles en statique."""

    def repl(match: re.Match) -> str:
        href = match.group(1)
        return "<style>\n" + fetch_css(BASE + href) + "\n</style>"

    html = re.sub(r'<link rel="stylesheet" href="([^"]+)"[^>]*/?>', repl, html)
    # Scripts externes (hydratation React) — inutiles figés : retirés
    html = re.sub(r'<script[^>]*src="[^"]*"[^>]*>\s*</script>', "", html)
    # Préchargements de chunks JS qu'on ne distribue pas → retirés (évite 404)
    html = re.sub(r'<link[^>]*href="/_next/static/chunks/[^"]*"[^>]*/?>', "", html)
    # Commander → WhatsApp (pas de serveur derrière la vitrine)
    html = html.replace('href="/checkout"', f'href="{WHATSAPP}" target="_blank" rel="noopener"')
    return html


seen: set[str] = set()
queue: deque[str] = deque(["/", "/products"])
errors: list[str] = []

while queue:
    path = queue.popleft().rstrip("/") or "/"
    if path in seen:
        continue
    seen.add(path)
    try:
        html = inline_css(get(BASE + path))
    except Exception as exc:  # noqa: BLE001
        errors.append(f"{path}: {exc}")
        continue

    rel = "index.html" if path == "/" else path.strip("/") + "/index.html"
    dst = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with open(dst, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"✔ {rel}")

    # Découvre les liens internes produits / catégories (sans query string)
    for m in re.finditer(r'href="(/(?:products|categories)[^"#?]*)"', html):
        nxt = m.group(1).rstrip("/")
        if nxt and nxt not in seen:
            queue.append(nxt)

if errors:
    print("⚠️ Pages en échec :", errors)

# ---- Ressources statiques -------------------------------------------------
shutil.copytree(
    "/home/user/debymarket/public/images", os.path.join(OUT, "images"), dirs_exist_ok=True
)
print("✔ images/")

static_media = "/home/user/debymarket/.next/static/media"
if os.path.isdir(static_media):  # polices Fraunces/Inter générées par next/font
    shutil.copytree(
        static_media, os.path.join(OUT, "_next/static/media"), dirs_exist_ok=True
    )
    print("✔ _next/static/media/ (polices)")

shutil.copy("/home/user/debymarket/src/app/icon.png", os.path.join(OUT, "icon.png"))
print("✔ icon.png")

print(f"Terminé : {len(seen)} pages → {OUT}")
