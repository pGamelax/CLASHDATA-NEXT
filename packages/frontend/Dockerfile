# 1. Base: Instala dependências
FROM oven/bun:1 AS deps
WORKDIR /app

# Copia arquivos de definição de pacotes do monorepo
COPY package.json bun.lock ./
COPY packages/frontend/package.json ./packages/frontend/

# Instala as dependências com cache agressivo
RUN --mount=type=cache,id=buncache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# 2. Builder: Compila o Next.js
FROM oven/bun:1 AS builder
WORKDIR /app

# Variáveis de Ambiente para o Build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
# Força o Node a ter mais fôlego na RAM durante o build (evita o erro 255/OOM)
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copia dependências e o código fonte
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Entra na pasta do frontend e builda
WORKDIR /app/packages/frontend
RUN bun run build

# 3. Runner: Imagem final leve
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# No modo standalone do Next.js, ele gera uma pasta que já contém o necessário.
# Em monorepos, a estrutura de pastas dentro do standalone precisa ser respeitada.

COPY --from=builder /app/packages/frontend/public ./packages/frontend/public
COPY --from=builder /app/packages/frontend/.next/standalone ./
COPY --from=builder /app/packages/frontend/.next/static ./packages/frontend/.next/static

EXPOSE 3001

# O server.js no standalone fica na raiz do output gerado
CMD ["bun", "server.js"]