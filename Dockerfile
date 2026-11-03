# Multi-stage Dockerfile for CineFlow Agency Management
FROM node:22-alpine AS builder

WORKDIR /app

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
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies for backend
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy built artifacts and Prisma
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/frontend/dist ../frontend/dist
RUN npx prisma generate

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "dist/server.js"]
