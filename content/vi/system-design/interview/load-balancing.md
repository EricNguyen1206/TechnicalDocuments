---
title: "Load Balancing và API Gateway"
date: 2025-02-15
tags: ["system-design", "load-balancing", "api-gateway"]
description: "Sâu vào các thuật toán load balancing, các pattern API gateway, và quản lý lưu lượng phân tán."
author: "Eric Nguyen"
layout: "post"
---

# Load Balancing và API Gateway

## Load Balancing

### Load Balancing là gì?

Load balancing phân phối lưu lượng mạng đến qua nhiều server để đảm bảo không có server nào chịu quá tải.

```
Yêu cầu Client
    ↓
Load Balancer
    ↓
    ├─→ Server 1
    ├─→ Server 2
    └─→ Server 3
```

### Lợi ích

- **Khả năng mở rộng**: Thêm/bớt server dễ dàng
- **Độ tin cậy**: Route lưu lượng tránh các server thất bại
- **Hiệu quả**: Tối ưu hóa việc sử dụng tài nguyên
- **Linh hoạt**: Hỗ trợ các chiến lược routing khác nhau

---

## Các Thuật toán Load Balancing

### 1. Round Robin

```
Yêu cầu 1 → Server 1
Yêu cầu 2 → Server 2
Yêu cầu 3 → Server 3
Yêu cầu 4 → Server 1
```

**Ưu điểm:**

- Đơn giản
- Phân phối đều

**Nhược điểm:**

- Không xem xét khả năng server
- Cần sticky sessions cho ứng dụng có trạng thái

**Mã:**

```python
servers = ['server1', 'server2', 'server3']
current_index = 0

def get_server():
    global current_index
    server = servers[current_index]
    current_index = (current_index + 1) % len(servers)
    return server
```

### 2. Weighted Round Robin

```
Server 1: Weight 3 (nhận 3/6 lưu lượng)
Server 2: Weight 2 (nhận 2/6 lưu lượng)
Server 3: Weight 1 (nhận 1/6 lưu lượng)

Trình tự: 1, 1, 1, 2, 2, 3, 1, 1, 1, 2, 2, 3...
```

**Trường hợp sử dụng:** Servers với khả năng khác nhau

**Mã:**

```python
servers = [
    {'server': 'server1', 'weight': 3},
    {'server': 'server2', 'weight': 2},
    {'server': 'server3', 'weight': 1}
]

def get_server():
    # Lựa chọn có trọng số dựa trên trọng số
    pass
```

### 3. Least Connections

```
Server 1: 5 kết nối
Server 2: 2 kết nối
Server 3: 3 kết nối

Yêu cầu mới → Server 2 (ít kết nối nhất)
```

**Ưu điểm:**

- Phân phối dựa trên tải hiện tại
- Tốt cho các yêu cầu có thời lượng khác nhau

**Nhược điểm:**

- Cần theo dõi các kết nối hoạt động

### 4. Least Response Time

```
Server 1: TB 100ms
Server 2: TB 50ms
Server 3: TB 200ms

Yêu cầu mới → Server 2 (phản hồi nhanh nhất)
```

**Ưu điểm:**

- Route tới các server nhanh nhất
- Trải nghiệm người dùng tốt hơn

**Nhược điểm:**

- Cần giám sát hiệu suất
- Có thể tạo vòng phản hồi

### 5. IP Hash / Consistent Hashing

```
Client IP: 192.168.1.100
Hash(192.168.1.100) → Server 2

Cùng client luôn đi tới cùng server
```

**Ưu điểm:**

- Giữ phiên
- Tối thiểu hóa việc rehashing khi thay đổi server

**Nhược điểm:**

- Có thể gây phân phối không đều
- Server thất bại = tất cả client trên server đó bị ảnh hưởng

---

## Layer 4 vs Layer 7 Load Balancing

### Layer 4 (Transport Layer)

**Đặc điểm:**

- Dựa trên địa chỉ IP và cổng
- Không kiểm tra nội dung
- Nhanh và nhẹ

**Trường hợp sử dụng:**

- Lưu lượng TCP/UDP
- Yêu cầu thông lượng cao
- Nhu cầu routing đơn giản

**Ví dụ:**

- AWS Network Load Balancer (NLB)
- HAProxy

### Layer 7 (Application Layer)

**Đặc điểm:**

- Kiểm tra nội dung HTTP
- Có thể route dựa trên URL, headers, cookies
- Thông minh hơn nhưng chậm hơn

**Trường hợp sử dụng:**

- Routing dựa trên nội dung
- A/B testing
- Triển khai canary

**Ví dụ:**

- AWS Application Load Balancer (ALB)
- NGINX, Envoy

**Các Ví dụ Routing:**

```
Routing dựa trên path:
/api/users  → User Service
/api/posts  → Post Service

Routing dựa trên header:
Version: v1 → Service v1
Version: v2 → Service v2
```

---

## Health Checks

### Health Checks Chủ động

```
Load Balancer → Server (Health Check)
              ← Server Phản hồi
```

**Các Loại Health Check:**

**TCP Check:**

- Chúng ta có thể kết nối tới port?
- Đơn giản nhưng tối thiểu

**HTTP Check:**

- Chúng ta có thể GET /health endpoint?
- Trả về HTTP 200 và trạng thái JSON

**Deep Check:**

- Chúng ta có thể kết nối tới database?
- Chúng ta có thể truy cập các service bên ngoài?

**Ví dụ Health Endpoint:**

```javascript
app.get("/health", async (req, res) => {
  const checks = {
    server: "up",
    database: await checkDatabase(),
    redis: await checkRedis(),
    externalApi: await checkExternalApi(),
  }

  const allHealthy = Object.values(checks).every((status) => status === "up")

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "healthy" : "unhealthy",
    checks,
  })
})
```

---

## Session Persistence

### Tại sao Cần?

Một số ứng dụng cần người dùng luôn kết nối tới cùng server.

**Các Cách tiếp cận:**

**1. Sticky Sessions (Dựa trên Cookie)**

```
Load Balancer thêm cookie: server_id=server2
Tất cả yêu cầu với server_id=server2 đi tới server2
```

**2. Consistent Hashing**

- Hash user ID hoặc session ID
- Route tới cùng server

**3. Session Store Bên ngoài**

- Lưu sessions trong Redis/Database
- Bất kỳ server nào có thể xử lý bất kỳ yêu cầu nào

---

## API Gateway

### API Gateway là gì?

API Gateway là một server đóng vai trò front-end API, nhận yêu cầu API, thực thi các chính sách throttling và bảo mật, chuyển tiếp yêu cầu tới service back-end.

```
Client → API Gateway
         ├─→ Xác thực
         ├─→ Rate Limiting
         ├─→ Chuyển đổi Yêu cầu/Phản hồi
         └─→ Routing
             ├─→ Service A
             ├─→ Service B
             └─→ Service C
```

### Các Trách nhiệm API Gateway

**1. Routing**

- Route yêu cầu tới microservices thích hợp
- Routing dựa trên path: `/api/users` → User Service
- Routing dựa trên version: `/v1/users` → Service v1

**2. Xác thực & ủy quyền**

- Xác thực token JWT
- Các luồng OAuth/OIDC
- Xác thực API key

**3. Rate Limiting**

- Ngăn chặn lạm dụng
- Bảo vệ các service back-end
- Triển khai quotas

**4. Chuyển đổi Yêu cầu/Phản hồi**

- Chuyển đổi giao thức (HTTP → gRPC)
- Sửa đổi yêu cầu/phản hồi
- Tổng hợp (kết hợp nhiều phản hồi service)

**5. SSL Termination**

- Xử lý HTTPS tại gateway
- Giao tiếp back-end qua HTTP

**6. Caching**

- Cache các phản hồi thường xuyên
- Giảm tải back-end

**7. Logging & Giám sát**

- Logging tập trung
- Theo dõi yêu cầu
- Thu thập metrics

---

## Rate Limiting

### Tại sao Rate Limiting?

- **Ngăn chặn Lạm dụng**: Các tấn công DDoS, lạm dụng API
- **Sử dụng Công bằng**: Đảm bảo tất cả người dùng được truy cập
- **Kiểm soát Chi phí**: Dự đoán và kiểm soát chi phí cơ sở hạ tầng
- **Tuân thủ SLA**: Đáp ứng các mức dịch vụ đã thỏa thuận

### Các Thuật toán Rate Limiting

#### 1. Token Bucket

```
Kích thước bucket: 10 tokens
Tốc độ refill: 1 token/giây

Người dùng 1:
  t=0:  10 tokens (đầy)
  t=1:  9 tokens (1 dùng, 1 refill)
  t=2:  8 tokens
  ...
  t=10: 10 tokens (refill lại đầy)
```

**Ưu điểm:**

- Xử lý burst tốt
- Hiệu quả về bộ nhớ
- Phân phối công bằng

**Nhược điểm:**

- Phức tạp để triển khai

**Triển khai:**

```python
class TokenBucket:
    def __init__(self, capacity, refill_rate):
        self.capacity = capacity
        self.tokens = capacity
        self.refill_rate = refill_rate
        self.last_refill = time.time()

    def allow_request(self):
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now

        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False
```

#### 2. Fixed Window Counter

```
Time window: 1 phút
Giới hạn: 100 yêu cầu

Window 1 (0-60s): 80 yêu cầu ✓
Window 2 (60-120s): 100 yêu cầu ✓
Window 3 (120-180s): 105 yêu cầu ✗ (vượt quá)
```

**Ưu điểm:**

- Đơn giản để triển khai
- Dễ hiểu

**Nhược điểm:**

- Burst tại các ranh giới window
- Không mượt

#### 3. Sliding Window Log

```
Giữ log của timestamp yêu cầu
Đếm các yêu cầu trong 60 giây cuối
```

**Ưu điểm:**

- Mượt hơn fixed window
- Không có spike ranh giới

**Nhược điểm:**

- Sử dụng bộ nhớ cao hơn
- Phức tạp hơn

**Triển khai:**

```python
from collections import deque
import time

class SlidingWindow:
    def __init__(self, window_size, max_requests):
        self.window_size = window_size  # seconds
        self.max_requests = max_requests
        self.requests = deque()

    def allow_request(self):
        now = time.time()

        # Loại bỏ các yêu cầu cũ
        while self.requests and (now - self.requests[0]) > self.window_size:
            self.requests.popleft()

        # Kiểm tra giới hạn
        if len(self.requests) < self.max_requests:
            self.requests.append(now)
            return True
        return False
```

#### 4. Leaky Bucket

```
Bucket với một lỗ
Yêu cầu điền bucket
Yêu cầu rò ra với tốc độ không đổi
Nếu bucket đầy, từ chối yêu cầu
```

**Ưu điểm:**

- Làm mượt lưu lượng
- Tốt cho shaping lưu lượng mạng

**Nhược điểm:**

- Không xử lý burst tốt

---

## Rate Limiting trong Thực tế

### Các Tùy chọn Triển khai

**1. API Gateway (Khuyến nghị)**

- Kong
- AWS API Gateway
- NGINX
- Apigee

**2. Ứng dụng cấp**

- Dựa trên Redis
- Trong bộ nhớ
- Dựa trên Database

**3. CDNs**

- Cloudflare
- Akamai
- AWS CloudFront

### Rate Limiting Dựa trên Redis

```python
import redis
import time

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def check_rate_limit(user_id, limit, window_seconds):
    key = f"ratelimit:{user_id}"
    current = redis_client.incr(key)

    if current == 1:
        redis_client.expire(key, window_seconds)

    if current > limit:
        return False  # Rate limited
    return True  # Allowed

# Usage
if not check_rate_limit("user123", limit=100, window_seconds=60):
    return {"error": "Rate limit exceeded"}, 429
```

---

## Các Ví dụ API Gateway

### Cấu hình Kong Gateway

```yaml
services:
  - name: user-service
    url: http://user-service:8080
    routes:
      - name: user-routes
        paths:
          - /api/users
    plugins:
      - name: rate-limiting
        config:
          minute: 100
          hour: 1000
      - name: jwt
        config:
          secret_key: $JWT_SECRET
```

### Cấu hình AWS API Gateway

```yaml
Resources:
  UserApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: User API

  UsersResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      ParentId: !Ref UserApi
      PathPart: users

  UsersMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      HttpMethod: GET
      ResourceId: !Ref UsersResource
      AuthorizationType: COGNITO_USER_POOLS
```

---

## Các Thực hành Tốt nhất

### Load Balancing

1. **Sử dụng Layer 7 cho routing dựa trên nội dung**
2. **Triển khai health checks**
3. **Sử dụng nhiều AZs/vùng cho tính sẵn sàng cao**
4. **Cấu hình timeouts và retries**
5. **Giám sát và điều chỉnh thuật toán**

### API Gateway

1. **Tập trung các mối quan tâm cross-cutting**
2. **Triển khai rate limiting cho mỗi người dùng**
3. **Sử dụng JWT cho xác thực**
4. **Cache dữ liệu được truy cập thường xuyên**
5. **Triển khai circuit breakers**
6. **Log tất cả yêu cầu với correlation IDs**

---

## Các Liên kết

- [Tổng quan Phỏng vấn Thiết kế Hệ thống](overview.md)
- [Hệ thống Phân tán](distributed-systems.md)
- [Cơ bản về Mạng](networking.md)
