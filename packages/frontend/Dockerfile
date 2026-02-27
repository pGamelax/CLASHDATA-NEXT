# 1. Base: Instala dependências
FROM oven/bun:1 AS deps
WORKDIR /app

# Copia arquivos de definição de pacotes do monorepo
COPY package.json bun.lock ./
COPY packages/frontend/package.json ./packages/frontend/

# Instala as dependências na raiz (isso cria a node_modules com os binários)
RUN --mount=type=cache,id=buncache,target=/root/.bun/install/cache \
    bun install

# 2. Builder: Compila o Next.js
FROM oven/bun:1 AS builder
WORKDIR /app

# Variáveis de Ambiente
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copia TUDO (incluindo as node_modules instaladas no estágio anterior)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# --- O PULO DO GATO ---
# Adicionamos os binários da raiz ao PATH para que o comando 'next' funcione em qualquer subpasta
ENV PATH="/app/node_modules/.bin:${PATH}"

WORKDIR /app/packages/frontend

# Agora o 'next build' será encontrado
RUN bun run build

# 3. Runner: Imagem final
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Copia os arquivos necessários do standalone
COPY --from=builder /app/packages/frontend/public ./packages/frontend/public
COPY --from=builder /app/packages/frontend/.next/standalone ./
COPY --from=builder /app/packages/frontend/.next/static ./packages/frontend/.next/static

EXPOSE 3001

CMD ["bun", "server.js"]