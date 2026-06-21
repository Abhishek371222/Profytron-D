#!/usr/bin/env bash
# =============================================================================
# Profytron PostgreSQL restore
# =============================================================================
# Restores a custom-format dump produced by db-backup.sh.
#
# Usage:
#   TARGET_DATABASE_URL=postgres://... ./scripts/db-restore.sh <dump-file>
#
# SAFETY: restoring is destructive (--clean drops existing objects). The script
# requires CONFIRM=yes to run against a non-empty target.
# =============================================================================
set -euo pipefail

DUMP_FILE="${1:?Usage: db-restore.sh <dump-file>}"
: "${TARGET_DATABASE_URL:?TARGET_DATABASE_URL is required}"

if [[ ! -f "$DUMP_FILE" ]]; then
  echo "Dump file not found: $DUMP_FILE" >&2
  exit 1
fi

if [[ "${CONFIRM:-no}" != "yes" ]]; then
  echo "This will OVERWRITE the target database:" >&2
  echo "  $TARGET_DATABASE_URL" >&2
  echo "Re-run with CONFIRM=yes to proceed." >&2
  exit 2
fi

echo "[restore] restoring $DUMP_FILE → target"
pg_restore \
  --clean --if-exists --no-owner --no-privileges \
  --exit-on-error \
  --dbname "$TARGET_DATABASE_URL" \
  "$DUMP_FILE"

echo "[restore] OK"
