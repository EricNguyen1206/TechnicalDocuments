# Docker Basics

Docker is a platform for containerizing applications, allowing packaging of applications and their dependencies into containers.

## Concepts

### Container

A container is a lightweight, independent software unit containing everything needed to run an application.

### Image

An image is a read-only template used to create containers.

### Dockerfile

A Dockerfile is a file containing instructions to build a Docker image.

## Basic Commands

```dockerfile
docker build -t myapp .      # Build image
docker run -p 8080:80 myapp  # Run container
docker ps                    # List running containers
docker stop <container_id>   # Stop container
```

## Dockerfile Example

```dockerfile
FROM node:22-slim
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
CMD ["npm", "start"]
```

## Benefits

- **Consistency**: Run consistently across all environments
- **Isolation**: Each container is independent
- **Scalability**: Easy to scale up/down
- **Resource Efficiency**: Shares OS kernel

> 💡 Tip: Use multi-stage builds to reduce image size!

## Links

- Review [[git-introduction]]
- Continue with [[next-steps]]
