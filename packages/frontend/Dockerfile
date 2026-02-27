# 1. Base: Install dependencies
FROM oven/bun:1 AS deps
WORKDIR /app

# In a monorepo, it's safer to copy all package.json files 
# so Bun can resolve the workspace tree correctly.
COPY package.json bun.lock ./
COPY packages/frontend/package.json ./packages/frontend/

RUN --mount=type=cache,id=buncache,target=/root/.bun/install/cache \
    bun install 

# 2. Builder: Compile Next.js
FROM oven/bun:1 AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build apenas o frontend (monorepo) garantindo que o binário do Next exista
# Instala o CLI do Next globalmente para evitar problemas de PATH dentro do container
RUN bun add -g next && cd packages/frontend && bun run build

# 3. Runner: Final Image
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Copy necessary files
COPY --from=builder /app/packages/frontend/public ./packages/frontend/public
COPY --from=builder /app/packages/frontend/.next/standalone ./
COPY --from=builder /app/packages/frontend/.next/static ./packages/frontend/.next/static

EXPOSE 3001

CMD ["bun", "server.js"]