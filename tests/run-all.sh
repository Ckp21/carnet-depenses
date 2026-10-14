#!/usr/bin/env bash
# Lance toute la suite de tests : navigateur, Node, fonction d'envoi des rappels, SQL.
# Usage : tests/run-all.sh [rapide]     « rapide » saute le test SQL et celui de la fonction Deno.
# Prérequis : python3 + playwright (chromium), node 20+, et pour la suite complète deno, openssl, postgresql.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$HERE/.."
export TEST_OUT="${TEST_OUT:-/tmp/carnet-tests}"; mkdir -p "$TEST_OUT"
cd "$ROOT"
FAILED=(); N=0
run() { local name="$1"; shift; N=$((N+1)); printf '%-44s' "$name"; local t=$SECONDS
  if out=$("$@" 2>&1); then echo "ok   ($((SECONDS-t)) s)  $(echo "$out" | grep -E 'réussis' | tail -1)"; else echo "ECHEC"; echo "$out" | tail -25 | sed 's/^/    /'; FAILED+=("$name")
    # Sur GitHub Actions, le détail de l'échec devient une annotation lisible sans ouvrir le journal complet
    if [ -n "${GITHUB_ACTIONS:-}" ]; then msg=$(echo "$out" | tail -18 | cut -c1-300 | sed ':a;N;$!ba;s/%/%25/g;s/\r/%0D/g;s/\n/%0A/g'); echo "::error title=Echec : $name::$msg"; fi
  fi; }

for f in tests/browser/test_*.py; do run "navigateur $(basename "$f" .py | sed 's/^test_//')" python3 "$f"; done
for f in tests/node/*.js; do run "node $(basename "$f" .js)" node "$f"; done

if [ "${1:-}" != "rapide" ]; then
  if command -v deno >/dev/null 2>&1 || [ -n "${DENO:-}" ] || [ -x tests/edge/node_modules/.bin/deno ]; then run "fonction d'envoi des rappels (Deno)" node tests/edge/run.mjs
  else echo "fonction d'envoi des rappels (Deno)    IGNORÉ : deno introuvable"; fi
  if [ -n "${DATABASE_URL:-}" ]; then run "base de données (SQL)" tests/serveur/test-sql.sh
  elif ls -d /usr/lib/postgresql/*/bin >/dev/null 2>&1; then
    URL=$(tests/serveur/pg-local.sh start 2>/dev/null) && DATABASE_URL="$URL" run "base de données (SQL)" tests/serveur/test-sql.sh; tests/serveur/pg-local.sh stop 2>/dev/null
  else echo "base de données (SQL)                      IGNORÉ : PostgreSQL introuvable"; fi
fi

echo; if [ ${#FAILED[@]} -eq 0 ]; then echo "Tout est vert ($N lots de tests)."; else echo "${#FAILED[@]} lot(s) en échec : ${FAILED[*]}"; exit 1; fi
