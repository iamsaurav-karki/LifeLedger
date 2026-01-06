# ============================================
# Build Stage
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# ============================================
# Production Stage
# ============================================
FROM node:18-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 7001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:7001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "run", "start:prod"]
