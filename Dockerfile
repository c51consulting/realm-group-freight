# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:18-alpine AS deps

WORKDIR /app

# Install dependencies separately for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ─── Stage 2: Production Image ────────────────────────────────────────────────
FROM node:18-alpine AS runner

# Install dumb-init for proper signal handling and graceful shutdown
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 realm

WORKDIR /app

# Copy production dependencies from deps stage
COPY --from=deps --chown=realm:nodejs /app/node_modules ./node_modules

# Copy application source
COPY --chown=realm:nodejs . .

# Create upload directories with correct ownership
RUN mkdir -p uploads/weighbridge uploads/feedtests \
 && chown -R realm:nodejs uploads

# Switch to non-root user
USER realm

# Expose application port
EXPOSE 3000

# Health check — Railway uses this to verify the service is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Use dumb-init to handle PID 1 responsibilities and forward signals
# This enables graceful shutdown (SIGTERM → Express closes connections)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
