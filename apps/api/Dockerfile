# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

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

# Bring over installed deps (pnpm's virtual store lives at the workspace root,
# with relative symlinks under apps/api/node_modules) plus the build output.
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./package.json

EXPOSE 4000

CMD ["node", "dist/src/main"]
