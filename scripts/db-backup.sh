#!/usr/bin/env bash
# =============================================================================
# Profytron PostgreSQL backup
# =============================================================================
# Creates a compressed custom-format dump suitable for `pg_restore`, names it
# by tier (hourly/daily/weekly) + timestamp, and prunes old backups.
#
# Usage:
#   DATABASE_URL=postgres://... ./scripts/db-backup.sh [hourly|daily|weekly]
#
# Schedule via cron (see docs/RUNBOOK.md):
#   0 * * * *   /app/scripts/db-backup.sh hourly      # every hour
#   30 2 * * *  /app/scripts/db-backup.sh daily       # daily 02:30
#   0 3 * * 0   /app/scripts/db-backup.sh weekly       # Sundays 03:00
#
# Retention: hourly=24, daily=14, weekly=8 (override with *_KEEP env vars).
# Optionally set BACKUP_S3_BUCKET to also upload (requires awscli).
# =============================================================================
set -euo pipefail

TIER="${1:-daily}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/profytron}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

: "${DATABASE_URL:?DATABASE_URL is required}"

case "$TIER" in
  hourly) KEEP="${HOURLY_KEEP:-24}" ;;
  daily)  KEEP="${DAILY_KEEP:-14}" ;;
  weekly) KEEP="${WEEKLY_KEEP:-8}" ;;
  *) echo "Unknown tier '$TIER' (use hourly|daily|weekly)" >&2; exit 1 ;;
esac

mkdir -p "$BACKUP_DIR"
OUTFILE="${BACKUP_DIR}/profytron-${TIER}-${TIMESTAMP}.dump"

echo "[backup] $TIER → $OUTFILE"
# -Fc = custom compressed format; --no-owner/--no-privileges for portable restores.
pg_dump "$DATABASE_URL" -Fc --no-owner --no-privileges -f "$OUTFILE"

SIZE="$(du -h "$OUTFILE" | cut -f1)"
echo "[backup] done ($SIZE)"

# Prune old backups of this tier, keeping the newest $KEEP.
echo "[backup] pruning ${TIER} backups, keeping ${KEEP}"
ls -1t "${BACKUP_DIR}"/profytron-"${TIER}"-*.dump 2>/dev/null \
  | tail -n +"$((KEEP + 1))" \
  | xargs -r rm -f

# Optional offsite copy.
if [[ -n "${BACKUP_S3_BUCKET:-}" ]]; then
  echo "[backup] uploading to s3://${BACKUP_S3_BUCKET}/"
  aws s3 cp "$OUTFILE" "s3://${BACKUP_S3_BUCKET}/${TIER}/"
fi

echo "[backup] OK"
