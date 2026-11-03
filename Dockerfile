# Multi-stage Dockerfile for CineFlow Agency Management
FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install dependencies for backend & frontend
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/
RUN cd backend && npm ci

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# Copy sources and build
COPY backend ./backend/
RUN cd backend && npx prisma generate && npm run build

COPY frontend ./frontend/
RUN cd frontend && npm run build

# Production Runner stage
FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

RUN apt-get update -y && apt-get install -y openssl ca-certificates curl && rm -rf /var/lib/apt/lists/*

# Install dependencies for backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci

# Copy built artifacts
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/frontend/dist ../frontend/dist

# Generate Prisma client for linux
RUN npx prisma generate

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]
