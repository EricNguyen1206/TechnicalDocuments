---
title: "Design a URL Shortener (TinyURL)"
date: 2025-02-15
tags: ["system-design", "url-shortener", "system-design-interview"]
description: "Complete system design for a URL shortener service like TinyURL or Bit.ly."
author: "Eric Nguyen"
layout: "post"
---

# Design a URL Shortener (TinyURL)

## Problem Statement

Design a URL shortening service like TinyURL or Bit.ly that:

- Shortens long URLs
- Redirects short URLs to original URLs
- Handles millions of URLs
- Provides analytics (clicks, timestamps)
- Highly available and scalable

---

## Functional Requirements

### Core Features

1. **Shorten URL**
   - Input: Long URL (e.g., `https://example.com/very/long/path`)
   - Output: Short URL (e.g., `https://tinyurl.com/abc123`)

2. **Redirect**
   - Input: Short URL
   - Output: Redirect to original URL

3. **Custom Alias**
   - Users can create custom short URLs
   - Example: `https://tinyurl.com/my-product`

4. **Expiration**
   - URLs can have expiration dates
   - Auto-deletion after expiry

5. **Analytics**
   - Track click counts
   - Record timestamps
   - Store user information (IP, location, device)

### User Stories

- "I want to share a long URL on Twitter"
- "I want to track clicks on my shared link"
- "I want a memorable custom short URL for my product"
- "I want my links to expire after 30 days"

---

## Non-Functional Requirements

### Scale Requirements

**Assumptions:**

- 100M URLs stored
- 100M new URLs per day
- 10B redirections per day
- 10:1 read/write ratio

**Calculations:**

```
Writes per second:
100M URLs / day = 1,157 URLs/sec

Reads per second:
10B redirections / day = 115,740 redirections/sec

Storage:
100M URLs × 500 bytes = 50 GB

Bandwidth (reads):
10B redirects × 500 bytes = 5 TB/day = 58 MB/sec
```

### Performance Requirements

- **Latency**: < 100ms for both shorten and redirect
- **Availability**: 99.9% (43.2 minutes downtime/month)
- **Scalability**: Handle 10x growth

### Consistency Requirements

- Strong consistency for writes
- Eventual consistency for redirects acceptable

---

## High-Level Design

### Components

```
Client
    ↓
[Load Balancer]
    ↓
[API Gateway]
    ↓
    ├─→ [URL Shortener Service]
    │       ↓
    │   [Database Cluster]
    │
    ├─→ [Redirect Service]
    │       ↓
    │   [Cache Cluster]
    │       ↓ (miss)
    │   [Database Cluster]
    │
    └─→ [Analytics Service]
            ↓
        [Database Cluster]
```

### API Endpoints

```yaml
# Shorten URL
POST /api/v1/shorten
Request:
  {
    "url": "https://example.com/very/long/path",
    "custom_alias": "my-product",  # optional
    "expires_at": "2025-03-15T00:00:00Z"  # optional
  }
Response:
  {
    "short_url": "https://tinyurl.com/abc123",
    "original_url": "https://example.com/very/long/path",
    "created_at": "2025-02-15T10:00:00Z"
  }

# Redirect
GET /:alias
Response:
  301 Redirect to original URL

# Get URL Info
GET /api/v1/info/:alias
Response:
  {
    "original_url": "https://example.com/very/long/path",
    "created_at": "2025-02-15T10:00:00Z",
    "clicks": 1234,
    "expires_at": "2025-03-15T00:00:00Z"
  }

# Delete URL
DELETE /api/v1/url/:alias
Response:
  {
    "success": true
  }
```

---

## Data Model

### URL Table

```sql
CREATE TABLE urls (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    user_id BIGINT,  -- optional, for custom alias
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,  -- optional
    click_count BIGINT DEFAULT 0,
    INDEX idx_short_code (short_code),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_id (user_id)
);
```

### Analytics Table

```sql
CREATE TABLE url_analytics (
    id BIGSERIAL PRIMARY KEY,
    url_id BIGINT REFERENCES urls(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    country VARCHAR(2),
    city VARCHAR(100),
    INDEX idx_url_id (url_id),
    INDEX idx_clicked_at (clicked_at)
);
```

---

## Hash Generation

### Approach 1: Base62 Encoding

```python
import string

def encode(num):
    """Convert number to Base62 string"""
    characters = string.digits + string.ascii_letters + string.ascii_uppercase
    base = len(characters)  # 62

    if num == 0:
        return characters[0]

    arr = []
    base = len(characters)
    while num:
        num, rem = divmod(num, base)
        arr.append(characters[rem])

    return ''.join(reversed(arr))

def decode(str):
    """Convert Base62 string to number"""
    characters = string.digits + string.ascii_letters + string.ascii_uppercase
    base = len(characters)

    num = 0
    for char in str:
        num = num * base + characters.index(char)

    return num

# Usage
id = 123456789
short_code = encode(id)  # "8m0Kx"
```

### Approach 2: Hash + Base62

```python
import hashlib
import string

def generate_short_code(url):
    """Generate short code from URL hash"""
    # Generate hash
    hash_obj = hashlib.md5(url.encode())
    hash_hex = hash_obj.hexdigest()

    # Convert to number
    hash_num = int(hash_hex[:8], 16)

    # Encode to Base62
    return encode(hash_num)

# Usage
url = "https://example.com/very/long/path"
short_code = generate_short_code(url)  # "abc123"
```

### Approach 3: Counter-based

```python
def generate_short_code_counter(counter):
    """Generate short code using database counter"""
    # Use distributed counter (e.g., in Redis)
    counter.increment()
    id = counter.get_value()
    return encode(id)
```

---

## Database Design

### Sharding Strategy

**Hash-based Sharding:**

```
shard_number = hash(short_code) % number_of_shards

Shard 0: short codes starting with 0, 6, c, ...
Shard 1: short codes starting with 1, 7, d, ...
Shard 2: short codes starting with 2, 8, e, ...
...
```

**Pros:**

- Even distribution
- Simple lookups

**Cons:**

- Rebalancing complexity

### Database Schema (Sharded)

```
Database Cluster
    ├── Shard 0 (Master + 2 Replicas)
    ├── Shard 1 (Master + 2 Replicas)
    ├── Shard 2 (Master + 2 Replicas)
    └─→ Shard N (Master + 2 Replicas)
```

---

## Caching Strategy

### Cache for Hot URLs

```
Client Request → Cache (Redis)
                ↓
            Hit → Return
                ↓
            Miss → Database
                ↓
                Update Cache
```

**Cache Key:**

```
url:abc123 → "https://example.com/very/long/path"
```

**TTL:**

- 24 hours for popular URLs
- 1 hour for less popular

### Implementation

```python
import redis
import json

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def get_original_url(short_code):
    cache_key = f"url:{short_code}"

    # Check cache
    cached_url = redis_client.get(cache_key)
    if cached_url:
        return cached_url.decode('utf-8')

    # Cache miss: query database
    url = db.query("SELECT original_url FROM urls WHERE short_code = ?", short_code)

    if url:
        # Update cache
        redis_client.setex(cache_key, 3600, url)
        return url

    return None
```

---

## Rate Limiting

### Prevent Abuse

**Rate Limit by User/IP:**

- 1000 shorten requests per hour per user
- 10,000 redirect requests per hour per IP

**Implementation:**

```python
def check_rate_limit(user_id, limit=1000, window_seconds=3600):
    key = f"ratelimit:{user_id}"
    current = redis_client.incr(key)

    if current == 1:
        redis_client.expire(key, window_seconds)

    if current > limit:
        raise Exception("Rate limit exceeded")

    return True
```

---

## Analytics Implementation

### Track Clicks

```python
def track_click(short_code, request_data):
    # Increment click count
    db.execute(
        "UPDATE urls SET click_count = click_count + 1 WHERE short_code = ?",
        short_code
    )

    # Record analytics asynchronously
    analytics_queue.publish({
        'short_code': short_code,
        'clicked_at': datetime.now(),
        'ip_address': request_data['ip'],
        'user_agent': request_data['user_agent'],
        'country': request_data['country'],
        'city': request_data['city']
    })
```

### Batch Processing

```
Analytics Service
    ↓
Message Queue
    ↓
Batch Insert (every 5 minutes)
```

---

## Scaling Considerations

### Write Scalability

1. **Database Sharding**
   - Distribute writes across multiple databases
   - Use consistent hashing for even distribution

2. **Asynchronous Processing**
   - Analytics written asynchronously
   - Reduce write load on main database

### Read Scalability

1. **Caching Layer**
   - Redis cluster for hot URLs
   - CDN for static assets

2. **Read Replicas**
   - Multiple read replicas
   - Load balance reads

3. **Geographic Distribution**
   - Deploy in multiple regions
   - Route to nearest datacenter

---

## System Architecture Diagram

```
                        ┌─────────────┐
                        │   Client    │
                        └──────┬──────┘
                               │
                    ┌──────────▼──────────┐
                    │   Load Balancer    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   API Gateway     │
                    │  - Auth           │
                    │  - Rate Limit     │
                    │  - Logging        │
                    └──────────┬──────────┘
                               │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
        ┌───────▼────────┐ ┌────▼───────┐ ┌────▼──────────┐
        │   Shortener   │ │  Redirect   │ │   Analytics   │
        │   Service     │ │  Service    │ │   Service     │
        └───────┬────────┘ └────┬───────┘ └────┬──────────┘
                │                │               │
        ┌───────▼────────┐ ┌────▼───────┐ ┌────▼──────────┐
        │  Redis Cache   │ │Redis Cache  │ │ Redis Queue   │
        └───────┬────────┘ └────┬───────┘ └────┬──────────┘
                │                │               │
        ┌───────▼────────┐ ┌────▼───────┐ ┌────▼──────────┐
        │ PostgreSQL    │ │ PostgreSQL  │ │ PostgreSQL    │
        │   Cluster     │ │   Cluster   │ │   Cluster     │
        │   (Shards)   │ │   (Shards) │ │   (Shards)   │
        └───────────────┘ └────────────┘ └───────────────┘
```

---

## Alternatives & Optimizations

### 1. Use Counter Service

```
Distributed counter for generating unique IDs
Avoids database contention
```

### 2. Pre-generate Short Codes

```
Generate short codes in batches
Store in pool
Assign on demand
```

### 3. Bloom Filters

```
Use bloom filter for quick existence check
Reduces database lookups
```

---

## Follow-up Questions

1. **How to handle custom alias conflicts?**
   - Check availability before assignment
   - Return error if unavailable

2. **How to handle expired URLs?**
   - Background job to clean up expired URLs
   - Return 404 for expired URLs

3. **How to handle malicious URLs?**
   - URL scanning and validation
   - Blocklist for suspicious domains
   - Rate limiting

4. **How to handle analytics at scale?**
   - Stream processing (Kafka, Kinesis)
   - Time-series database (InfluxDB)
   - Data aggregation and sampling

---

## Links

- [System Design Interview Overview](overview.md)
- [Distributed Systems](distributed-systems.md)
- [Caching and Message Queues](caching-message-queues.md)
