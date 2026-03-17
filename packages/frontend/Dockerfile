# Build context: packages/frontend/
# Dokploy: Dockerfile path = packages/frontend/Dockerfile  |  Context = packages/frontend

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json ./
RUN bun install

# ── Stage 2: Build Next.js ────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# ── Stage 3: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache caddy

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static     ./.next/static
COPY --from=builder /app/public           ./public

COPY Caddyfile /etc/caddy/Caddyfile

# Wait for Next.js then start Caddy in foreground
RUN printf '#!/bin/sh\nset -e\nPORT=3002 HOSTNAME=127.0.0.1 node server.js &\nuntil nc -z 127.0.0.1 3002 2>/dev/null; do sleep 0.2; done\nexec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile\n' \
    > /start.sh && chmod +x /start.sh

EXPOSE 3004

CMD ["/start.sh"]
