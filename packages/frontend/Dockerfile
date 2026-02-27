# 1. Base: Instala dependências e faz o cache inteligente
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/frontend/package.json ./packages/frontend/
# Usa cache do mount para não baixar tudo de novo se o lock mudar pouco
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
RUN bun run build

# 3. Runner: Imagem final ultra-leve
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# O Next.js standalone copia os arquivos necessários para cá:
# IMPORTANTE: No standalone, o server.js fica dentro de .next/standalone/packages/frontend/
COPY --from=builder /app/packages/frontend/.next/standalone ./
COPY --from=builder /app/packages/frontend/.next/static ./packages/frontend/.next/static
COPY --from=builder /app/packages/frontend/public ./packages/frontend/public

EXPOSE 3001

# No modo standalone, o ponto de entrada é o server.js gerado
# O caminho pode variar dependendo da sua estrutura de monorepo
WORKDIR /app/packages/frontend
CMD ["bun", "server.js"]