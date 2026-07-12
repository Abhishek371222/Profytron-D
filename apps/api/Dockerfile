# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# openssl lets Prisma detect the OpenSSL version and fetch the matching
# (OpenSSL 3.x) musl query engine during `prisma generate`.
RUN apk add --no-cache openssl

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Copy every workspace manifest + the lockfile first so that
# `pnpm install --frozen-lockfile` can validate all importers and Docker can
# cache the dependency layer independently of source changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY services/ai/package.json ./services/ai/
COPY services/backtest/package.json ./services/backtest/
COPY packages/types/package.json ./packages/types/

# Install API deps (+ its workspace deps). --ignore-scripts so the api
# postinstall (prisma generate) does not run before the schema is copied.
RUN pnpm install --frozen-lockfile --filter api... --ignore-scripts

# API source (includes prisma/schema.prisma)
COPY apps/api ./apps/api

WORKDIR /app/apps/api
RUN pnpm exec prisma generate
RUN pnpm run build

# ─── Production stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app/apps/api

ENV NODE_ENV=production

# Prisma's query engine links against libssl at runtime; install OpenSSL 3 so
# the linux-musl-openssl-3.0.x engine can load.
RUN apk add --no-cache openssl

# Bring over installed deps (pnpm's virtual store lives at the workspace root,
# with relative symlinks under apps/api/node_modules) plus the build output.
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./package.json
COPY apps/api/docker-entrypoint.sh ./docker-entrypoint.sh

# Run as the unprivileged `node` user (uid 1000, ships with the base image)
# instead of root. Writable dirs (logs + local upload fallback) must be
# node-owned — otherwise boot crashes with EACCES on mkdir.
# sed strips CRLF in case the file was checked out with Windows line endings,
# which breaks the shebang under Alpine's /bin/sh.
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && \
    chmod +x ./docker-entrypoint.sh && \
    mkdir -p /app/apps/api/logs /app/apps/api/uploads/strategy-documents && \
    chown -R node:node /app/apps/api/logs /app/apps/api/uploads
USER node

EXPOSE 4000

# Container-level health probe. Hits the deep /health endpoint and treats any
# non-200 (e.g. 503 when the database is unreachable) as unhealthy so the
# orchestrator can restart or drain the container.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "const p=process.env.PORT||process.env.API_PORT||4000;require('http').get('http://127.0.0.1:'+p+'/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["./docker-entrypoint.sh"]
