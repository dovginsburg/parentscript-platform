# ParentScript Backend — Production Dockerfile
# Multi-stage build for minimal image size

FROM node:20-alpine AS base

# Install dependencies stage
FROM base AS deps
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install all workspace dependencies
RUN npm ci

# Build stage (if needed for TypeScript compilation)
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8787

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 backend

# Copy only production dependencies and backend code
COPY --from=deps --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=backend:nodejs /app/apps/backend ./apps/backend
COPY --from=builder --chown=backend:nodejs /app/packages/shared ./packages/shared
COPY --from=builder --chown=backend:nodejs /app/package.json ./package.json

USER backend

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8787/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "apps/backend/server.mjs"]
