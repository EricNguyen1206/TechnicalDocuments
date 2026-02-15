---
title: "Tổng quan về System Design Interview"
date: 2025-02-15
tags: ["system-design", "phỏng vấn", "distributed-system"]
description: "Giới thiệu về system design interview, chúng là gì và cách tiếp cận hiệu quả."
author: "Eric Nguyen"
layout: "post"
---

# Tổng quan về System Design Interview

## System Design Interview là gì?

System Design Interview đánh giá khả năng thiết kế các hệ thống có khả năng mở rộng, chịu lỗi và giải quyết các vấn đề kiến trúc phức tạp. Đây là một phần quan trọng trong quy trình tuyển dụng tại các công ty công nghệ như Google, Facebook, Amazon và các công ty khác.

### Những gì Interviewers Tìm kiếm

- **Khả năng mở rộng (Scalability)**: Hệ thống có thể xử lý tăng trưởng người dùng/dữ liệu?
- **Độ tin cậy (Reliability)**: Hệ thống có sẵn sàng khi gặp lỗi?
- **Hiệu suất (Performance)**: Hệ thống có phản hồi nhanh khi tải cao?
- **Tính bảo trì (Maintainability)**: Hệ thống có thể phát triển khi yêu cầu thay đổi?
- **Hiệu quả chi phí (Cost-effectiveness)**: Thiết kế có hiệu quả chi phí không?

---

## System Design vs Object-Oriented Design

### Object-Oriented Design (Low-Level)

- Tập trung vào thiết kế class, patterns và cấu trúc code
- Phạm vi: Ứng dụng/module đơn
- Ví dụ: Thiết kế bãi đỗ xe, thiết kế class URL shortener

### System Design (High-Level)

- Tập trung vào kiến trúc, scalability và distributed systems
- Phạm vi: Nhiều services, databases, caches
- Ví dụ: Thiết kế Twitter, thiết kế hệ thống URL shortener

---

## Cách tiếp cận 4 Bước cho Câu hỏi System Design

### Bước 1: Làm rõ Yêu cầu

**Yêu cầu Chức năng (Functional Requirements):**

- Hệ thống nên hỗ trợ những tính năng nào?
- Những use case chính là gì?

**Yêu cầu Phi chức năng (Non-Functional Requirements):**

- Scale: Bao nhiêu người dùng? Bao nhiêu dữ liệu?
- Latency: Yêu cầu thời gian phản hồi là gì?
- Availability: Yêu cầu uptime là bao nhiêu?
- Consistency: Model consistency nào cần thiết?

**Ví dụ Câu hỏi:**

- "Hệ thống nên làm gì?"
- "Bao nhiêu người dùng hoạt động hàng ngày?"
- "Tốc độ tăng trưởng dự kiến là bao nhiêu?"
- "Có yêu cầu đặc biệt nào không (real-time, bảo mật)?"

### Bước 2: Đề xuất Thiết kế Cấp cao

- **Thiết kế API**: Định nghĩa các endpoint chính
- **Mô hình Dữ liệu**: Xác định các thực thể và mối quan hệ chính
- **Kiến trúc Cấp cao**: Phác thảo các thành phần chính

**Các Thành phần Cần xem xét:**

- Load Balancer
- API Gateway
- Web Servers
- Databases
- Caches
- Message Queues
- CDNs
- Search Services

### Bước 3: Deep Dive vào Các Thành phần Quan trọng

Tập trung vào 2-3 thành phần quan trọng nhất:

- **Lưu trữ Dữ liệu**: SQL vs NoSQL, sharding, replication
- **Caching**: Chiến lược cache, invalidation
- **Load Balancing**: Thuật toán, health checks
- **Giao tiếp**: Đồng bộ vs Không đồng bộ

### Bước 4: Bottlenecks và Scalability

- **Xác định bottlenecks**: Database queries, network I/O, CPU
- **Đề xuất giải pháp**: Caching, sharding, replication, CDN
- **Trade-offs**: Thảo luận ưu/nhược điểm của từng giải pháp

---

## Các Chủ đề System Design Thường gặp

### 1. Scalability

- **Vertical Scaling**: Scale up (thêm tài nguyên vào máy đơn)
- **Horizontal Scaling**: Scale out (thêm nhiều máy)

### 2. Load Balancing

- Thuật toán: Round Robin, Least Connections, Consistent Hashing
- Loại: Layer 4 (Transport) vs Layer 7 (Application)

### 3. Caching

- Client-side caching
- CDN caching
- Server-side caching
- Database caching

### 4. Thiết kế Database

- SQL vs NoSQL
- Replication (Master-Slave, Master-Master)
- Sharding (Horizontal Partitioning)
- Consistency Models (Strong vs Eventual)

### 5. Message Queues

- Decoupling services
- Asynchronous processing
- Kafka, RabbitMQ, SQS

### 6. Microservices vs Monolith

- Khi sử dụng từng kiến trúc
- Service discovery
- API gateway patterns

---

## Tips để Thành công

### 1. Giao tiếp Liên tục

- Tư duy to thành tiếng
- Đặt câu hỏi làm rõ
- Giải thích lý do của bạn

### 2. Bắt đầu Đơn giản, Rồi Scale

- Đừng over-engineer ngay từ đầu
- Thêm độ phức tạp khi cần thiết

### 3. Vẽ Sơ đồ

- Kiến trúc cấp cao trước
- Rồi đi sâu vào chi tiết

### 4. Ước lượng Lượng

- Yêu cầu lưu trữ
- Nhu cầu băng thông
- Số lượng máy chủ

### 5. Thảo luận Trade-offs

- Không có giải pháp hoàn hảo nào tồn tại
- Giải thích lý do bạn chọn các cách tiếp cận

### 6. Chuẩn bị cho Câu hỏi Theo dõi

- "Nếu cần cập nhật real-time thì sao?"
- "Làm sao để xử lý khi X thất bại?"
- "Nếu traffic tăng 10 lần thì sao?"

---

## Ví dụ Ước lượng

### URL Shortener (TinyURL)

- Tổng URLs: 100 triệu
- Mỗi URL: 500 bytes
- Lưu trữ: 50 GB
- Ghi: 10 triệu/ngày
- Đọc: 100 triệu/ngày
- QPS (queries per second): ~1,200

### Chat System

- Tổng users: 500 triệu
- Daily active users: 100 triệu
- Messages/ngày: 10 tỷ
- Lưu trữ/message: 1 KB
- Lưu trữ/ngày: 10 TB
- Đọc QPS: ~10,000
- Ghi QPS: ~120,000

---

## Ví dụ Luồng Câu hỏi

**Câu hỏi**: Thiết kế một URL shortener như TinyURL

**Bước 1: Làm rõ**

- Chức năng: Rút ngắn URL, redirect, analytics, expiration
- Scale: 100 triệu URLs, 10 triệu/ngày
- Phi chức năng: Latency < 100ms, Availability 99.9%

**Bước 2: Thiết kế Cấp cao**

- API: shorten(), redirect(), delete()
- Database: Bảng URLs với hash, long URL, user, timestamp
- Cache: Redis cho URLs hot
- Load Balancer: Phân phối traffic

**Bước 3: Deep Dive**

- Tạo hash: Mã hóa Base62
- Database sharding: Theo prefix hash
- Caching: LRU cho URLs phổ biến

**Bước 4: Scalability**

- CDN cho static assets
- Async processing cho analytics
- Rate limiting để ngăn chặn lạm dụng

---

## Liên kết

- [Distributed Systems Fundamentals](distributed-systems.md)
- [Load Balancing](../devops/kubernetes-basics.md)
- [SQL vs NoSQL](sql-vs-nosql.md)
