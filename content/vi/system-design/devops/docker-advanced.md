---
title: "Các khái niệm nâng cao về Docker"
date: 2025-02-15
tags: ["docker", "devops", "containers", "nâng cao"]
description: "Các khái niệm nâng cao về Docker bao gồm multi-stage builds, networking, volumes, compose và best practices."
author: "Eric Nguyen"
layout: "post"
---

# Các khái niệm nâng cao về Docker

## Multi-Stage Builds

Multi-stage builds giúp tạo ra image nhỏ hơn, hiệu quả hơn bằng cách sử dụng nhiều câu lệnh `FROM` trong một Dockerfile.

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

### Lợi ích

- **Kích thước image nhỏ hơn**: Chỉ bao gồm dependencies và assets production
- **Bảo mật**: Không có công cụ build trong image cuối cùng
- **Triển khai nhanh hơn**: Image nhỏ hơn truyền tải nhanh hơn

---

## Docker Networking

### Network Drivers

```bash
# Bridge (mặc định)
docker network create my-network
docker run --network my-network myapp

# Host (không cách ly)
docker run --network host myapp

# None (không có mạng)
docker run --network none myapp
```

### Custom Networks

```bash
# Tạo custom bridge network
docker network create --driver bridge app-network

# Kết nối containers
docker run -d --name web --network app-network nginx
docker run -d --name api --network app-network node-app
```

### DNS Resolution

Containers trên cùng network có thể giao tiếp bằng tên service:

```bash
# Từ container web
curl http://api:3000/health
```

---

## Volumes và Storage

### Các loại Volume

```bash
# Named volume
docker volume create mydata
docker run -v mydata:/app/data myapp

# Bind mount
docker run -v $(pwd)/data:/app/data myapp

# Anonymous volume
docker run -v /app/data myapp
```

### Quản lý Volume

```bash
# Liệt kê volumes
docker volume ls

# Xem chi tiết volume
docker volume inspect mydata

# Xóa volume
docker volume rm mydata

# Xóa volumes không sử dụng
docker volume prune
```

---

## Docker Compose

Compose là công cụ định nghĩa và chạy multi-container applications.

### Ví dụ docker-compose.yml

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

### Lệnh Compose

```bash
# Khởi động services
docker-compose up -d

# Xem logs
docker-compose logs -f app

# Dừng services
docker-compose down

# Rebuild và restart
docker-compose up -d --build

# Scale services
docker-compose up -d --scale app=3
```

---

## Dockerfile Best Practices

### 1. Sử dụng Minimal Base Images

```dockerfile
# Tốt - Alpine
FROM node:22-alpine

# Tốt hơn - Distroless
FROM gcr.io/distroless/nodejs22
```

### 2. Layer Caching

```dockerfile
# Tốt - Copy package files trước
COPY package*.json ./
RUN npm ci
COPY . .

# Tệ - Copy tất cả cùng lúc
COPY . .
RUN npm ci
```

### 3. Chạy với Non-Root User

```dockerfile
FROM node:22-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs
```

### 4. Multi-Architecture Builds

```bash
# Build cho nhiều platforms
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
# Trong docker-compose.yml
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

### 1. Quét Images

```bash
# Quét các lỗ hổng
docker scan myapp

# Sử dụng Trivy
trivy image myapp
```

### 2. Không Chạy dưới Root

```dockerfile
USER nodejs
```

### 3. Sử dụng .dockerignore

```dockerfile
node_modules
npm-debug.log
.git
.env
*.md
```

### 4. Ký Images

```bash
# Ký với Docker Content Trust
export DOCKER_CONTENT_TRUST=1
docker push myapp
```

---

## Optimization Tips

```dockerfile
# Kết hợp các lệnh RUN
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl && \
    rm -rf /var/lib/apt/lists/*

# Sử dụng build cache
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

## Liên kết

- [Docker Cơ bản](docker-basics.md)
- [Kubernetes Cơ bản](kubernetes-basics.md)
- [Docker Documentation](https://docs.docker.com/)
