# Build context: packages/backend/
# Dokploy: Dockerfile path = packages/backend/Dockerfile  |  Context = packages/backend

# ── Stage 1: Build + Prisma generate ─────────────────────────────────────────
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .
RUN bunx prisma generate --schema=./prisma/schema.prisma

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules    ./node_modules
COPY --from=builder /app/src             ./src
COPY --from=builder /app/prisma          ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY package.json ./

EXPOSE 3003

CMD ["sh", "-c", "bunx prisma db push --accept-data-loss && bun run prisma/seed.ts && bun run src/index.ts"]
