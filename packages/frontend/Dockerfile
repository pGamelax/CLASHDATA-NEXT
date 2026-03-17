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
ARG APP_URL
ENV APP_URL=${APP_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# ── Stage 3: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static     ./.next/static
COPY --from=builder /app/public           ./public

EXPOSE 3002

CMD ["sh", "-c", "PORT=3002 node server.js"]
