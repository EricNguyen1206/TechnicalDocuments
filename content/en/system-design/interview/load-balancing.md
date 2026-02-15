---
title: "Load Balancing and API Gateway"
date: 2025-02-15
tags: ["system-design", "load-balancing", "api-gateway"]
description: "Deep dive into load balancing algorithms, API gateway patterns, and distributed traffic management."
author: "Eric Nguyen"
layout: "post"
---

# Load Balancing and API Gateway

## Load Balancing

### What is Load Balancing?

Load balancing distributes incoming network traffic across multiple servers to ensure no single server bears too much demand.

```
Client Request
    ↓
Load Balancer
    ↓
    ├─→ Server 1
    ├─→ Server 2
    └─→ Server 3
```

### Benefits

- **Scalability**: Add/remove servers easily
- **Reliability**: Route traffic away from failed servers
- **Efficiency**: Optimize resource utilization
- **Flexibility**: Support different routing strategies

---

## Load Balancing Algorithms

### 1. Round Robin

```
Request 1 → Server 1
Request 2 → Server 2
Request 3 → Server 3
Request 4 → Server 1
```

**Pros:**

- Simple
- Equal distribution

**Cons:**

- Doesn't consider server capacity
- Sticky sessions needed for stateful apps

**Code:**

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
Server 1: Weight 3 (gets 3/6 of traffic)
Server 2: Weight 2 (gets 2/6 of traffic)
Server 3: Weight 1 (gets 1/6 of traffic)

Sequence: 1, 1, 1, 2, 2, 3, 1, 1, 1, 2, 2, 3...
```

**Use Case:** Servers with different capacities

**Code:**

```python
servers = [
    {'server': 'server1', 'weight': 3},
    {'server': 'server2', 'weight': 2},
    {'server': 'server3', 'weight': 1}
]

def get_server():
    # Weighted selection based on weights
    pass
```

### 3. Least Connections

```
Server 1: 5 connections
Server 2: 2 connections
Server 3: 3 connections

New request → Server 2 (fewest connections)
```

**Pros:**

- Distributes based on current load
- Good for varying request durations

**Cons:**

- Requires tracking active connections

### 4. Least Response Time

```
Server 1: Avg 100ms
Server 2: Avg 50ms
Server 3: Avg 200ms

New request → Server 2 (fastest response)
```

**Pros:**

- Routes to fastest servers
- Better user experience

**Cons:**

- Requires performance monitoring
- Can create feedback loops

### 5. IP Hash / Consistent Hashing

```
Client IP: 192.168.1.100
Hash(192.168.1.100) → Server 2

Same client always goes to same server
```

**Pros:**

- Session persistence
- Minimal rehashing on server changes

**Cons:**

- Can cause uneven distribution
- Server failure = all clients on that server affected

---

## Layer 4 vs Layer 7 Load Balancing

### Layer 4 (Transport Layer)

**Characteristics:**

- Based on IP address and port
- No content inspection
- Fast and lightweight

**Use Cases:**

- TCP/UDP traffic
- High throughput requirements
- Simple routing needs

**Example:**

- AWS Network Load Balancer (NLB)
- HAProxy

### Layer 7 (Application Layer)

**Characteristics:**

- Inspects HTTP content
- Can route based on URL, headers, cookies
- More intelligent but slower

**Use Cases:**

- Content-based routing
- A/B testing
- Canary deployments

**Example:**

- AWS Application Load Balancer (ALB)
- NGINX, Envoy

**Routing Examples:**

```
Path-based routing:
/api/users  → User Service
/api/posts  → Post Service

Header-based routing:
Version: v1 → Service v1
Version: v2 → Service v2
```

---

## Health Checks

### Active Health Checks

```
Load Balancer → Server (Health Check)
              ← Server Response
```

**Health Check Types:**

**TCP Check:**

- Can we connect to the port?
- Simple but minimal

**HTTP Check:**

- Can we GET /health endpoint?
- Returns HTTP 200 and JSON status

**Deep Check:**

- Can we connect to database?
- Can we access external services?

**Example Health Endpoint:**

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

### Why Needed?

Some applications need a user to always connect to the same server.

**Approaches:**

**1. Sticky Sessions (Cookie-based)**

```
Load Balancer adds cookie: server_id=server2
All requests with server_id=server2 go to server2
```

**2. Consistent Hashing**

- Hash user ID or session ID
- Routes to same server

**3. External Session Store**

- Store sessions in Redis/Database
- Any server can handle any request

---

## API Gateway

### What is API Gateway?

API Gateway is a server that acts as an API front-end, receiving API requests, enforcing throttling and security policies, passing requests to the back-end service.

```
Client → API Gateway
            ├─→ Authentication
            ├─→ Rate Limiting
            ├─→ Request/Response Transformation
            └─→ Routing
                ├─→ Service A
                ├─→ Service B
                └─→ Service C
```

### API Gateway Responsibilities

**1. Routing**

- Route requests to appropriate microservices
- Path-based routing: `/api/users` → User Service
- Version-based routing: `/v1/users` → Service v1

**2. Authentication & Authorization**

- Validate JWT tokens
- OAuth/OIDC flows
- API key validation

**3. Rate Limiting**

- Prevent abuse
- Protect backend services
- Implement quotas

**4. Request/Response Transformation**

- Protocol translation (HTTP → gRPC)
- Request/response modification
- Aggregation (combine multiple service responses)

**5. SSL Termination**

- Handle HTTPS at gateway
- Backend communication over HTTP

**6. Caching**

- Cache frequent responses
- Reduce backend load

**7. Logging & Monitoring**

- Centralized logging
- Request tracing
- Metrics collection

---

## Rate Limiting

### Why Rate Limiting?

- **Prevent Abuse**: DDoS attacks, API abuse
- **Fair Usage**: Ensure all users get access
- **Cost Control**: Predict and control infrastructure costs
- **SLA Compliance**: Meet agreed service levels

### Rate Limiting Algorithms

#### 1. Token Bucket

```
Bucket size: 10 tokens
Refill rate: 1 token/second

User 1:
  t=0:  10 tokens (full)
  t=1:  9 tokens (1 used, 1 refilled)
  t=2:  8 tokens
  ...
  t=10: 10 tokens (refilled to full)
```

**Pros:**

- Handles bursts well
- Memory efficient
- Fair distribution

**Cons:**

- Complex to implement

**Implementation:**

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
Time window: 1 minute
Limit: 100 requests

Window 1 (0-60s): 80 requests ✓
Window 2 (60-120s): 100 requests ✓
Window 3 (120-180s): 105 requests ✗ (exceeded)
```

**Pros:**

- Simple to implement
- Easy to understand

**Cons:**

- Burst at window boundaries
- Not smooth

#### 3. Sliding Window Log

```
Keep log of request timestamps
Count requests in last 60 seconds
```

**Pros:**

- Smoother than fixed window
- No boundary spikes

**Cons:**

- Higher memory usage
- More complex

**Implementation:**

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

        # Remove old requests
        while self.requests and (now - self.requests[0]) > self.window_size:
            self.requests.popleft()

        # Check limit
        if len(self.requests) < self.max_requests:
            self.requests.append(now)
            return True
        return False
```

#### 4. Leaky Bucket

```
Bucket with a hole
Requests fill the bucket
Requests leak out at constant rate
If bucket is full, reject request
```

**Pros:**

- Smooths traffic
- Good for network traffic shaping

**Cons:**

- Doesn't handle bursts well

---

## Rate Limiting in Practice

### Implementation Options

**1. API Gateway (Recommended)**

- Kong
- AWS API Gateway
- NGINX
- Apigee

**2. Application-level**

- Redis-based
- In-memory
- Database-based

**3. CDNs**

- Cloudflare
- Akamai
- AWS CloudFront

### Redis-based Rate Limiting

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

## API Gateway Examples

### Kong Gateway Configuration

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

### AWS API Gateway Configuration

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

## Best Practices

### Load Balancing

1. **Use Layer 7 for content-based routing**
2. **Implement health checks**
3. **Use multiple AZs/regions for high availability**
4. **Configure timeouts and retries**
5. **Monitor and adjust algorithms**

### API Gateway

1. **Centralize cross-cutting concerns**
2. **Implement rate limiting per user**
3. **Use JWT for authentication**
4. **Cache frequently accessed data**
5. **Implement circuit breakers**
6. **Log all requests with correlation IDs**

---

## Links

- [System Design Interview Overview](overview.md)
- [Distributed Systems](distributed-systems.md)
- [Networking Fundamentals](networking.md)
