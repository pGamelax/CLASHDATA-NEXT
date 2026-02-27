# 1. Base: Instala dependências
FROM oven/bun:1 AS deps
WORKDIR /app

# Copia arquivos de configuração do monorepo
COPY package.json bun.lock ./
COPY packages/frontend/package.json ./packages/frontend/

# Instala as dependências (sem travar se o lock mudar levemente)
RUN --mount=type=cache,id=buncache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile || bun install

# 2. Builder: Compila o Next.js
FROM oven/bun:1 AS builder
WORKDIR /app

# Copia dependências do estágio anterior
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/frontend/node_modules ./packages/frontend/node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app/packages/frontend

# Argumentos de Build para o Next.js injetar no client-side
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN bun run build

# 3. Runner: Imagem final ultra-leve
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Copia o output standalone (já inclui node_modules necessários)
COPY --from=builder /app/packages/frontend/.next/standalone ./
COPY --from=builder /app/packages/frontend/.next/static ./packages/frontend/.next/static

# TRUQUE: Garante que a pasta public existe no builder antes de copiar
# Isso evita o erro "public: not found" se a pasta estiver vazia/faltando
RUN mkdir -p /app/packages/frontend/public
COPY --from=builder /app/packages/frontend/public ./packages/frontend/public

EXPOSE 3001

# O ponto de entrada no modo standalone fica em:
# ./packages/frontend/