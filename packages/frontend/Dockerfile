# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY packages/frontend/package.json ./packages/frontend/

# Install dependencies (including devDependencies for build)
RUN bun install --frozen-lockfile

# Copy source code (all files including configs)
COPY packages/frontend ./packages/frontend

# Build the application
WORKDIR /app/packages/frontend
RUN bun run build

# Production stage
FROM oven/bun:1-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files
COPY package.json bun.lock ./
COPY packages/frontend/package.json ./packages/frontend/

# Install production dependencies only
RUN bun install --frozen-lockfile --production

# Copy built application
COPY --from=builder /app/packages/frontend/public ./packages/frontend/public
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
