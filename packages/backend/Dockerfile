# Stage 1: Base (Instalação de dependências)
FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
# Instalamos tudo aqui uma única vez
RUN bun install --frozen-lockfile

# Stage 2: Builder (Geração de código/Prisma)
FROM base AS builder
WORKDIR /app
COPY packages/backend ./packages/backend
WORKDIR /app/packages/backend
RUN bunx prisma generate --schema=./prisma/schema.prisma

# Stage 3: Production (A imagem que vai rodar)
FROM oven/bun:1-slim
WORKDIR /app

# Em vez de instalar de novo, COPIAMOS os node_modules prontos
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=builder /app/packages/backend/src ./packages/backend/src
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma

# Copie apenas os arquivos essenciais de configuração
COPY package.json ./
COPY packages/backend/package.json ./packages/backend/

ENV NODE_ENV=production
WORKDIR /app/packages/backend
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]