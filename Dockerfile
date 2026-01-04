# ==============================================================================
# SubTrack Dockerfile - Multi-stage build
# ==============================================================================

# Stage 1: Build Go backend
FROM golang:1.22-alpine AS backend-builder

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache gcc musl-dev

# Copy go mod files first for better caching
COPY server/go.mod server/go.sum ./
RUN go mod download

# Copy source code
COPY server/ ./

# Build the binary
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-s -w" -o subtrack ./cmd/api

# Stage 2: Build React frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /build

# Copy package files first for better caching
COPY front/package*.json ./
RUN npm ci --silent

# Copy source and build
COPY front/ ./
RUN npm run build

# Stage 3: Final runtime image
FROM alpine:3.19

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata

# Copy binary from backend builder
COPY --from=backend-builder /build/subtrack /app/subtrack

# Copy frontend build from frontend builder
COPY --from=frontend-builder /build/dist /app/static

# Create data directory
RUN mkdir -p /app/data

# Environment variables
ENV PORT=8080
ENV DATABASE_PATH=/app/data/subtrack.db
ENV APP_ENV=production

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Run the application
CMD ["/app/subtrack"]
