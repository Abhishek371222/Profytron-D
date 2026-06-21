#!/usr/bin/env bash
# =============================================================================
# Profytron backup verification (run monthly — see RUNBOOK)
# =============================================================================
# A backup you have never restored is not a backup. This restores the latest
# dump into a throwaway scratch database and runs sanity checks, then drops it.
# Exits non-zero (so a cron/CI alert fires) if anything fails.
#
# Usage:
#   ADMIN_DATABASE_URL=postgres://user:pw@host:5432/postgres \
#   ./scripts/backup-verify.sh
# =============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/profytron}"
: "${ADMIN_DATABASE_URL:?ADMIN_DATABASE_URL (superuser, points at 'postgres' db) is required}"

SCRATCH_DB="profytron_restore_test_$(date -u +%s)"

LATEST="$(ls -1t "${BACKUP_DIR}"/profytron-*.dump 2>/dev/null | head -n1 || true)"
if [[ -z "$LATEST" ]]; then
  echo "[verify] no backups found in $BACKUP_DIR" >&2
  exit 1
fi
echo "[verify] latest backup: $LATEST"

# Derive a target URL by swapping the database name to the scratch DB.
BASE_URL="${ADMIN_DATABASE_URL%/*}"
TARGET_URL="${BASE_URL}/${SCRATCH_DB}"

cleanup() {
  psql "$ADMIN_DATABASE_URL" -c "DROP DATABASE IF EXISTS \"${SCRATCH_DB}\";" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[verify] creating scratch db ${SCRATCH_DB}"
psql "$ADMIN_DATABASE_URL" -c "CREATE DATABASE \"${SCRATCH_DB}\";" >/dev/null

echo "[verify] restoring into scratch db"
pg_restore --no-owner --no-privileges --dbname "$TARGET_URL" "$LATEST" >/dev/null 2>&1 || {
  echo "[verify] RESTORE FAILED" >&2; exit 1; }

# Sanity: a core table should exist and be queryable.
COUNT="$(psql "$TARGET_URL" -tAc "SELECT count(*) FROM \"User\";" 2>/dev/null || echo "ERR")"
if [[ "$COUNT" == "ERR" ]]; then
  echo "[verify] sanity query failed (User table missing/unreadable)" >&2
  exit 1
fi

echo "[verify] OK — restored backup has ${COUNT} users"
