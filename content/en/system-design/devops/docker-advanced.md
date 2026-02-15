---
title: "Docker Advanced Concepts"
date: 2025-02-15
tags: ["docker", "devops", "containers", "advanced"]
description: "Advanced Docker concepts including multi-stage builds, networking, volumes, compose, and best practices."
author: "Eric Nguyen"
layout: "post"
---

# Docker Advanced Concepts

## Multi-Stage Builds

Multi-stage builds help create smaller, more efficient images by using multiple `FROM` statements in a single Dockerfile.

```dockerfile
# Build stage
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json .
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Benefits

- **Smaller image size**: Only production dependencies and built assets
- **Security**: No build tools in final image
- **Faster deployment**: Smaller images transfer faster

---

## Docker Networking

### Network Drivers

```bash
# Bridge (default)
docker network create my-network
docker run --network my-network myapp

# Host (no isolation)
docker run --network host myapp

# None (no network)
docker run --network none myapp
```

### Custom Networks

```bash
# Create a custom bridge network
docker network create --driver bridge app-network

# Connect containers
docker run -d --name web --network app-network nginx
docker run -d --name api --network app-network node-app
```

### DNS Resolution

Containers on the same network can communicate by service name:

```bash
# From web container
curl http://api:3000/health
```

---

## Volumes and Storage

### Volume Types

```bash
# Named volume
docker volume create mydata
docker run -v mydata:/app/data myapp

# Bind mount
docker run -v $(pwd)/data:/app/data myapp

# Anonymous volume
docker run -v /app/data myapp
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect mydata

# Remove volume
docker volume rm mydata

# Remove unused volumes
docker volume prune
```

---

## Docker Compose

Compose is a tool for defining and running multi-container applications.

### docker-compose.yml Example

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
    depends_on:
      - db
    volumes:
      - ./src:/app/src
      - node_modules:/app/node_modules

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=secret
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
  node_modules:
```

### Compose Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Scale services
docker-compose up -d --scale app=3
```

---

## Dockerfile Best Practices

### 1. Use Minimal Base Images

```dockerfile
# Good - Alpine
FROM node:22-alpine

# Better - Distroless
FROM gcr.io/distroless/nodejs22
```

### 2. Layer Caching

```dockerfile
# Good - Copy package files first
COPY package*.json ./
RUN npm ci
COPY . .

# Bad - Copy everything at once
COPY . .
RUN npm ci
```

### 3. Run as Non-Root User

```dockerfile
FROM node:22-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs
```

### 4. Multi-Architecture Builds

```bash
# Build for multiple platforms
docker buildx build --platform linux/amd64,linux/arm64 -t myapp .
```

---

## Health Checks

```dockerfile
FROM node:22-alpine
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1
```

```yaml
# In docker-compose.yml
services:
  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## Security Best Practices

### 1. Scan Images

```bash
# Scan for vulnerabilities
docker scan myapp

# Use Trivy
trivy image myapp
```

### 2. Don't Run as Root

```dockerfile
USER nodejs
```

### 3. Use .dockerignore

```dockerfile
node_modules
npm-debug.log
.git
.env
*.md
```

### 4. Sign Images

```bash
# Sign with Docker Content Trust
export DOCKER_CONTENT_TRUST=1
docker push myapp
```

---

## Optimization Tips

```dockerfile
# Combine RUN commands
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl && \
    rm -rf /var/lib/apt/lists/*

# Use build cache
FROM node:22-alpine AS deps
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Final stage
FROM node:22-alpine
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

---

## Links

- [Docker Basics](docker-basics.md)
- [Kubernetes Basics](kubernetes-basics.md)
- [Docker Documentation](https://docs.docker.com/)
