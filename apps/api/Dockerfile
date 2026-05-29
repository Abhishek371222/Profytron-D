FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY apps/api/package.json ./apps/api/package.json

# Install only API dependencies
RUN pnpm install --filter api --frozen-lockfile 2>/dev/null || \
    cd apps/api && npm install

COPY apps/api ./apps/api
COPY packages ./packages 2>/dev/null || true

WORKDIR /app/apps/api

# Generate Prisma client
RUN npx prisma generate

# Build NestJS
RUN npm run build

# ─── Production stage ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install only production deps
COPY --from=builder /app/apps/api/package.json ./package.json
RUN npm install --omit=dev --ignore-scripts

# Copy built output + Prisma
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/api/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/apps/api/prisma ./prisma

EXPOSE 4000

CMD ["node", "dist/main"]
