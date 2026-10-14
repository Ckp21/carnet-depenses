#!/usr/bin/env bash
# Démarre ou arrête une base PostgreSQL jetable pour les tests SQL (environnement sans service PostgreSQL).
# Usage : tests/serveur/pg-local.sh start | stop
# Exige les binaires PostgreSQL (apt install postgresql) et l'utilisateur système « postgres » (ou un autre non-root).
set -euo pipefail
BIN=$(ls -d /usr/lib/postgresql/*/bin | sort -V | tail -1)
DIR=${PGTEST_DIR:-/var/tmp/pgtest}
PORT=${PGPORT:-55432}
run() { if [ "$(id -u)" = 0 ]; then su postgres -c "$*"; else bash -c "$*"; fi; }
case "${1:-}" in
  start)
    mkdir -p "$DIR"; [ "$(id -u)" = 0 ] && chown postgres:postgres "$DIR"
    [ -f "$DIR/data/PG_VERSION" ] || run "$BIN/initdb -D $DIR/data -A trust >/dev/null"
    run "$BIN/pg_ctl -D $DIR/data -o '-p $PORT -k /tmp' -l $DIR/log.txt -w start >/dev/null" || true
    run "$BIN/psql -h /tmp -p $PORT -d postgres -c 'drop database if exists carnet_test' -c 'create database carnet_test' >/dev/null"
    echo "postgresql://postgres@/carnet_test?host=/tmp&port=$PORT" ;;
  stop)
    run "$BIN/pg_ctl -D $DIR/data -m immediate stop >/dev/null" || true ;;
  *) echo "usage: $0 start|stop"; exit 2 ;;
esac
