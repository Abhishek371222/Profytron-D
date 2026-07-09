#!/bin/sh
set -e

# Apply pending Prisma migrations before serving traffic (Render deploy).
if [ -n "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] Running prisma migrate deploy..."
  node ./node_modules/prisma/build/index.js migrate deploy || {
    echo "[entrypoint] migrate deploy failed — starting API anyway (check DIRECT_URL / migration history)"
  }
fi

exec node dist/src/main
