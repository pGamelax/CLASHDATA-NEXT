# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files from root
COPY package.json bun.lock ./

# Copy all workspace package.json files (Bun needs all workspaces defined)
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

# Install dependencies (including devDependencies for build)
# Bun will install all workspaces when installing from root
RUN bun install --frozen-lockfile

# Copy all backend source code
COPY packages/backend ./packages/backend

# Generate Prisma Client
WORKDIR /app/packages/backend
RUN bun run db:generate

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Copy package files from root (must be available in build context)
COPY package.json bun.lock ./

# Copy backend package.json from builder
COPY --from=builder /app/packages/backend/package.json ./packages/backend/

# Install production dependencies only
RUN bun install --frozen-lockfile --production

# Copy source code and generated Prisma Client from builder
COPY --from=builder /app/packages/backend/src ./packages/backend/src
COPY --from=builder /app/packages/backend/src/generated ./packages/backend/src/generated
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma
COPY --from=builder /app/packages/backend/prisma.config.ts ./packages/backend/prisma.config.ts

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD bun run --silent -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Run the application directly with Bun
WORKDIR /app/packages/backend
CMD ["bun", "run", "src/index.ts"]
