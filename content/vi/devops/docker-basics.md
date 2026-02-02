# Docker Basics

Docker là một platform để containerize applications, cho phép đóng gói ứng dụng và dependencies vào containers.

## Khái niệm

### Container
Container là một đơn vị phần mềm nhẹ, độc lập, chứa mọi thứ cần thiết để chạy ứng dụng.

### Image
Image là một template chỉ đọc được sử dụng để tạo containers.

### Dockerfile
Dockerfile là file chứa các instruction để build một Docker image.

## Các lệnh cơ bản

```dockerfile
docker build -t myapp .      # Build image
docker run -p 8080:80 myapp  # Chạy container
docker ps                    # Liệt kê containers đang chạy
docker stop <container_id>   # Dừng container
```

## Ví dụ Dockerfile

```dockerfile
FROM node:22-slim
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
CMD ["npm", "start"]
```

## Lợi ích

- **Consistency**: Chạy nhất quán trên mọi môi trường
- **Isolation**: Mỗi container độc lập
- **Scalability**: Dễ dàng scale up/down
- **Resource Efficiency**: Chia sẻ OS kernel

> 💡 Tip: Sử dụng multi-stage builds để giảm kích thước image!

## Liên kết

- Xem lại [[git-introduction]]
- Tiếp tục với [[next-steps]]
