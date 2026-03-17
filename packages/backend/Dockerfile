# ─────────────────────────────────────────────────────────────────────────────
# Build context: repo root (.)
# Dokploy config:  Dockerfile path → packages/backend/Dockerfile
#                  Build context   → . (root)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock* ./
COPY packages/backend/package.json  ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

RUN bun install --frozen-lockfile

# ── Stage 2: Generate Prisma client ──────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

COPY packages/backend ./packages/backend

WORKDIR /app/packages/backend
RUN bunx prisma generate --schema=./prisma/schema.prisma

# ── Stage 3: Production ───────────────────────────────────────────────────────
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Bun workspaces hoist all deps to root — copy only root node_modules
COPY --from=deps    /app/node_modules     ./node_modules
COPY --from=builder /app/packages/backend ./packages/backend
COPY package.json ./

WORKDIR /app/packages/backend
EXPOSE 3000

# prisma db push syncs the schema on startup.
# When you add migration files, swap to: bunx prisma migrate deploy
CMD ["sh", "-c", "bunx prisma db push --skip-generate && bun run src/index.ts"]
