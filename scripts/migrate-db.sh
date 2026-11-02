#!/usr/bin/env bash
# Copy the whole PakistanYP database from one PostgreSQL to another and verify row counts.
#
#   SOURCE_DATABASE_URL='postgres://...replit production...' \
#   TARGET_DATABASE_URL='postgres://...neon...?sslmode=require' \
#   bash scripts/migrate-db.sh
#
# The target should be an EMPTY database (a fresh Neon project). Nothing is changed on the source.
set -euo pipefail
: "${SOURCE_DATABASE_URL:?set SOURCE_DATABASE_URL}"
: "${TARGET_DATABASE_URL:?set TARGET_DATABASE_URL}"
DIR="$(cd "$(dirname "$0")/.." && pwd)/.backups/db"; mkdir -p "$DIR"
DUMP="$DIR/migration-$(date -u +%Y%m%d-%H%M%S).sql"

echo "1/4 Dumping source (read-only)..."
pg_dump "$SOURCE_DATABASE_URL" --no-owner --no-acl --no-publications --no-subscriptions > "$DUMP"
echo "    $(du -h "$DUMP" | cut -f1) written to $DUMP"

echo "2/4 Checking target is empty..."
n=$(psql "$TARGET_DATABASE_URL" -tAc "select count(*) from information_schema.tables where table_schema='public'")
if [ "$n" != "0" ]; then echo "    Target already has $n tables - aborting so nothing is overwritten."; exit 1; fi

echo "3/4 Restoring into target..."
psql "$TARGET_DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$DUMP" > /dev/null
gzip -9 "$DUMP"

echo "4/4 Verifying row counts (source vs target)..."
q="select string_agg(table_name || '=' || (xpath('/row/c/text()', query_to_xml('select count(*) as c from public.\"'||table_name||'\"', false, true, '')))[1]::text, ' ' order by table_name) from information_schema.tables where table_schema='public' and table_type='BASE TABLE'"
src=$(psql "$SOURCE_DATABASE_URL" -tAc "$q"); dst=$(psql "$TARGET_DATABASE_URL" -tAc "$q")
if [ "$src" = "$dst" ]; then echo "    OK - all tables match:"; echo "$src" | tr ' ' '\n' | column -c 120; else
  echo "    MISMATCH"; diff <(echo "$src" | tr ' ' '\n') <(echo "$dst" | tr ' ' '\n') || true; exit 1; fi
echo "Done. Point DATABASE_URL at the target to switch."
