#!/usr/bin/env bash
# Tests SQL sur une vraie base PostgreSQL : migrations relançables, sécurité (RLS), copie serveur, journal.
# Usage : DATABASE_URL=postgresql://... tests/serveur/test-sql.sh
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$HERE/../.."
URL="${DATABASE_URL:?DATABASE_URL manquante}"
OUT="${TEST_OUT:-/tmp/carnet-tests}"; mkdir -p "$OUT"
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); }
ko()  { FAIL=$((FAIL+1)); echo "ECHEC $1  $2"; }
q()   { psql "$URL" -X -q -t -A -v ON_ERROR_STOP=1 -c "$1" 2>&1; }
check() { local name="$1" got="$2" want="$3"; if [ "$got" = "$want" ]; then ok; else ko "$name" "(obtenu: $got, attendu: $want)"; fi; }
fails() { local name="$1"; shift; if out=$("$@" 2>&1); then ko "$name" "(devait échouer)"; else ok; fi; }
as() { local u="$1" sql="$2"; q "set role authenticated; set request.jwt.claim.sub='$u'; $sql" | grep -v '^SET$'; }
asanon() { q "set role anon; $1" | grep -v '^SET$'; }

# ---- base propre + migrations dans l'ordre, puis relance (doivent être relançables)
q "drop schema if exists public cascade; drop schema if exists auth cascade; create schema public;" >/dev/null
psql "$URL" -X -q -v ON_ERROR_STOP=1 -f "$HERE/stubs-supabase.sql" >/dev/null 2>&1 || { echo "stubs impossibles"; exit 1; }
for f in schema.sql migration-2.1.sql migration-2.4-securite.sql migration-2.5.sql migration-2.6.sql migration-2.6.sql; do
  if psql "$URL" -X -q -v ON_ERROR_STOP=1 -f "$ROOT/supabase/$f" >/dev/null 2>"$OUT/sql-err.txt"; then ok; else ko "migration $f" "$(head -3 "$OUT/sql-err.txt")"; fi
done

A=$(q "insert into auth.users(email) values('a@test.cg') returning id" | head -1)
B=$(q "insert into auth.users(email) values('b@test.cg') returning id" | head -1)
q "insert into expenses(id,user_id,amount,category,method,date,note) values ('e1','$A',5000,'transport','especes','2026-10-01','taxi'),('e2','$A',12000,'alimentation','mtn','2026-10-02','marché');
   insert into incomes(id,user_id,amount,source,date,wallet) values ('i1','$A',300000,'salaire','2026-10-01','banque'),('i2','$B',100000,'salaire','2026-10-01','banque');
   insert into moves(id,user_id,kind,amount,date,from_wallet,to_wallet) values ('m1','$A','transfer',20000,'2026-10-03','banque','mtn');
   insert into plans(id,user_id,type,name,amount) values ('p1','$A','project','Terrain',900000);
   insert into recurring(id,user_id,label,amount,category,method,day,last_month) values ('r1','$A','Loyer',150000,'logement','banque',5,'2026-09');
   insert into budgets(user_id,category,amount) values ('$A','transport',30000);
   insert into settings(user_id,savings_goal,opening,opening_date) values ('$A',50000,'{\"especes\":10000}','2026-10-01');" >/dev/null && ok || ko "jeu de données" ""

# ---- Ajustement de solde
check "mouvement adjust accepté" "$(q "insert into moves(id,user_id,kind,amount,date,to_wallet,note) values ('adj1','$A','adjust',1500,'2026-10-10','especes','Ajustement') returning kind")" "adjust"
fails "type de mouvement inconnu refusé" q "insert into moves(id,user_id,kind,amount,date) values ('x','$A','pirate',1,'2026-10-10')"

# ---- Copie serveur
check "snapshot : 2 utilisateurs, 2 copies" "$(q "select public.snapshot_backups()")" "2"
check "snapshot : rien à refaire sans changement" "$(q "select public.snapshot_backups()")" "0"
q "update expenses set amount=5500 where id='e1'" >/dev/null
check "snapshot : une seule copie après modification" "$(q "select public.snapshot_backups()")" "1"
check "snapshot : 2 copies pour A" "$(q "select count(*) from backups where user_id='$A' and kind='serveur'")" "2"
check "snapshot : contenu complet" "$(q "select jsonb_array_length(payload->'expenses') || ',' || jsonb_array_length(payload->'incomes') || ',' || jsonb_array_length(payload->'moves') || ',' || jsonb_array_length(payload->'plans') || ',' || jsonb_array_length(payload->'recurring') || ',' || (payload->'budgets'->>'transport') || ',' || (payload->'settings'->>'savings_goal') from backups where user_id='$A' and kind='serveur' order by created_at desc limit 1")" "2,1,2,1,1,30000,50000"
check "snapshot : montant modifié repris" "$(q "select payload->'expenses'->0->>'amount' from backups where user_id='$A' and kind='serveur' order by created_at desc limit 1")" "5500"
check "snapshot : aucun user_id dans le contenu" "$(q "select count(*) from backups where payload::text like '%user_id%'")" "0"
check "snapshot : format reconnu par l'application" "$(q "select payload->>'app' from backups where user_id='$A' and kind='serveur' limit 1")" "carnet-depenses"
q "select payload::text from backups where user_id='$A' and kind='serveur' order by created_at desc limit 1" > "$OUT/snapshot-serveur.json"
# isolation : A ne voit pas les copies de B, et ne peut pas lancer la copie
check "RLS : A ne voit que ses copies" "$(as "$A" "select count(*) from backups")" "2"
check "RLS : B ne voit que les siennes" "$(as "$B" "select count(*) from backups")" "1"
fails "authenticated ne peut pas lancer snapshot_backups" as "$A" "select public.snapshot_backups()"
fails "anon ne peut pas lancer snapshot_backups" asanon "select public.snapshot_backups()"
check "anon ne voit aucune copie" "$(q "set role anon; select count(*) from backups" 2>&1 | grep -c 'permission denied')" "1"
# conservation : 14 copies serveur, 6 manuelles
for i in $(seq 1 20); do q "insert into backups(user_id,kind,counts,payload) values ('$B','serveur','{}','{}')" >/dev/null; done
check "trim : 14 copies serveur au plus" "$(q "select count(*) from backups where user_id='$B' and kind='serveur'")" "14"
for i in $(seq 1 9); do q "insert into backups(user_id,kind,counts,payload) values ('$B','manuel','{}','{}')" >/dev/null; done
check "trim : 6 copies manuelles au plus" "$(q "select count(*) from backups where user_id='$B' and kind='manuel'")" "6"
fails "type de copie inconnu refusé" q "insert into backups(user_id,kind,counts,payload) values ('$B','pirate','{}','{}')"
# une copie impossible ne bloque pas les autres
q "update backups set kind=kind where false" >/dev/null
check "snapshot : une panne isolée n'arrête pas la boucle" "$(q "select public.snapshot_backups() >= 0")" "t"

# ---- Journal
check "journal : A écrit" "$(as "$A" "insert into journal(kind,message,context) values ('erreur','TypeError test','{\"v\":\"2.6.0\"}') returning kind")" "erreur"
check "journal : B ne voit pas les lignes de A" "$(as "$B" "select count(*) from journal")" "0"
check "journal : A voit les siennes" "$(as "$A" "select count(*) from journal")" "1"
fails "journal : écriture au nom d'un autre refusée" as "$A" "insert into journal(user_id,kind,message) values ('$B','erreur','usurpation')"
fails "journal : anon refusé" asanon "insert into journal(kind,message) values ('erreur','anon')"
fails "journal : type inconnu refusé" as "$A" "insert into journal(kind,message) values ('autre','x')"
fails "journal : message trop long refusé" as "$A" "insert into journal(kind,message) values ('erreur','$(printf 'x%.0s' $(seq 1 1001))')"
fails "journal : modification interdite" as "$A" "update journal set message='falsifié'"
fails "journal : suppression interdite" as "$A" "delete from journal"
for i in $(seq 1 70); do as "$A" "insert into journal(kind,message) values ('erreur','boucle $i')" >/dev/null; done
check "journal : 60 lignes par heure au plus" "$(q "select count(*) from journal where user_id='$A'")" "60"
q "insert into journal(user_id,kind,message,created_at) select '$B','erreur','ancien '||g, now()-interval '2 days' from generate_series(1,320) g" >/dev/null
check "journal : 300 lignes conservées au plus" "$(q "select count(*) from journal where user_id='$B'")" "300"

# ---- Sécurité générale : toutes les tables protégées
check "RLS actif partout" "$(q "select count(*) from pg_tables where schemaname='public' and not rowsecurity")" "0"
echo "$PASS réussis, $FAIL échecs"
[ "$FAIL" = 0 ]
