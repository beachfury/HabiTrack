# =============================================================================
# HabiTrack API Dockerfile
# Builds workspace packages, then runs with tsx
# =============================================================================

FROM node:22-alpine

# Install pnpm and tsx globally
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN npm install -g tsx

# Add wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copy all package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/core-config/package.json ./packages/core-config/
COPY packages/http/package.json ./packages/http/
COPY packages/http-contracts/package.json ./packages/http-contracts/
COPY packages/kiosk/package.json ./packages/kiosk/
COPY packages/net/package.json ./packages/net/
COPY packages/perm/package.json ./packages/perm/
COPY packages/session-store/package.json ./packages/session-store/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.json ./
COPY apps/api ./apps/api
COPY packages ./packages

# Build all workspace packages (they need dist/ to exist)
RUN pnpm -r build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:3000/api/health || exit 1

# Start the API using tsx
CMD ["tsx", "apps/api/src/server.ts"]
