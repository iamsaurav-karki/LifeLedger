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

# Ensure public directory exists (Next.js requirement)
RUN mkdir -p ./public

# Build application
RUN npm run build

# ============================================
# Production Stage
# ============================================
FROM node:18-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built application and required files
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js

# Copy public directory (required by Next.js)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 7000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:7000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "start"]
