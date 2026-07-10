#!/bin/sh
set -e

# Apply pending Prisma migrations before serving traffic (fail closed).
# See prisma/migrations/20260524130000_full_schema_sync/README.md for DB-5.
if [ -n "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] Running prisma migrate deploy..."
  if ! node ./node_modules/prisma/build/index.js migrate deploy; then
    echo "[entrypoint] migrate deploy failed — refusing to start"
    exit 1
  fi
fi

exec node dist/src/main
