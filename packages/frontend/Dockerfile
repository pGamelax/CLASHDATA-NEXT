# Stage 1: Base (Instalação de dependências com cache)
FROM oven/bun:1 AS base
WORKDIR /app

# Copia apenas os arquivos de dependências primeiro (para cache)
# Em monorepo, precisa copiar todos os package.json dos workspaces
COPY package.json bun.lock ./
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/backend/package.json ./packages/backend/

# Instala dependências (cacheado se package.json não mudar)
# Se frozen-lockfile falhar, tenta sem (para lidar com lockfile desatualizado)
RUN bun install --frozen-lockfile || bun install

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

# Copia os node_modules do stage base (já instalados e otimizados)
# Isso evita reinstalar e resolve problemas de lockfile
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/frontend/node_modules ./packages/frontend/node_modules

# Copia os package.json para referência (necessário para alguns módulos)
COPY package.json bun.lock ./
COPY packages/frontend/package.json ./packages/frontend/

# Copia a aplicação buildada do stage builder
COPY --from=builder /app/packages/frontend/.next/standalone ./packages/frontend/
COPY --from=builder /app/packages/frontend/.next/static ./packages/frontend/.next/static
# Copia a pasta public (incluindo imagens do townhall)
COPY --from=builder /app/packages/frontend/public ./packages/frontend/public

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
