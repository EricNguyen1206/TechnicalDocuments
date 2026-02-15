---
title: "Distributed Counter Design"
date: 2025-02-15
tags: ["system-design", "counter", "distributed", "redis"]
description: "Design of a distributed counter system for counting likes, views, and other high-volume metrics."
author: "Eric Nguyen"
layout: "post"
---

# Distributed Counter Design

## Problem Statement

Design a distributed counter system that supports:

- High-volume counting (millions of increments per second)
- Real-time counts
- Multiple counter types (likes, views, shares, etc.)
- Accurate counts across distributed system
- Prevent double-counting
- Historical data and trends

---

## Functional Requirements

### Core Features

**Counter Operations:**

- Increment counter
- Decrement counter
- Get counter value
- Reset counter
- Batch operations

**Counter Types:**

- Post likes
- Post views
- Profile views
- Share counts
- Comment counts
- Favorite counts

**Advanced Features:**

- Rate limiting (max N increments per second)
- Time-series data (counts over time)
- Aggregated counts (daily, weekly, monthly)
- Real-time streaming counts

---

## Non-Functional Requirements

### Scale Requirements

**Assumptions:**

- 100 million posts
- 10 million daily active users
- 10 billion daily operations (likes, views, etc.)
- Peak: 1 million operations/second
- 100:1 read/write ratio

### Performance Requirements

- **Latency:**
  - Increment: < 50ms
  - Get count: < 100ms

- **Accuracy:**
  - Exact count (no approximate)
  - No lost increments
  - No double-counting

- **Availability:** 99.95%

---

## High-Level Architecture

```
                    ┌───────────┐
                    │   Clients  │
                    └─────┬─────┘
                          │
                ┌─────────▼─────────┐
                │   Load Balancer   │
                └─────────┬─────────┘
                          │
          ┌─────────────┼─────────────┐
          │             │             │
    ┌─────▼─────┐ ┌──▼──────┐ ┌──▼──────┐
    │   Counter  │ │  Time     │ │  Event    │
    │  Service  │ │  Series   │ │  Streamer  │
    └─────┬─────┘ └──┬───────┘ └──┬───────┘
          │             │             │
          │         ┌────┴───────┐ │
          │         │             │
    ┌─────▼─────────▼───┐     │
    │  Write-ahead Log (Kafka) │     │
    └───────────────────────┘     │
                                 │
                    ┌────────────▼─────────┐
                    │  Counter Processing   │
                    │     Workers          │
                    └────────────┬─────────┘
                                 │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐  ┌──────▼───────┐  ┌─────▼──────┐
    │  Fast Storage │  │   Hot Storage   │  │  Cold Storage │
    │   (Redis)   │  │   (Redis)       │  │  (PostgreSQL) │
    └─────────┬─────┘  └────────┬───────┘  └─────────┬───────┘
              │                 │                 │
              │         ┌─────────┴─────────┐       │
              │         │                    │       │
    ┌─────────▼─────────▼─────────┐        │
    │  Aggregation Service         │        │
    └──────────────────────────────┘        │
                                               │
                            ┌────────────▼─────────┐
                            │  Time Series DB       │
                            │  (InfluxDB, TimescaleDB)│
                            └───────────────────────┘
```

---

## Counter Data Models

### Counter Record

```sql
CREATE TABLE counters (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50),  -- post, profile, comment, etc.
    entity_id BIGINT,            -- post_id, profile_id, etc.
    counter_type VARCHAR(50),  -- likes, views, shares, etc.
    value BIGINT DEFAULT 0,
    version BIGINT DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (entity_type, entity_id, counter_type)
);
```

### Time Series Data

```
InfluxDB measurement: counter_values

Tags:
  - entity_type: "post"
  - entity_id: "123"
  - counter_type: "likes"

Fields:
  - value: 150 (numeric)
  - increment: 1 (numeric)
```

### Audit Log

```sql
CREATE TABLE counter_audit_log (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    counter_type VARCHAR(50),
    user_id BIGINT,
    action VARCHAR(20),  -- increment, decrement
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity_timestamp (entity_type, entity_id, timestamp)
);
```

---

## Distributed Counting Strategies

### Strategy 1: Redis Atomic Counters

```python
import redis
from typing import Dict

class RedisCounter:
    def __init__(self):
        self.redis = redis.Redis(host='localhost', port=6379, db=0)

    def increment(self, entity_type: str, entity_id: int, counter_type: str) -> int:
        key = f"counter:{entity_type}:{entity_id}:{counter_type}"

        # Atomic increment
        new_value = self.redis.incr(key)
        return new_value

    def get(self, entity_type: str, entity_id: int, counter_type: str) -> int:
        key = f"counter:{entity_type}:{entity_id}:{counter_type}"
        value = self.redis.get(key)
        return int(value) if value else 0

    def decrement(self, entity_type: str, entity_id: int, counter_type: str) -> int:
        key = f"counter:{entity_type}:{entity_id}:{counter_type}"
        new_value = self.redis.decr(key)
        return new_value

    def get_multiple(self, counters: list) -> Dict[str, int]:
        keys = [f"counter:{c['entity_type']}:{c['entity_id']}:{c['counter_type']}"
                 for c in counters]
        values = self.redis.mget(keys)

        return {keys[i]: int(v) if v else 0 for i, v in enumerate(values)}
```

### Strategy 2: Redis Sorted Sets (Leaderboards)

```python
import redis

class LeaderboardCounter:
    def __init__(self):
        self.redis = redis.Redis(host='localhost', port=6379, db=0)

    def increment(self, entity_type: str, entity_id: int, counter_type: str, user_id: int):
        key = f"leaderboard:{entity_type}:{entity_id}:{counter_type}"

        # Increment user's score in sorted set
        self.redis.zincrby(key, 1, user_id)

        # Get total count
        total = self.redis.zcard(key)

        # Update total counter
        total_key = f"counter:{entity_type}:{entity_id}:{counter_type}"
        self.redis.set(total_key, total)

        return total

    def get_top(self, entity_type: str, entity_id: int, counter_type: str, top_n: int):
        key = f"leaderboard:{entity_type}:{entity_id}:{counter_type}"

        # Get top N users (highest score)
        top_users = self.redis.zrevrange(key, 0, top_n - 1, withscores=True)

        return [
            {'user_id': int(user), 'score': int(score)}
            for user, score in top_users
        ]

    def get_user_rank(self, entity_type: str, entity_id: int, counter_type: str, user_id: int):
        key = f"leaderboard:{entity_type}:{entity_id}:{counter_type}"

        # Get user's rank
        rank = self.redis.zrevrank(key, user_id)

        return rank + 1  # 1-indexed
```

### Strategy 3: Count-Min Sketch (Approximate)

```python
from typing import List
import numpy as np

class CountMinSketch:
    def __init__(self, depth: int = 5, width: int = 1000):
        self.depth = depth
        self.width = width
        self.counters = np.zeros((depth, width), dtype=np.uint32)
        self.hash_functions = self._generate_hash_functions()

    def _generate_hash_functions(self):
        """Generate hash functions for counting"""
        import mmh3
        return [mmh3.hash() for _ in range(self.depth)]

    def add(self, item: str):
        """Add item to sketch"""
        for i in range(self.depth):
            hash_val = self.hash_functions[i](item)
            index = hash_val % self.width
            self.counters[i][index] += 1

    def count(self, item: str) -> int:
        """Estimate count of item"""
        min_count = float('inf')

        for i in range(self.depth):
            hash_val = self.hash_functions[i](item)
            index = hash_val % self.width
            min_count = min(min_count, self.counters[i][index])

        return int(min_count)

    def merge(self, other_sketch: 'CountMinSketch'):
        """Merge two sketches"""
        self.counters = np.minimum(self.counters, other_sketch.counters)

# Usage
sketch = CountMinSketch(depth=5, width=10000)

# Add items
sketch.add("user123")
sketch.add("user123")
sketch.add("user456")

# Get count
count = sketch.count("user123")  # Approximate count
```

---

## Preventing Double-Counting

### Method 1: Idempotent API

```python
from redis import Redis

class IdempotentCounter:
    def __init__(self):
        self.redis = Redis()

    def increment_with_idempotency(
        self,
        entity_type: str,
        entity_id: int,
        counter_type: str,
        user_id: int,
        request_id: str,
        ttl: int = 86400  # 24 hours
    ):
        # Check if request already processed
        idempotency_key = f"counter:idempotent:{request_id}"

        if self.redis.exists(idempotency_key):
            # Request already processed
            return False, None

        # Process increment
        counter_key = f"counter:{entity_type}:{entity_id}:{counter_type}"
        new_value = self.redis.incr(counter_key)

        # Store in audit log
        audit_key = f"counter_audit:{entity_type}:{entity_id}:{counter_type}"
        self.redis.lpush(audit_key, json.dumps({
            'user_id': user_id,
            'action': 'increment',
            'request_id': request_id,
            'timestamp': datetime.now().isoformat()
        }))

        # Mark request as processed
        self.redis.setex(idempotency_key, 1, ttl)

        return True, new_value
```

### Method 2: Unique User Check

```python
class UniqueUserCounter:
    def __init__(self):
        self.redis = Redis()

    def increment_with_unique_check(
        self,
        entity_type: str,
        entity_id: int,
        counter_type: str,
        user_id: int,
        ttl: int = 86400
    ):
        # Check if user already incremented
        user_key = f"counter:user:{entity_type}:{entity_id}:{counter_type}:{user_id}"

        if self.redis.exists(user_key):
            return False, None

        # Increment counter
        counter_key = f"counter:{entity_type}:{entity_id}:{counter_type}"
        new_value = self.redis.incr(counter_key)

        # Mark user as incremented
        self.redis.setex(user_key, 1, ttl)

        # Add to per-counter user set
        users_key = f"counter:users:{entity_type}:{entity_id}:{counter_type}"
        self.redis.sadd(users_key, user_id)
        self.redis.expire(users_key, ttl)

        return True, new_value
```

---

## Counter Processing Pipeline

### Kafka Topic Design

```yaml
counter-events:
  partitions: 10
  replication-factor: 3
  retention: 7 days

counter-aggregation:
  partitions: 5
  replication-factor: 3
  retention: 30 days
```

### Event Producer

```python
from kafka import KafkaProducer
import json

class CounterEventProducer:
    def __init__(self):
        self.producer = KafkaProducer(
            bootstrap_servers=['kafka1:9092', 'kafka2:9092', 'kafka3:9092'],
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )

    def publish_increment_event(self, event):
        future = self.producer.send(
            topic='counter-events',
            value=event,
            key=event['entity_id']  # Partition by entity_id
        )
        return future

    def publish_batch_events(self, events):
        futures = []
        for event in events:
            future = self.producer.send(
                topic='counter-events',
                value=event,
                key=event['entity_id']
            )
            futures.append(future)
        return futures
```

### Counter Consumer

```python
from kafka import KafkaConsumer
import json

class CounterEventConsumer:
    def __init__(self, counter_processor):
        self.consumer = KafkaConsumer(
            'counter-events',
            bootstrap_servers=['kafka1:9092', 'kafka2:9092', 'kafka3:9092'],
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            group_id='counter-processor',
            auto_offset_reset='latest'
        )
        self.processor = counter_processor

    def start_consuming(self):
        for message in self.consumer:
            try:
                self.processor.process_event(message.value)
                # Commit offset after processing
                self.consumer.commit()
            except Exception as e:
                print(f"Error processing event: {e}")
                # Move to dead-letter queue
                self.consumer.commit()

class CounterProcessor:
    def __init__(self, redis, db):
        self.redis = redis
        self.db = db

    def process_event(self, event):
        entity_type = event['entity_type']
        entity_id = event['entity_id']
        counter_type = event['counter_type']

        # Update fast counter in Redis
        counter_key = f"counter:{entity_type}:{entity_id}:{counter_type}"
        self.redis.incr(counter_key)

        # Batch update to database
        self._queue_database_update(entity_type, entity_id, counter_type)

    def _queue_database_update(self, entity_type, entity_id, counter_type):
        # Queue for batch processing
        queue_key = f"counter:db_queue"
        self.redis.rpush(queue_key, json.dumps({
            'entity_type': entity_type,
            'entity_id': entity_id,
            'counter_type': counter_type
        }))
```

---

## Batch Database Update

```python
import psycopg2
import redis
import json

class DatabaseUpdater:
    def __init__(self, redis, db_config):
        self.redis = redis
        self.db = psycopg2.connect(**db_config)

    def process_batch_updates(self):
        queue_key = f"counter:db_queue"

        # Get batch of updates
        batch_size = 100
        updates = self.redis.lrange(queue_key, 0, batch_size - 1)

        if not updates:
            return

        # Parse updates
        parsed_updates = [json.loads(u) for u in updates]

        # Group by counter
        counter_aggregates = {}
        for update in parsed_updates:
            key = f"{update['entity_type']}:{update['entity_id']}:{update['counter_type']}"
            if key not in counter_aggregates:
                counter_aggregates[key] = []
            counter_aggregates[key].append(update)

        # Update database in batch
        with self.db.cursor() as cursor:
            for key, updates_list in counter_aggregates.items():
                # Get latest values from Redis
                counter_key = f"counter:{key}"
                final_value = int(self.redis.get(counter_key))

                # Upsert counter
                entity_type, entity_id, counter_type = key.split(':')

                cursor.execute("""
                    INSERT INTO counters (entity_type, entity_id, counter_type, value, updated_at)
                    VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (entity_type, entity_id, counter_type)
                    DO UPDATE SET value = %s, updated_at = CURRENT_TIMESTAMP
                """, (entity_type, entity_id, counter_type, final_value))

            self.db.commit()

        # Remove processed updates from queue
        self.redis.ltrim(queue_key, len(updates), -1)
```

---

## Time Series Data

### InfluxDB Schema

```
Measurement: counter_events

Tags:
  - entity_type: "post"
  - entity_id: "123"
  - counter_type: "likes"

Fields:
  - value: 150
  - delta: 1

Time: timestamp
```

### Time Series Query

```python
from influxdb_client import InfluxDBClient

class TimeSeriesCounter:
    def __init__(self):
        self.client = InfluxDBClient(host='localhost', port=8086)
        self.org = 'counters'
        self.bucket = 'metrics'

    def write_counter_event(self, event):
        point = {
            "measurement": "counter_events",
            "tags": {
                "entity_type": event['entity_type'],
                "entity_id": str(event['entity_id']),
                "counter_type": event['counter_type']
            },
            "fields": {
                "value": 1,
                "delta": event.get('delta', 1)
            },
            "time": event['timestamp']
        }
        self.client.write_points([point])

    def get_counter_history(self, entity_type, entity_id, counter_type, time_range='1h'):
        query = f"""
            SELECT mean(value), max(value)
            FROM counter_events
            WHERE entity_type = '{entity_type}'
              AND entity_id = '{entity_id}'
              AND counter_type = '{counter_type}'
              AND time > now() - {time_range}
            GROUP BY time(1m)
        """
        result = self.client.query(query)

        data_points = []
        for point in result.get_points():
            data_points.append({
                'timestamp': point['time'],
                'value': point['mean'],
                'max': point['max']
            })

        return data_points
```

---

## API Design

### Counter API

```yaml
# Increment counter
POST /api/v1/counters/increment
Request:
  {
    "entity_type": "post",
    "entity_id": 123,
    "counter_type": "likes",
    "user_id": 456,
    "request_id": "unique_request_id"
  }
Response:
  {
    "success": true,
    "count": 150,
    "timestamp": "2025-02-15T10:00:00Z"
  }

# Get counter
GET /api/v1/counters/{entity_type}/{entity_id}/{counter_type}
Response:
  {
    "entity_type": "post",
    "entity_id": 123,
    "counter_type": "likes",
    "count": 150,
    "updated_at": "2025-02-15T10:00:00Z"
  }

# Get multiple counters
POST /api/v1/counters/batch
Request:
  {
    "counters": [
      {"entity_type": "post", "entity_id": 123, "counter_type": "likes"},
      {"entity_type": "post", "entity_id": 123, "counter_type": "views"},
      {"entity_type": "profile", "entity_id": 456, "counter_type": "views"}
    ]
  }
Response:
  {
    "counters": [
      {"entity_type": "post", "entity_id": 123, "counter_type": "likes", "count": 150},
      {"entity_type": "post", "entity_id": 123, "counter_type": "views", "count": 5000},
      {"entity_type": "profile", "entity_id": 456, "counter_type": "views", "count": 250}
    ]
  }

# Get counter history
GET /api/v1/counters/{entity_type}/{entity_id}/{counter_type}/history
Query Params:
  - range: 1h (optional, default 24h)
  - granularity: 1m (optional, default 1h)
Response:
  {
    "history": [
      {"timestamp": "2025-02-15T09:00:00Z", "value": 145},
      {"timestamp": "2025-02-15T10:00:00Z", "value": 150}
    ]
  }

# Get leaderboard
GET /api/v1/counters/{entity_type}/{entity_id}/{counter_type}/leaderboard
Query Params:
  - top_n: 10 (optional, default 20)
Response:
  {
    "leaderboard": [
      {"rank": 1, "user_id": 789, "score": 50},
      {"rank": 2, "user_id": 123, "score": 45},
      {"rank": 3, "user_id": 456, "score": 30}
    ]
  }
```

---

## Rate Limiting

### Redis Rate Limiter

```python
from redis import Redis

class CounterRateLimiter:
    def __init__(self):
        self.redis = Redis()

    def check_and_increment(
        self,
        entity_type: str,
        entity_id: int,
        counter_type: str,
        user_id: int,
        limit: int = 100,
        window: int = 60
    ):
        # User-specific key
        user_key = f"ratelimit:counter:{entity_type}:{entity_id}:{counter_type}:{user_id}"

        # Get current count
        current = self.redis.incr(user_key)

        if current == 1:
            # Set expiration
            self.redis.expire(user_key, window)

        if current > limit:
            return False, None

        return True, current

    def check_global_limit(
        self,
        entity_type: str,
        entity_id: int,
        counter_type: str,
        limit: int = 10000,
        window: int = 60
    ):
        # Global key for entity
        global_key = f"ratelimit:counter:global:{entity_type}:{entity_id}:{counter_type}"

        # Get current count
        current = self.redis.incr(global_key)

        if current == 1:
            # Set expiration
            self.redis.expire(global_key, window)

        if current > limit:
            return False, None

        return True, current
```

---

## Monitoring

### Key Metrics

```
Counter Metrics:
- Increments per second (by counter type)
- Operations per second (total)
- Redis operations (hits, misses, latency)
- Kafka lag (producer-consumer)
- Database batch update rate
- Time series writes per second

Performance Metrics:
- API response times (P50, P95, P99)
- Redis memory usage
- Disk I/O (database writes)
- Network bandwidth

Accuracy Metrics:
- Counter accuracy (compare Redis vs database)
- Duplicate rate (should be 0%)
- Lost increments rate
```

---

## Follow-up Questions

1. **How to handle counter resets?**
   - Soft delete (mark as reset)
   - Hard delete (set to 0)
   - Archive old counters before reset

2. **How to handle negative counts?**
   - Decrement operations
   - Minimum value is 0
   - Validation before decrement

3. **How to handle counter expiration?**
   - Auto-expire old counters
   - TTL based on last activity
   - User notification before expiration

4. **How to handle counter synchronization?**
   - Source of truth is database
   - Redis is cache/warm storage
   - Reconcile if discrepancies detected

5. **How to handle distributed transactions?**
   - Two-phase commit for cross-service counters
   - Compensation actions
   - Idempotent operations

---

## Links

- [System Design Interview Overview](overview.md)
- [Caching and Message Queues](caching-message-queues.md)
- [Design Patterns](design-patterns.md)
