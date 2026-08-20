#!/bin/bash
cd /home/user/debymarket
OK="\033[32mOK\033[0m"; KO="\033[31mECHEC\033[0m"
pass() { echo -e "  $OK $1"; }
fail() { echo -e "  $KO $1"; }
waitup() { for i in $(seq 1 60); do curl -sf -o /dev/null "http://127.0.0.1:$1/" && return 0; sleep 1; done; return 1; }

BODY_CHECKOUT='{"customerName":"Client Test","phone":"0703134582","city":"Abidjan","address":"Cocody rue des jardins","items":[{"productId":1,"quantity":1}]}'
BODY_PRODUCT='{"name":"Robe Test Reessai","price":15000,"categoryId":11,"description":"robe de test","stock":4}'

# ================= SCÉNARIO A : production SANS base = mode démo =================
echo "===== A. Production SANS DATABASE_URL (mode démo) ====="
rm -f "${TMPDIR:-/tmp}/debymarket-demo-store.json"
ADMIN_PASSWORD=testpw123 npx next start -p 3123 > /tmp/next-a.log 2>&1 &
PIDA=$!
if waitup 3123; then pass "serveur démarré"; else fail "démarrage" && tail -5 /tmp/next-a.log; fi

echo "-- A1. /api/health doit annoncer mode démo"
H=$(curl -s http://127.0.0.1:3123/api/health); echo "  $H"
echo "$H" | grep -q '"persistant":false' && pass "persistant=false" || fail "health"

echo "-- A2. checkout doit être REFUSÉ (503) avec message WhatsApp"
C=$(curl -s -w "|%{http_code}" -X POST http://127.0.0.1:3123/api/checkout -H "content-type: application/json" -d "$BODY_CHECKOUT")
echo "  $C"
echo "$C" | grep -q "|503" && pass "HTTP 503" || fail "statut"
echo "$C" | grep -q "n'a PAS été enregistrée" && pass "message clair" || fail "message"

echo "-- A3. la commande ne doit PAS exister dans le fichier démo"
F="${TMPDIR:-/tmp}/debymarket-demo-store.json"
if [ -f "$F" ] && grep -q "Client Test" "$F"; then fail "commande enregistrée !"; else pass "rien d'enregistré"; fi

echo "-- A4. création produit admin doit être REFUSÉE (503)"
curl -s -c /tmp/jarA.txt -X POST http://127.0.0.1:3123/api/admin/login -H "content-type: application/json" -d '{"password":"testpw123"}' > /dev/null
R=$(curl -s -w "|%{http_code}" -b /tmp/jarA.txt -X POST http://127.0.0.1:3123/api/admin/products -H "content-type: application/json" -d "$BODY_PRODUCT")
echo "  $R"
echo "$R" | grep -q "|503" && pass "HTTP 503 création refusée" || fail "création"
echo "$R" | grep -q "RIEN n'a été enregistré" && pass "message clair" || fail "message"

echo "-- A5. édition stock doit être REFUSÉE (503)"
R=$(curl -s -w "|%{http_code}" -b /tmp/jarA.txt -X PATCH http://127.0.0.1:3123/api/admin/products/1 -H "content-type: application/json" -d '{"stock":2}')
echo "$R" | grep -q "|503" && pass "HTTP 503 stock" || fail "stock"

echo "-- A6. la boutique publique reste EN LIGNE (catalogue démo lisible)"
CODE=$(curl -s -o /tmp/a6.html -w "%{http_code}" http://127.0.0.1:3123/products/chemise-homme-slim-blanche)
[ "$CODE" = "200" ] && pass "page produit démo $CODE" || fail "page démo $CODE"

kill $PIDA 2>/dev/null; sleep 2
rm -f "${TMPDIR:-/tmp}/debymarket-demo-store.json"

# ================= SCÉNARIO B : DATABASE_URL qui répond pas =================
echo
echo "===== B. DATABASE_URL morte (base éteinte) ====="
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5999/inexistante" ADMIN_PASSWORD=testpw123 npx next start -p 3124 > /tmp/next-b.log 2>&1 &
PIDB=$!
waitup 3124

echo "-- B1. /api/health : persistant=false (après réessais internes)"
H=$(curl -s --max-time 30 http://127.0.0.1:3124/api/health); echo "  $H"
echo "$H" | grep -q '"persistant":false' && pass "health dégrade propre" || fail "health"

echo "-- B2. la boutique reste EN LIGNE (repli démo après ~1 s de réessais)"
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 http://127.0.0.1:3124/products)
[ "$CODE" = "200" ] && pass "catalogue $CODE" || fail "catalogue $CODE"

echo "-- B3. checkout : la commande n'est PAS stockée (erreur explicite)"
R=$(curl -s -w "|%{http_code}" --max-time 30 -X POST http://127.0.0.1:3124/api/checkout -H "content-type: application/json" -d "$BODY_CHECKOUT")
echo "  $R"
echo "$R" | grep -qE "\|(400|503)" && pass "commande refusée proprement" || fail "checkout"
F="${TMPDIR:-/tmp}/debymarket-demo-store.json"
if [ -f "$F" ] && grep -q "Client Test" "$F"; then fail "commande enregistrée en démo !"; else pass "aucune trace fantôme"; fi

kill $PIDB 2>/dev/null; sleep 2
rm -f "${TMPDIR:-/tmp}/debymarket-demo-store.json"

# ================= SCÉNARIO C : vraie PostgreSQL (chemin heureux intact) =================
echo
echo "===== C. Vraie base PostgreSQL ====="
if ! command -v psql > /dev/null 2>&1; then
  echo "  (installation postgresql…)"
  sudo apt-get install -y -qq postgresql > /tmp/pg-install.log 2>&1
fi
sudo service postgresql start > /dev/null 2>&1
sleep 2
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'pgtest';" > /dev/null 2>&1
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname='debymarket_test'" -tA | grep -q 1 || sudo -u postgres createdb debymarket_test

DATABASE_URL="postgresql://postgres:pgtest@127.0.0.1:5432/debymarket_test" ADMIN_PASSWORD=testpw123 npx next start -p 3125 > /tmp/next-c.log 2>&1 &
PIDC=$!
waitup 3125

echo "-- C1. seed ?tables=1 (structure sans démos)"
curl -s -X POST "http://127.0.0.1:3125/api/seed?tables=1" -H "x-seed-secret: testpw123"; echo

echo "-- C2. /api/health : base active"
H=$(curl -s http://127.0.0.1:3125/api/health); echo "  $H"
echo "$H" | grep -q '"persistant":true' && pass "persistant=true" || fail "health"

echo "-- C3. création produit : 201 + persistance réelle"
curl -s -c /tmp/jarC.txt -X POST http://127.0.0.1:3125/api/admin/login -H "content-type: application/json" -d '{"password":"testpw123"}' > /dev/null
R=$(curl -s -w "|%{http_code}" -b /tmp/jarC.txt -X POST http://127.0.0.1:3125/api/admin/products -H "content-type: application/json" -d "$BODY_PRODUCT")
echo "$R" | grep -q "|201" && pass "création 201" || { fail "création : $R"; }
PID_NEW=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin.read().split('|')[0])['product']['id'])" 2>/dev/null)
SLUG_NEW=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin.read().split('|')[0])['product']['slug'])" 2>/dev/null)
echo "  produit id=$PID_NEW slug=$SLUG_NEW"

echo "-- C4. page produit publique 200"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3125/products/$SLUG_NEW")
[ "$CODE" = "200" ] && pass "page $CODE" || fail "page $CODE"

echo "-- C5. checkout RÉEL : 201 + référence"
R=$(curl -s -w "|%{http_code}" -X POST http://127.0.0.1:3125/api/checkout -H "content-type: application/json" -d "{\"customerName\":\"Cliente Reelle\",\"phone\":\"0508648197\",\"city\":\"Abidjan\",\"address\":\"Cocody Angré 8e tranche\",\"items\":[{\"productId\":$PID_NEW,\"quantity\":2}]}")
echo "  $R"
echo "$R" | grep -q "|201" && pass "commande enregistrée" || fail "checkout"

echo "-- C6. stock décrémenté (4 - 2 = 2)"
STOCK=$(sudo -u postgres psql -d debymarket_test -tA -c "SELECT stock FROM products WHERE id=$PID_NEW")
[ "$STOCK" = "2" ] && pass "stock=2" || fail "stock=$STOCK"

echo "-- C7. commande visible dans la base"
sudo -u postgres psql -d debymarket_test -tA -c "SELECT reference, total, status FROM orders" | head -2

kill $PIDC 2>/dev/null; sleep 1
echo
echo "===== FIN DES TESTS ====="
