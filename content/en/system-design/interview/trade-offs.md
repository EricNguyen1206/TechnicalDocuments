---
title: "Trade-offs in System Design"
date: 2025-02-15
tags: ["system-design", "trade-offs", "consistency", "performance"]
description: "Comprehensive guide to trade-offs in system design including consistency, performance, and architectural decisions."
author: "Eric Nguyen"
layout: "post"
---

# Trade-offs in System Design

## Why Trade-offs Matter

In system design, there's no perfect solution. Every decision involves trade-offs between competing requirements. Understanding these trade-offs is crucial for designing effective systems.

---

## 1. Strong vs Eventual Consistency

### Strong Consistency

**Definition:** All reads return the most recent write or an error.

**Characteristics:**

- Readers always see latest data
- Higher latency (requires coordination)
- Lower availability (writes may be blocked)

**Use Cases:**

- Banking systems (cannot show wrong balance)
- Inventory management (cannot oversell)
- Payment processing

**Implementation:**

- Two-Phase Commit (2PC)
- Raft consensus algorithm
- Master-Slave with synchronous replication

**Example:**

```sql
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;  -- Either both succeed or both fail
```

### Eventual Consistency

**Definition:** System guarantees that if no new updates are made, eventually all accesses will return the last updated value.

**Characteristics:**

- Readers may see stale data
- Lower latency (no coordination required)
- Higher availability

**Use Cases:**

- Social media feeds (seeing slightly old posts is OK)
- Shopping carts (temporary inconsistency is acceptable)
- Analytics systems

**Implementation:**

- Asynchronous replication
- Conflict-free replicated data types (CRDTs)
- Version vectors

**Example:**

```
User posts on Facebook
├── East Coast DB: Updated (10ms)
├── West Coast DB: Updated (100ms)
└── User in West: Sees post after 100ms
```

### Trade-off Summary

| Aspect        | Strong Consistency | Eventual Consistency |
| ------------- | ------------------ | -------------------- |
| Data Accuracy | Always correct     | May be stale         |
| Latency       | Higher             | Lower                |
| Availability  | Lower              | Higher               |
| Complexity    | Higher             | Lower                |

---

## 2. Latency vs Throughput

### Latency

**Definition:** Time taken to complete a single operation.

**Measurement:**

- Average latency
- P50, P95, P99 percentiles
- Max latency

**Example:**

```
API response times:
- P50: 50ms (50% of requests under 50ms)
- P95: 200ms (95% of requests under 200ms)
- P99: 500ms (99% of requests under 500ms)
```

### Throughput

**Definition:** Number of operations completed per unit time.

**Measurement:**

- Requests per second (RPS)
- Transactions per second (TPS)
- Operations per second (OPS)

**Example:**

```
System capacity:
- 10,000 requests/second
- 100,000 requests/minute
- 144 million requests/day
```

### The Trade-off

**Optimize for Latency:**

- Reduce processing per request
- Use caching
- Pre-compute results
- **Consequence:** May reduce throughput (more overhead per request)

**Optimize for Throughput:**

- Batch operations
- Asynchronous processing
- Reduce per-request overhead
- **Consequence:** May increase latency (queuing, batching)

### Example: Database Connection Pool

```python
# Small pool = Low latency, Low throughput
pool_size = 5
# Each connection responds quickly
# But only 5 concurrent queries

# Large pool = Higher latency, High throughput
pool_size = 100
# More concurrent queries
# But each may wait for connection
```

---

## 3. ACID vs BASE Properties

### ACID (Strong Consistency)

**A - Atomicity:** All-or-nothing

- Transactions complete entirely or not at all

**C - Consistency:** Database moves from one valid state to another

- Constraints always satisfied

**I - Isolation:** Concurrent transactions don't interfere

- Serializable, Repeatable Read, etc.

**D - Durability:** Committed transactions survive failures

- Data persisted to stable storage

**Example:**

```sql
BEGIN;
  UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 123;
  INSERT INTO orders (product_id, quantity) VALUES (123, 1);
COMMIT;  -- Either both succeed or both fail
```

### BASE (Eventual Consistency)

**B - Basically Available:** System always responds

- Even if response is stale

**A - Soft State:** System may be in inconsistent state

- Updates propagate asynchronously

**E - Eventual Consistency:** System becomes consistent eventually

- If no new updates, all nodes converge

**Example:**

```javascript
// Shopping cart (BASE)
User adds item to cart
├── Update local cache immediately (available)
├── Async: Persist to database (soft state)
└── Async: Sync across regions (eventual)
```

### Trade-off Matrix

| Property     | ACID (Strong) | BASE (Eventual) |
| ------------ | ------------- | --------------- |
| Consistency  | Strong        | Eventual        |
| Availability | Lower         | Higher          |
| Latency      | Higher        | Lower           |
| Complexity   | Higher        | Lower           |

---

## 4. Read Through vs Write Through Caching

### Read Through (Lazy Loading)

```
Application          Cache          Database
    |                 |               |
    |--Check------->|               |
    |<--Miss---------|               |
    |                                 |
    |----------------------Query------>|
    |<-------------------Data-------|
    |                                 |
    |--Set Data----->|               |
    |                 |
    |<--Data---------|
```

**Characteristics:**

- Cache populated on demand
- Simpler cache logic in application
- First user experiences cache miss

**Use Cases:**

- Read-heavy workloads
- Predictable access patterns

### Write Through

```
Application          Cache          Database
    |                 |               |
    |--Write------->|               |
    |                 |---Write---->|
    |                 |               |
    |<--Ack---------|               |
    |                 |<---Ack------|
```

**Characteristics:**

- Cache always updated with writes
- Consistent cache and database
- Slower writes (two operations)

**Use Cases:**

- Critical data that must be fresh
- High consistency requirements

**Code Example:**

```python
def update_user(user_id, data):
    cache_key = f"user:{user_id}"

    # Write to cache
    redis.setex(cache_key, 3600, json.dumps(data))

    # Write to database
    db.execute("UPDATE users SET ...", data)
```

### Trade-offs

| Aspect        | Read Through          | Write Through          |
| ------------- | --------------------- | ---------------------- |
| Write Latency | Fast                  | Slower (two writes)    |
| Read Latency  | Variable (cache miss) | Consistent (cache hit) |
| Consistency   | Eventual              | Strong                 |
| Complexity    | Low                   | Medium                 |

---

## 5. Batch Processing vs Stream Processing

### Batch Processing

```
Time Window: 1 hour
├── Collect all events
├── Process together
└── Write results
```

**Characteristics:**

- Process data in batches/periods
- Higher latency (wait for batch)
- Higher throughput (process many at once)
- Lower cost (better resource utilization)

**Use Cases:**

- Daily reports
- Billing calculations
- Data warehousing
- Backup operations

**Example:**

```python
def process_daily_analytics():
    # Get all data from yesterday
    data = db.query("""
        SELECT * FROM events
        WHERE created_at >= ? AND created_at < ?
    """, yesterday_start, today_start)

    # Process in batch
    results = analyze(data)

    # Write results
    save_analytics(results)
```

### Stream Processing

```
Event 1 ──→ Process ──→ Result
Event 2 ──→ Process ──→ Result
Event 3 ──→ Process ──→ Result
...
```

**Characteristics:**

- Process each event as it arrives
- Lower latency (real-time)
- Higher complexity (state management)
- Higher cost (always running)

**Use Cases:**

- Real-time analytics
- Fraud detection
- Live monitoring
- Real-time recommendations

**Example:**

```python
def process_events():
    for event in event_stream:
        result = process(event)
        send_to_downstream(result)
```

### Trade-offs

| Aspect     | Batch Processing   | Stream Processing     |
| ---------- | ------------------ | --------------------- |
| Latency    | High (hours)       | Low (milliseconds)    |
| Throughput | Very High          | Medium                |
| Complexity | Low                | High                  |
| Cost       | Lower              | Higher                |
| Use Case   | Analytics, Reports | Real-time, Monitoring |

---

## 6. Load Balancer vs API Gateway

### Load Balancer

**Focus:** Distribute traffic across servers

**Responsibilities:**

- Traffic distribution (Round Robin, Least Connections, etc.)
- Health checks
- SSL termination
- L4 vs L7

**Example:**

```
Client → Load Balancer → [Server1, Server2, Server3]
```

**Pros:**

- Simple, fast
- Protocol-agnostic
- Efficient traffic distribution

**Cons:**

- Limited routing intelligence
- No application-level features

### API Gateway

**Focus:** API management and cross-cutting concerns

**Responsibilities:**

- Routing (path-based, version-based)
- Authentication & Authorization
- Rate Limiting
- Request/Response transformation
- SSL termination
- Logging & Monitoring

**Example:**

```
Client → API Gateway
            ├── Auth (JWT validation)
            ├── Rate Limiting
            └── Routing
                ├── Service A
                ├── Service B
                └── Service C
```

**Pros:**

- Centralized cross-cutting concerns
- Rich feature set
- API versioning
- Protocol translation

**Cons:**

- More complex
- Potential bottleneck
- Higher latency

**Trade-off Summary**

| Aspect     | Load Balancer               | API Gateway                   |
| ---------- | --------------------------- | ----------------------------- |
| Routing    | Simple                      | Complex (content-aware)       |
| Features   | Basic (distribution)        | Rich (auth, rate limit, etc.) |
| Complexity | Low                         | High                          |
| Latency    | Very Low                    | Low-Medium                    |
| Use Case   | Simple traffic distribution | API management, microservices |

---

## 7. API Gateway vs Direct Service Exposure

### API Gateway Pattern

```
Client → API Gateway → Services
```

**Characteristics:**

- Single entry point for clients
- Centralized cross-cutting concerns
- Service abstraction

**Benefits:**

- Simplified client logic
- Consistent API across services
- Easier to add cross-cutting features

**Drawbacks:**

- Single point of failure
- Potential bottleneck
- Additional latency

### Direct Service Exposure

```
Client → Service A
     → Service B
     → Service C
```

**Characteristics:**

- Each service has its own endpoint
- No intermediary layer

**Benefits:**

- Lower latency (no gateway)
- No single point of failure
- Service independence

**Drawbacks:**

- Complex client logic
- Duplicate cross-cutting concerns
- Inconsistent APIs

### Trade-off Decision Tree

```
Need cross-cutting concerns?
├── Yes → API Gateway
└── No → Direct Exposure

Need service abstraction?
├── Yes → API Gateway
└── No → Direct Exposure

Number of services > 10?
├── Yes → API Gateway
└── No → Consider Direct Exposure
```

---

## 8. Primary-Replica vs Peer-to-Peer Replication

### Primary-Replica (Master-Slave)

```
Writes → Primary → Replicas
Reads  → Primary or Replicas
```

**Characteristics:**

- Single primary for writes
- Multiple replicas for reads
- Asynchronous or synchronous replication

**Pros:**

- Simple to implement
- Read scalability
- Strong consistency (with sync replication)

**Cons:**

- Write bottleneck at primary
- Primary is single point of failure
- Data lag to replicas (async)

**Use Cases:**

- Read-heavy workloads
- Analytics systems
- Backup/disaster recovery

### Peer-to-Peer (Multi-Master)

```
Writes → Any node
Reads  → Any node
```

**Characteristics:**

- All nodes can accept writes
- Eventual consistency
- Conflict resolution required

**Pros:**

- Write scalability
- High availability
- No single point of failure

**Cons:**

- Complex conflict resolution
- Consistency challenges
- Higher complexity

**Use Cases:**

- Multi-region systems
- High-write workloads
- Critical availability systems

### Trade-offs

| Aspect            | Primary-Replica                  | Peer-to-Peer                    |
| ----------------- | -------------------------------- | ------------------------------- |
| Write Scalability | Low                              | High                            |
| Read Scalability  | High                             | High                            |
| Consistency       | Strong (sync) / Eventual (async) | Eventual                        |
| Complexity        | Low                              | High                            |
| Use Case          | Read-heavy                       | Multi-region, High-availability |

---

## 9. Data Compression vs Data Duplication

### Data Compression

```
Original: 100MB
    ↓ (Compress)
Compressed: 30MB
    ↓ (Network Transfer)
    ↓ (Decompress)
Original: 100MB
```

**Characteristics:**

- Reduce data size
- Lower network/bandwidth cost
- Higher CPU usage for compression/decompression
- Higher latency for compression

**Algorithms:**

- **GZIP:** Good balance of compression and speed
- **Snappy:** Faster, lower compression
- **LZ4:** Very fast, good compression
- **ZSTD:** Best compression, reasonable speed

**Example:**

```javascript
const zlib = require("zlib")

// Compress data
const compressed = zlib.gzipSync(json.stringify(data))
console.log(`Original: ${data.length}, Compressed: ${compressed.length}`)

// Decompress data
const decompressed = zlib.gunzipSync(compressed)
const parsed = JSON.parse(decompressed.toString())
```

**Pros:**

- Reduced storage cost
- Lower network bandwidth
- Faster transfer

**Cons:**

- CPU overhead
- Compression/decompression latency
- Cannot compress random data well

### Data Duplication

```
Data stored in multiple locations
For redundancy and availability
```

**Characteristics:**

- Multiple copies of data
- Higher storage cost
- Higher availability
- No compression overhead

**Strategies:**

- **Replication:** Same data across multiple nodes
- **Sharding:** Different data across multiple nodes
- **Backup:** Additional copies for disaster recovery

**Example:**

```
User data stored in:
- Primary region (US East)
- Replica region (US West)
- Backup region (EU)
```

**Pros:**

- High availability
- No processing overhead
- Simple to implement

**Cons:**

- Higher storage cost
- Higher network cost (for sync)
- Data consistency challenges

### Trade-off Decision

**Use Compression When:**

- Bandwidth is expensive
- Network is slow
- Data is compressible (text, JSON, etc.)
- CPU is available

**Use Duplication When:**

- Availability is critical
- Fast access needed
- Storage is cheap
- Network is fast

---

## 10. Server Side vs Client Side Caching

### Server Side Caching

```
Client          Server Cache          Database
    |                 |               |
    |--Request------->|               |
    |<--Response----| (from cache)  |
    |                 |               |
```

**Types:**

- **In-memory cache:** Redis, Memcached
- **CDN cache:** Edge servers
- **Database cache:** Query result cache, buffer pool

**Pros:**

- Centralized control
- Can cache for all users
- Easy invalidation
- No client storage limits

**Cons:**

- Server cost
- Still requires network round trip
- May not reduce bandwidth

### Client Side Caching

```
Application Client
    ├── Local Storage
    ├── Session Storage
    ├── IndexedDB
    └── Service Worker Cache
```

**Types:**

- **LocalStorage:** Persistent, 5-10MB
- **SessionStorage:** Session, 5-10MB
- **IndexedDB:** Large storage, indexed
- **Service Worker:** Offline-first, caching

**Pros:**

- No server round trip (instant)
- Reduced bandwidth
- Offline capability
- Zero server cost

**Cons:**

- Limited storage
- Cache invalidation complexity
- Security concerns (XSS)
- Not shared across devices

**Example:**

```javascript
// Server-side cache
redis.set("user:123", userData, { ex: 3600 })

// Client-side cache
localStorage.setItem("user:123", JSON.stringify(userData))
```

### Trade-offs

| Aspect    | Server Side       | Client Side  |
| --------- | ----------------- | ------------ |
| Latency   | Network dependent | Zero (local) |
| Bandwidth | Higher            | Lower        |
| Storage   | Unlimited         | Limited      |
| Control   | Full              | None         |
| Cost      | Server cost       | Zero         |
| Offline   | No                | Yes          |

---

## 11. REST vs RPC

### REST (Representational State Transfer)

**Characteristics:**

- Resource-oriented
- HTTP verbs (GET, POST, PUT, DELETE)
- Stateless
- JSON/XML payload
- Text-based

**Example:**

```
GET /api/users/123
Content-Type: application/json

Response:
{
  "id": 123,
  "name": "John"
}
```

**Pros:**

- Standard, well-understood
- Easy to debug (human-readable)
- Stateful caching built-in
- Works on any platform

**Cons:**

- Verbose (lots of text)
- Higher bandwidth
- Slower (text parsing)
- Limited to HTTP

### RPC (Remote Procedure Call)

**Characteristics:**

- Action-oriented
- Multiple protocols (HTTP, gRPC, etc.)
- Can be stateful
- Binary payload (gRPC, Thrift)
- Strong typing (gRPC)

**Example:**

```
// gRPC
service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
}
```

**Pros:**

- Efficient (binary)
- Lower bandwidth
- Faster (binary serialization)
- Strong typing
- Bi-directional streaming

**Cons:**

- More complex tooling
- Not human-readable
- Protocol coupling
- Requires code generation

**Trade-offs**

| Aspect      | REST        | RPC (gRPC)    |
| ----------- | ----------- | ------------- |
| Performance | Medium      | High          |
| Bandwidth   | Higher      | Lower         |
| Tooling     | Simple      | Complex       |
| Debugging   | Easy (JSON) | Hard (binary) |
| Type Safety | Loose       | Strong        |
| Streaming   | No          | Yes           |

**Decision Tree:**

```
Need high performance?
├── Yes → RPC (gRPC)
└── No → REST

Internal service?
├── Yes → RPC (gRPC)
└── No → REST

Need public API?
├── Yes → REST
└── No → Consider RPC

Streaming needed?
├── Yes → RPC (gRPC)
└── No → REST
```

---

## 12. Polling vs Long Polling vs Webhook

### Short Polling

```
Client          Server
  |                |
  |----Request--->|
  |<--Response----|
  |   (Data/Empty)|
  |                |
  |    Wait 1s     |
  |                |
  |----Request--->|
```

**Pros:**

- Simple to implement
- Works everywhere
- No server state

**Cons:**

- Wasteful (many empty responses)
- High server load
- Not real-time
- Battery drain on mobile

**Use Case:** Simple status checks, low-frequency updates

### Long Polling

```
Client          Server
  |                |
  |----Request--->|
  |   (Holds)      |
  |   (Wait)       |
  |                |
  |<--Response----|
  |   (Data)       |
```

**Pros:**

- Reduced server load
- More efficient than short polling
- Better battery life

**Cons:**

- Connection overhead
- May need timeouts
- Still not truly real-time

**Use Case:** Social media feeds, notifications

### Webhook (Push)

```
Server          Webhook Endpoint
  |                |
  |---Event------->|
  |                |
  |<--Ack---------|
```

**Pros:**

- Real-time updates
- Low server load (push-based)
- No polling overhead

**Cons:**

- Server needs public endpoint
- Webhook reliability
- Authentication challenges
- More complex

**Use Case:** Payment notifications, external integrations

### Trade-offs Summary

| Aspect      | Short Polling | Long Polling | Webhook |
| ----------- | ------------- | ------------ | ------- |
| Latency     | High          | Medium       | Low     |
| Server Load | High          | Medium       | Low     |
| Real-time   | No            | No           | Yes     |
| Complexity  | Low           | Low          | High    |
| Server      | Simple        | Simple       | Complex |

**Decision Matrix:**

```
Need real-time?
├── Yes → Webhook (if you control sender) or WebSocket
├── No → Polling
│   └── Server load concern?
│       ├── Yes → Long Polling
│       └── No → Short Polling
```

---

## 13. CDN Usage vs Direct Server Serving

### CDN (Content Delivery Network)

```
User Request
    ↓
DNS returns nearest CDN edge
    ↓
Edge Server (Cache Hit) → User
    OR
Edge Server (Cache Miss) → Origin → Edge → User
```

**Characteristics:**

- Distributed edge servers globally
- Cache static content
- Route to nearest server

**Pros:**

- Reduced latency (geographically close)
- Lower bandwidth (cached content)
- Higher availability (multiple edge locations)
- DDoS protection

**Cons:**

- Cost (bandwidth + requests)
- Cache invalidation complexity
- Limited to static/cached content
- Not suitable for dynamic data

**Use Cases:**

- Static assets (images, CSS, JS, videos)
- API responses with TTL
- Global applications

### Direct Server Serving

```
User Request
    ↓
Direct to Application Server
    ↓
Server processes and responds
```

**Characteristics:**

- Direct connection to origin servers
- No intermediate caching layer

**Pros:**

- Full control
- No CDN cost
- Real-time data (no caching)
- Simpler architecture

**Cons:**

- Higher latency (no geographic distribution)
- Higher bandwidth cost (no cache)
- Lower availability (single location)
- DDoS vulnerability

**Use Cases:**

- Highly dynamic content
- Real-time data
- Internal applications
- Cost-sensitive applications

### Trade-offs

| Aspect       | CDN     | Direct Serving |
| ------------ | ------- | -------------- |
| Latency      | Low     | High           |
| Bandwidth    | Low     | High           |
| Availability | High    | Low            |
| Cost         | High    | Low            |
| Control      | Limited | Full           |
| Real-time    | No      | Yes            |

**Decision Framework:**

```
Content type?
├── Static → CDN
├── Dynamic (cacheable) → CDN with short TTL
├── Dynamic (real-time) → Direct
└── User-specific → Direct (or CDN with authentication)

Geographic distribution?
├── Global → CDN
├── Regional → May use CDN or direct
└── Local → Direct (simpler)

Cost sensitive?
├── Yes → Direct or optimize CDN usage
└── No → CDN for best performance
```

---

## 14. Serverless vs Traditional Server-based

### Serverless Architecture

```
Event → Lambda Function → Managed Service
```

**Characteristics:**

- No server management
- Pay per execution
- Auto-scaling
- Stateless (usually)

**Providers:**

- AWS Lambda
- Google Cloud Functions
- Azure Functions
- Vercel, Netlify

**Pros:**

- Zero server management
- Auto-scaling (zero to infinity)
- Pay only for usage
- Fast deployment
- Built-in integration with cloud services

**Cons:**

- Cold starts (latency)
- Vendor lock-in
- Limited execution time
- Harder to debug
- State complexity (external state required)

**Use Cases:**

- APIs with sporadic traffic
- Data processing jobs
- Event-driven applications
- Small services

### Traditional Server-based

```
Client → Load Balancer → App Servers
```

**Characteristics:**

- Managed servers (EC2, VM)
- Persistent state
- Always running (usually)

**Pros:**

- No cold starts
- Full control
- Long-running processes
- State management easier
- No vendor lock-in

**Cons:**

- Server management required
- Manual scaling
- Pay for idle time
- Slower deployment

**Use Cases:**

- Long-running services
- Stateful applications
- High-throughput systems
- Real-time applications

### Trade-offs

| Aspect      | Serverless  | Traditional  |
| ----------- | ----------- | ------------ |
| Management  | None        | Required     |
| Scaling     | Automatic   | Manual       |
| Cost        | Pay-per-use | Pay-for-time |
| Cold Starts | Yes         | No           |
| Control     | Limited     | Full         |
| State       | External    | Local        |

---

## 15. Hybrid Cloud vs All Cloud Storage

### Hybrid Cloud

```
On-Premises
    ↓
    ├─→ Local Storage
    ├─→ Local Database
    └─→ Cloud Backup
```

**Characteristics:**

- Mix of on-premises and cloud
- Sensitive data on-premises
- Less sensitive data in cloud

**Pros:**

- Control over sensitive data
- Compliance with regulations
- Cost optimization (cloud for burst)
- Flexibility

**Cons:**

- Complex to manage
- Higher operational overhead
- Synchronization challenges
- Security complexity

**Use Cases:**

- Regulated industries (finance, healthcare)
- Data sovereignty requirements
- Cost optimization strategies

### All Cloud Storage

```
Application → Cloud Storage
```

**Characteristics:**

- All data in cloud
- Managed services

**Pros:**

- Simple to manage
- Scalable
- Pay-as-you-go
- Managed security (provider responsibility)
- Global distribution

**Cons:**

- Vendor lock-in
- Data sovereignty concerns
- Ongoing cloud costs
- Less control

**Use Cases:**

- Startups
- Web applications
- Global systems
- Non-regulated data

### Trade-offs

| Aspect     | Hybrid | All Cloud           |
| ---------- | ------ | ------------------- |
| Control    | High   | Low                 |
| Complexity | High   | Low                 |
| Cost       | Mixed  | Predictable         |
| Compliance | Better | Needs configuration |
| Management | High   | Low                 |

---

## 16. Token Bucket vs Leaky Bucket (Rate Limiting)

### Token Bucket

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

**Characteristics:**

- Bursts allowed (up to bucket capacity)
- Smooth refill
- Memory efficient

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

**Pros:**

- Handles bursts well
- Fair distribution
- Memory efficient

**Cons:**

- Complex to implement
- May not prevent short bursts

**Use Case:** API rate limiting, protecting from abuse

### Leaky Bucket

```
Bucket with a hole
Requests fill → bucket
Requests leak out at constant rate
If bucket is full → reject
```

**Characteristics:**

- Smooths traffic
- Constant outflow rate
- Handles bursts by filling bucket

**Implementation:**

```python
import time

class LeakyBucket:
    def __init__(self, capacity, leak_rate):
        self.capacity = capacity
        self.leak_rate = leak_rate  # requests per second
        self.queue = []
        self.last_leak = time.time()

    def allow_request(self):
        now = time.time()
        elapsed = now - self.last_leak

        # Leak (remove) requests
        leaked = int(elapsed * self.leak_rate)
        self.queue = self.queue[leaked:]
        self.last_leak = now

        if len(self.queue) < self.capacity:
            self.queue.append(now)
            return True
        return False
```

**Pros:**

- Smooths traffic
- Good for network traffic shaping
- Prevents bursts

**Cons:**

- Doesn't handle bursts well
- More complex

**Use Case:** Network traffic shaping, protecting backend

### Trade-offs

| Aspect            | Token Bucket      | Leaky Bucket    |
| ----------------- | ----------------- | --------------- |
| Burst Handling    | Good              | Poor            |
| Traffic Smoothing | Medium            | Good            |
| Complexity        | High              | High            |
| Fairness          | High              | Medium          |
| Use Case          | API rate limiting | Traffic shaping |

---

## 17. Read Heavy vs Write Heavy Systems

### Read Heavy Systems

**Characteristics:**

- Much more reads than writes
- Focus on read performance
- Optimize for data retrieval

**Design Strategies:**

- **Caching:** Multiple cache layers (CDN, Redis, in-memory)
- **Read Replicas:** Multiple database replicas
- **Denormalization:** Pre-compute common queries
- **Materialized Views:** Pre-aggregated data
- **Read-only slaves:** Separate read databases

**Example:**

```
User reads profile (10,000x/day)
User updates profile (10x/day)

Design:
- Cache profiles for 1 hour
- 10 read replicas
- Denormalized user data
- Materialized user stats
```

**Use Cases:**

- Social media feeds
- Product catalogs
- Content delivery
- Analytics dashboards

### Write Heavy Systems

**Characteristics:**

- Many writes
- Focus on write throughput
- Optimize for data persistence

**Design Strategies:**

- **Write Optimization:** Batch writes, async writes
- **Sharding:** Distribute writes across shards
- **Time Series:** Append-only structures
- **CQRS:** Separate read and write models
- **Event Sourcing:** Store events, not state

**Example:**

```
User logs activity (100,000x/day)
User reads activity (10x/day)

Design:
- Sharded by user_id
- Append-only log structure
- Async write to analytics DB
- CQRS: Read from optimized read DB
```

**Use Cases:**

- Logging systems
- Real-time analytics
- IoT data ingestion
- Event tracking

### Trade-offs

| Aspect               | Read Heavy                 | Write Heavy             |
| -------------------- | -------------------------- | ----------------------- |
| Primary Optimization | Caching, replicas          | Sharding, batching      |
| Consistency Model    | Eventual OK                | Strong needed           |
| Caching              | Critical                   | Limited use             |
| Replication          | Read replicas              | Write replicas          |
| Query Complexity     | Simple (optimize for read) | Complex (handle writes) |

---

## Framework for Making Trade-off Decisions

### 1. Identify Requirements

```
Functional Requirements:
- What must system do?
- Use cases?

Non-Functional Requirements:
- Scale (users, data)
- Latency requirements
- Availability (SLA)
- Consistency needs
- Budget constraints
```

### 2. Prioritize Requirements

```
Rank requirements by importance:
1. Must have (non-negotiable)
2. Should have (important)
3. Nice to have (optional)

Example:
- Must: Data accuracy (banking)
- Should: < 100ms latency
- Nice to have: Real-time updates
```

### 3. Evaluate Options

For each decision:

- List all options
- Evaluate against requirements
- Identify trade-offs
- Document reasoning

### 4. Prototype and Test

```
- Create prototype
- Load test
- Monitor metrics
- Validate assumptions
```

### 5. Iterate

```
- Monitor production
- Gather feedback
- Adjust trade-offs as needed
- Be prepared to change approach
```

---

## Conclusion

There's no perfect system design. Every decision involves trade-offs. The key is to:

1. **Understand requirements thoroughly**
2. **Prioritize what matters most**
3. **Evaluate trade-offs explicitly**
4. **Document your decisions**
5. **Be ready to iterate**

Remember: A good system design is one that makes the right trade-offs for the specific problem and context.

---

## Links

- [System Design Interview Overview](overview.md)
- [Distributed Systems Fundamentals](distributed-systems.md)
- [Caching and Message Queues](caching-message-queues.md)
- [SQL vs NoSQL Databases](sql-vs-nosql.md)
