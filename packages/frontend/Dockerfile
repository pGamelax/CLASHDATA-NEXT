# Build context: packages/frontend/
# Dokploy: Dockerfile path = packages/frontend/Dockerfile  |  Context = packages/frontend
#
# Runtime: Caddy (port 80) → reverse proxy → Next.js standalone (port 3001)

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json ./
RUN bun install

# ── Stage 2: Build Next.js ────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

COPY . .

# NEXT_PUBLIC_API_URL must be provided at build time — it is baked into the
# client bundle. Set it in Dokploy → Build → Build Args.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# ── Stage 3: Production — Node.js + Caddy ─────────────────────────────────────
FROM node:20-alpine AS runner

# Install Caddy from the official Alpine package
RUN apk add --no-cache caddy

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# ── Next.js standalone ────────────────────────────────────────────────────────
# When built from package directory (not monorepo root), server.js is at
# .next/standalone/ root — copy it directly to /app.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static     ./.next/static
COPY --from=builder /app/public           ./public

# ── Caddy config ──────────────────────────────────────────────────────────────
COPY Caddyfile /etc/caddy/Caddyfile

# ── Start script ─────────────────────────────────────────────────────────────
# 1. Start Next.js standalone server in the background (port 3001)
# 2. Start Caddy in the foreground (port 80 → proxies to 3001)
RUN printf '#!/bin/sh\nset -e\ncd /app\nPORT=3001 HOSTNAME=127.0.0.1 node server.js &\nexec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile\n' \
    > /start.sh && chmod +x /start.sh

# Caddy port (Dokploy maps this to your domain)
EXPOSE 80

CMD ["/start.sh"]
