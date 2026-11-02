#!/usr/bin/env bash
# Dump the database to .backups/db/<env>-<timestamp>.sql.gz
#   bash scripts/backup-db.sh          -> dev database ($DATABASE_URL)
#   PROD_DATABASE_URL=... bash scripts/backup-db.sh prod
set -euo pipefail
ENV_NAME="${1:-dev}"
if [ "$ENV_NAME" = "prod" ]; then URL="${PROD_DATABASE_URL:?set PROD_DATABASE_URL}"; else URL="${DATABASE_URL:?DATABASE_URL not set}"; fi
DIR="$(cd "$(dirname "$0")/.." && pwd)/.backups/db"
mkdir -p "$DIR"
OUT="$DIR/${ENV_NAME}-$(date -u +%Y%m%d-%H%M%S).sql.gz"
pg_dump "$URL" --no-owner --no-acl | gzip -9 > "$OUT"
echo "Backup written: $OUT ($(du -h "$OUT" | cut -f1))"
# keep the 20 most recent backups per environment
ls -1t "$DIR/${ENV_NAME}-"*.sql.gz 2>/dev/null | tail -n +21 | xargs -r rm --
