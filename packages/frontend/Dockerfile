# 1. Base: Instala dependências
FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/frontend/package.json ./packages/frontend/

RUN --mount=type=cache,id=buncache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile || bun install

# 2. Builder: Compila o Next.js
FROM oven/bun:1 AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/frontend/node_modules ./packages/frontend/node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app/packages/frontend

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN bun run build

# --- CORREÇÃO AQUI ---
# Garante que a pasta public existe no estágio builder para o COPY não falhar
RUN mkdir -p public
# ---------------------

# 3. Runner: Imagem final
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Copia standalone
COPY --from=builder /app/packages/frontend/.next/standalone ./
COPY --from=builder /app/packages/frontend/.next/static ./packages/frontend/.next/static

# Agora o COPY não vai falhar pois garantimos a existência da pasta acima
COPY --from=builder /app/packages/frontend/public ./packages/frontend/public

EXPOSE 3001

# No standalone do Next.js, o servidor principal fica na raiz do output
CMD ["bun", "server.js"]