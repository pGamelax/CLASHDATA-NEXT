# Stage 1: Base (Instalação de dependências com cache)
FROM oven/bun:1 AS base
WORKDIR /app

# Copia apenas os arquivos de dependências primeiro (para cache)
COPY package.json bun.lock ./
COPY packages/frontend/package.json ./packages/frontend/

# Instala dependências (cacheado se package.json não mudar)
RUN bun install --frozen-lockfile

# Stage 2: Builder (Build da aplicação)
FROM base AS builder
WORKDIR /app

# Copia o código fonte do frontend
COPY packages/frontend ./packages/frontend

# Build da aplicação Next.js
WORKDIR /app/packages/frontend
RUN bun run build

# Stage 3: Production (Runtime otimizado)
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copia apenas os arquivos de dependências necessários
COPY package.json bun.lock ./
COPY packages/frontend/package.json ./packages/frontend/

# Instala apenas dependências de produção (cacheado)
RUN bun install --frozen-lockfile --production

# Copia a aplicação buildada do stage builder
COPY --from=builder /app/packages/frontend/.next/standalone ./packages/frontend/
COPY --from=builder /app/packages/frontend/.next/static ./packages/frontend/.next/static

# Expose port
EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD bun run --silent -e "fetch('http://localhost:3001').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

WORKDIR /app/packages/frontend

# Use Bun to run Next.js standalone server
CMD ["bun", "run", "server.js"]
