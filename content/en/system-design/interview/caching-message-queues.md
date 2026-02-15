---
title: "Caching and Message Queues"
date: 2025-02-15
tags: ["system-design", "caching", "message-queue", "kafka"]
description: "Comprehensive guide to caching strategies and message queue patterns in distributed systems."
author: "Eric Nguyen"
layout: "post"
---

# Caching and Message Queues

## Caching

### What is Caching?

Caching stores frequently accessed data in fast storage (memory) to reduce latency and load on slower storage (database, disk).

```
Request
    ↓
Cache? → YES → Return Data
    ↓ NO
Database → Update Cache → Return Data
```

### Cache Levels

**Level 1 Cache (L1):**

- CPU cache (on-chip)
- Fastest, smallest (KB)

**Level 2 Cache (L2):**

- CPU cache (on-chip)
- Fast, small (MB)

**Level 3 Cache (L3):**

- CPU cache (on-chip, shared)
- Slower, larger (MB)

**Application Cache:**

- Redis, Memcached
- Fast (microseconds)
- Medium size (GB)

**Database Cache:**

- Query result cache
- Buffer pool
- Slower (milliseconds)

---

## Caching Strategies

### 1. Cache Aside (Lazy Loading)

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

**Process:**

1. Application checks cache
2. If miss, query database
3. Store result in cache
4. Return data

**Pros:**

- Only cached data is loaded
- Simple to implement

**Cons:**

- Cache miss = slow database hit
- Multiple concurrent misses cause cache stampede

**Implementation:**

```python
def get_user(user_id):
    cache_key = f"user:{user_id}"

    # Check cache
    user = redis.get(cache_key)
    if user:
        return json.loads(user)

    # Cache miss: query database
    user = db.query("SELECT * FROM users WHERE id = ?", user_id)

    # Set cache
    redis.setex(cache_key, 3600, json.dumps(user))  # 1 hour TTL

    return user
```

### 2. Read Through

```
Application          Cache          Database
    |                 |               |
    |--Request------->|               |
    |                 |---Miss------->|
    |                 |<---Data------|
    |                 |               |
    |<--Data---------|               |
```

**Process:**

1. Application always reads from cache
2. Cache manages loading from database
3. Cache returns data to application

**Pros:**

- Application code simpler
- Consistent caching

**Cons:**

- Cache becomes a single point of failure
- More complex cache implementation

### 3. Write Through

```
Application          Cache          Database
    |                 |               |
    |--Write------->|               |
    |                 |---Write---->|
    |                 |               |
    |<--Ack---------|               |
    |                 |<---Ack------|
```

**Process:**

1. Application writes to cache
2. Cache writes to database
3. Both must succeed

**Pros:**

- Cache and database always in sync
- Strong consistency

**Cons:**

- Slower writes (two operations)
- Higher load on cache

**Implementation:**

```python
def update_user(user_id, data):
    cache_key = f"user:{user_id}"

    # Write to cache
    redis.setex(cache_key, 3600, json.dumps(data))

    # Write to database
    db.execute("UPDATE users SET ... WHERE id = ?", user_id)
```

### 4. Write Behind (Write Back)

```
Application          Cache          Database
    |                 |               |
    |--Write------->|               |
    |<--Ack---------|               |
    |                 |---Async Write>|
    |                 |<---Ack------|
```

**Process:**

1. Application writes to cache
2. Cache immediately acknowledges
3. Cache asynchronously writes to database

**Pros:**

- Very fast writes
- Batches database writes

**Cons:**

- Data loss if cache fails
- Complex implementation
- Eventual consistency

### 5. Refresh Ahead

```
Cache checks TTL
If expiring soon:
  Refresh from database before expiration
```

**Process:**

1. Cache monitors TTL
2. Pre-fetch data before expiration
3. Users never see cache miss

**Pros:**

- No cache misses
- Better user experience

**Cons:**

- Complexity
- May fetch unused data

---

## Cache Eviction Policies

### LRU (Least Recently Used)

```
Cache: [A, B, C, D] (max 4)
New: E
Evict: A (least recent)
Cache: [E, B, C, D]
```

**Pros:**

- Simple to implement
- Good temporal locality

**Cons:**

- Doesn't consider access frequency

### LFU (Least Frequently Used)

```
Access counts: A: 5, B: 3, C: 2, D: 1
New: E
Evict: D (least frequent)
```

**Pros:**

- Keeps popular data

**Cons:**

- Cold data problem (new data gets evicted)
- Requires tracking access count

### FIFO (First In First Out)

```
Cache: [A, B, C, D] (A inserted first)
New: E
Evict: A
Cache: [E, B, C, D]
```

**Pros:**

- Very simple

**Cons:**

- Ignores access patterns

### Random Eviction

```
Cache: [A, B, C, D]
New: E
Evict: Random (e.g., C)
Cache: [E, B, A, D]
```

**Pros:**

- Simple
- Fair distribution

**Cons:**

- May evict hot data

---

## Cache Invalidation

### Time to Live (TTL)

```
Cache data with expiration time
After TTL expires, data is automatically removed
```

**Implementation:**

```python
# Set with 1 hour TTL
redis.setex("user:123", 3600, json.dumps(user_data))

# Get
data = redis.get("user:123")
```

### Event-based Invalidation

```
User updates profile
    ↓
Update Database
    ↓
Invalidate Cache
    ↓
Cache Miss → Reload from Database
```

**Implementation:**

```python
def update_user(user_id, data):
    # Update database
    db.execute("UPDATE users SET ...", data)

    # Invalidate cache
    cache_key = f"user:{user_id}"
    redis.delete(cache_key)
```

### Write-through Invalidation

```
Write operation automatically updates cache
No separate invalidation needed
```

---

## Caching Best Practices

### 1. Use Appropriate TTL

- Don't cache too long (stale data)
- Don't cache too short (more misses)

### 2. Handle Cache Stampede

```
Multiple requests for same data (cache miss)
Solution: Use cache lock
```

**Implementation:**

```python
def get_user_with_lock(user_id):
    cache_key = f"user:{user_id}"
    lock_key = f"lock:{user_id}"

    # Try to get lock
    if redis.setnx(lock_key, 1, 10):  # 10 second lock
        try:
            user = db.query("SELECT ...")
            redis.setex(cache_key, 3600, json.dumps(user))
            return user
        finally:
            redis.delete(lock_key)
    else:
        # Wait and retry
        time.sleep(0.1)
        return get_user_with_lock(user_id)
```

### 3. Monitor Cache Hit Rate

```
Hit Rate = (Cache Hits) / (Cache Hits + Cache Misses)

Good: > 80%
Acceptable: 60-80%
Poor: < 60%
```

### 4. Use Cache Compression

```
Compress large data before caching
Reduces memory usage
```

---

## Message Queues

### What is Message Queue?

Message queue is asynchronous communication service that stores messages until they are processed.

```
Producer          Message Queue          Consumer
    |                 |                  |
    |--Message------->|                  |
    |                 |---Message------->|
    |                 |                  |
    |--Message------->|                  |
    |                 |---Message------->|
```

### Why Use Message Queues?

**Decoupling:**

- Services don't need to know about each other
- Producer doesn't wait for consumer

**Asynchronous Processing:**

- Long-running tasks don't block user requests
- Background processing

**Reliability:**

- Messages persist even if consumer is down
- Retry mechanisms

**Scalability:**

- Add more consumers easily
- Handle spikes in traffic

---

## Message Queue Patterns

### 1. Publish-Subscribe (Pub/Sub)

```
Publisher          Exchange          Subscribers
    |                 |                  |
    |--Message------->|                  |
    |                 |---Message1----->| Sub 1
    |                 |---Message2----->| Sub 2
    |                 |---Message3----->| Sub 3
```

**Use Cases:**

- Notifications
- Event broadcasting
- Fan-out scenarios

**Implementation (Redis Pub/Sub):**

```python
# Publisher
import redis
r = redis.Redis()
r.publish('channel_name', 'message_data')

# Subscriber
pubsub = r.pubsub()
pubsub.subscribe('channel_name')
for message in pubsub.listen():
    if message['type'] == 'message':
        print(message['data'])
```

### 2. Work Queue (Task Queue)

```
Producer          Queue          Workers
    |                 |               |
    |--Task1--------->|               |
    |--Task2--------->|---Task1----->| Worker 1
    |--Task3--------->|---Task2----->| Worker 2
    |                 |---Task3----->| Worker 3
```

**Use Cases:**

- Email sending
- Image processing
- Video transcoding

**Implementation (Redis Queue):**

```python
import redis
r = redis.Redis()

# Producer: Add task
r.rpush('task_queue', json.dumps({'task': 'send_email', 'to': 'user@example.com'}))

# Worker: Get task
while True:
    task_json = r.blpop('task_queue', timeout=5)
    if task_json:
        task = json.loads(task_json[1])
        process_task(task)
```

### 3. Priority Queue

```
Tasks with priorities
High priority tasks processed first
```

**Implementation:**

```python
# Add with priority
r.zadd('priority_queue', {'task1': 10, 'task2': 1})

# Get highest priority (lowest score)
task = r.zpopmin('priority_queue')
```

### 4. Delayed Queue

```
Tasks executed after delay
```

**Implementation:**

```python
# Add task with delay
r.zadd('delayed_queue', {task_json: execution_time})

# Worker checks for ready tasks
now = time.time()
ready_tasks = r.zrangebyscore('delayed_queue', 0, now)
for task in ready_tasks:
    process_task(task)
```

---

## Message Queue Technologies

### RabbitMQ

**Features:**

- AMQP protocol
- Flexible routing
- Message acknowledgments
- Message persistence

**Use Cases:**

- Complex routing
- Reliable delivery
- Enterprise applications

**Basic Example:**

```python
import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# Producer
channel.basic_publish(
    exchange='',
    routing_key='task_queue',
    body=json.dumps({'task': 'process_order'})
)

# Consumer
def callback(ch, method, properties, body):
    task = json.loads(body)
    process_task(task)
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue='task_queue', on_message_callback=callback)
channel.start_consuming()
```

### Kafka

**Features:**

- Distributed log
- High throughput
- Stream processing
- Partitioning

**Use Cases:**

- Event streaming
- Log aggregation
- Real-time analytics

**Basic Example:**

```python
from kafka import KafkaProducer, KafkaConsumer

# Producer
producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)
producer.send('orders', {'order_id': 123, 'amount': 100})

# Consumer
consumer = KafkaConsumer(
    'orders',
    bootstrap_servers=['localhost:9092'],
    value_deserializer=lambda m: json.loads(m.decode('utf-8'))
)
for message in consumer:
    process_order(message.value)
```

### Redis

**Features:**

- In-memory
- Fast and simple
- Pub/Sub, Lists, Sorted Sets

**Use Cases:**

- Simple task queues
- Real-time pub/sub
- Caching

### AWS SQS

**Features:**

- Fully managed
- Auto-scaling
- At-least-once delivery

**Use Cases:**

- AWS ecosystem
- Decoupled services

---

## Message Guarantees

### At-Most-Once

- Messages may be lost
- Never delivered twice
- Fast but unreliable

### At-Least-Once

- Messages never lost
- May be delivered multiple times
- Requires idempotent consumers

### Exactly-Once

- Messages delivered exactly once
- Most difficult to implement
- Kafka with transactions

---

## Links

- [System Design Interview Overview](overview.md)
- [Distributed Systems](distributed-systems.md)
- [SQL vs NoSQL](sql-vs-nosql.md)
