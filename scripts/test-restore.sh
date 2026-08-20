#!/bin/bash
cd /home/user/debymarket
DB=postgresql://postgres:pgtest@127.0.0.1:5432/debymarket_test
OK="\033[32mOK\033[0m"; KO="\033[31mECHEC\033[0m"
waitup() { for i in $(seq 1 60); do curl -sf -o /dev/null "http://127.0.0.1:$1/" && return 0; sleep 1; done; return 1; }

sudo service postgresql start > /dev/null 2>&1; sleep 2

echo "État initial :"
sudo -u postgres psql -d debymarket_test -tA -c "SELECT 'produit '||id||' '||name FROM products; SELECT 'commande '||reference FROM orders;"

DATABASE_URL="$DB" ADMIN_PASSWORD=testpw123 npx next start -p 3127 > /tmp/next-r.log 2>&1 &
PID7=$!
waitup 3127
curl -s -c /tmp/jarR.txt -X POST http://127.0.0.1:3127/api/admin/login -H "content-type: application/json" -d '{"password":"testpw123"}' > /dev/null

echo
echo "1. Sauvegarde (GET /api/admin/backup)"
curl -s -b /tmp/jarR.txt -o /tmp/backup.json http://127.0.0.1:3127/api/admin/backup
grep -q "robe-test-reessai" /tmp/backup.json && grep -q "DM-" /tmp/backup.json && echo -e "  $OK sauvegarde contient produit + commande" || echo -e "  $KO sauvegarde"

echo "2. On vide la base (simule la nouvelle base Render)"
sudo -u postgres psql -d debymarket_test -c "TRUNCATE order_items, orders, products RESTART IDENTITY CASCADE;" | tail -1
sudo -u postgres psql -d debymarket_test -tA -c "SELECT count(*) FROM products"

echo "3. Restauration (POST /api/admin/restore)"
R=$(curl -s -w "|%{http_code}" -b /tmp/jarR.txt -X POST http://127.0.0.1:3127/api/admin/restore -H "content-type: application/json" --data-binary @/tmp/backup.json)
echo "  $R"
echo "$R" | grep -q '"ok":true' && echo -e "  $OK restauration acceptée" || echo -e "  $KO restauration"
echo "$R" | grep -q '"produits":1' && echo "$R" | grep -q '"commandes":1' && echo -e "  $OK stats exactes (1 produit, 1 commande)" || echo -e "  $KO stats"

echo "4. Vérification des ids préservés"
sudo -u postgres psql -d debymarket_test -tA -c "SELECT id||'|'||slug||'|'||stock FROM products; SELECT id||'|'||reference||'|'||total FROM orders;"

echo "5. Séquence réalignée : nouveau produit = id 3 attendu"
R=$(curl -s -X POST http://127.0.0.1:3127/api/admin/products -b /tmp/jarR.txt -H "content-type: application/json" -d '{"name":"Produit Apres Restore","price":5000,"categoryId":11,"stock":1}')
NEWID=$(echo "$R" | python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d['product']['id'])")
[ "$NEWID" = "3" ] && echo -e "  $OK nouveau produit id=$NEWID" || echo -e "  $KO id=$NEWID"

echo "6. Page produit restaurée accessible"
CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3127/products/robe-test-reessai)
[ "$CODE" = "200" ] && echo -e "  $OK page $CODE" || echo -e "  $KO page $CODE"

echo "7. Fichiers invalides rejetés"
C1=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/jarR.txt -X POST http://127.0.0.1:3127/api/admin/restore -H "content-type: application/json" -d 'pas du json')
[ "$C1" = "400" ] && echo -e "  $OK JSON illisible -> 400" || echo -e "  $KO ($C1)"
R2=$(curl -s -w "|%{http_code}" -b /tmp/jarR.txt -X POST http://127.0.0.1:3127/api/admin/restore -H "content-type: application/json" -d '{"application":"autre","produits":[]}')
echo "$R2" | grep -q "|400" && echo "$R2" | grep -q "n'est pas une sauvegarde" && echo -e "  $OK mauvais fichier -> 400 clair" || echo -e "  $KO $R2"

echo "8. /api/health persistant"
H=$(curl -s http://127.0.0.1:3127/api/health)
echo "$H" | grep -q '"persistant":true' && echo -e "  $OK $H" || echo -e "  $KO $H"
kill $PID7 2>/dev/null; sleep 2

echo
echo "9. Mode démo production : sauvegarde et restauration REFUSÉES"
rm -f "${TMPDIR:-/tmp}/debymarket-demo-store.json"
ADMIN_PASSWORD=testpw123 npx next start -p 3128 > /tmp/next-d.log 2>&1 &
PID8=$!
waitup 3128
curl -s -c /tmp/jarD.txt -X POST http://127.0.0.1:3128/api/admin/login -H "content-type: application/json" -d '{"password":"testpw123"}' > /dev/null
B=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/jarD.txt http://127.0.0.1:3128/api/admin/backup)
[ "$B" = "503" ] && echo -e "  $OK backup en démo -> 503 (plus de fausse sauvegarde)" || echo -e "  $KO backup ($B)"
C=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/jarD.txt -X POST http://127.0.0.1:3128/api/admin/restore -H "content-type: application/json" --data-binary @/tmp/backup.json)
[ "$C" = "400" ] || [ "$C" = "503" ] && echo -e "  $OK restore en démo -> $C refusé" || echo -e "  $KO restore ($C)"
kill $PID8 2>/dev/null; sleep 1
rm -f "${TMPDIR:-/tmp}/debymarket-demo-store.json"
echo
echo "===== RÉPÉTITION GÉNÉRALE TERMINÉE ====="
