# ─────────────────────────────────────────────────────────────────────────────
# Build context: repo root (.)
# Dokploy config:  Dockerfile path → packages/frontend/Dockerfile
#                  Build context   → . (root)
#
# Runtime: Caddy (port 80) → reverse proxy → Next.js standalone (port 3001)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock* ./
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/backend/package.json  ./packages/backend/

RUN bun install --frozen-lockfile

# ── Stage 2: Build Next.js ────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

COPY packages/frontend ./packages/frontend

# NEXT_PUBLIC_API_URL must be provided at build time — it is baked into the
# client bundle. Set it in Dokploy → Build → Build Args.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app/packages/frontend
RUN bun run build

# ── Stage 3: Production — Node.js + Caddy ─────────────────────────────────────
FROM node:20-alpine AS runner

# Install Caddy from the official Alpine package
RUN apk add --no-cache caddy

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# ── Next.js standalone ────────────────────────────────────────────────────────
# The monorepo standalone archive mirrors the repo structure, so server.js
# ends up at packages/frontend/server.js after the COPY below.
COPY --from=builder /app/packages/frontend/.next/standalone     ./
COPY --from=builder /app/packages/frontend/.next/static         ./packages/frontend/.next/static
COPY --from=builder /app/packages/frontend/public               ./packages/frontend/public

# ── Caddy config ──────────────────────────────────────────────────────────────
COPY packages/frontend/Caddyfile /etc/caddy/Caddyfile

# ── Start script ─────────────────────────────────────────────────────────────
# 1. Start Next.js standalone server in the background (port 3001)
# 2. Start Caddy in the foreground (port 80 → proxies to 3001)
RUN printf '#!/bin/sh\nset -e\ncd /app/packages/frontend\nPORT=3001 HOSTNAME=127.0.0.1 node server.js &\nexec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile\n' \
    > /start.sh && chmod +x /start.sh

# Caddy port (Dokploy maps this to your domain)
EXPOSE 80

CMD ["/start.sh"]
