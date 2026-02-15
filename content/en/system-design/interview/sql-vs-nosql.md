---
title: "SQL vs NoSQL Databases"
date: 2025-02-15
tags: ["system-design", "database", "sql", "nosql"]
description: "Comparison of SQL and NoSQL databases, use cases, and when to use each."
author: "Eric Nguyen"
layout: "post"
---

# SQL vs NoSQL Databases

## SQL (Relational Databases)

### Characteristics

- **Structured Data**: Fixed schemas with tables and relationships
- **ACID Compliance**: Atomicity, Consistency, Isolation, Durability
- **Schema-on-Write**: Structure defined before inserting data
- **Strong Consistency**: Data always consistent
- **Vertical Scaling**: Scale up (add more resources to single server)

### SQL Databases

- **PostgreSQL**: Open-source, advanced features, JSONB support
- **MySQL/MariaDB**: Popular, web applications, good for reads
- **Oracle**: Enterprise features, expensive
- **SQL Server**: Microsoft ecosystem, enterprise

### When to Use SQL

**1. Structured Data**

- Financial transactions
- User profiles
- Inventory management
- Accounting systems

**2. Strong Consistency Required**

- Banking applications
- E-commerce orders
- Booking systems

**3. Complex Queries**

- Joins across multiple tables
- Aggregations
- Subqueries

**4. ACID Requirements**

- Transactions must be all-or-nothing
- No data corruption allowed

### SQL Example

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complex query with joins
SELECT
    u.username,
    COUNT(o.id) as order_count,
    SUM(o.amount) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.status = 'completed'
GROUP BY u.id, u.username
HAVING total_spent > 1000;
```

---

## NoSQL (Non-Relational Databases)

### Characteristics

- **Flexible Schema**: Dynamic schemas, no fixed structure
- **BASE**: Basically Available, Soft state, Eventual consistency
- **Schema-on-Read**: Structure interpreted when reading data
- **Horizontal Scaling**: Scale out (add more servers)
- **High Performance**: Optimized for specific access patterns

### Types of NoSQL

#### 1. Document Stores

**Examples:** MongoDB, CouchDB, Amazon DocumentDB

**Characteristics:**

- Store documents (JSON, BSON)
- Flexible schema
- Nested data structures

**When to Use:**

- Content management systems
- Catalogs
- User profiles with varying fields

**Example (MongoDB):**

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "username": "john_doe",
  "email": "john@example.com",
  "profile": {
    "age": 30,
    "location": "San Francisco",
    "interests": ["coding", "music", "travel"]
  },
  "social": {
    "twitter": "@johndoe",
    "github": "johndoe"
  }
}
```

#### 2. Key-Value Stores

**Examples:** Redis, Memcached, DynamoDB

**Characteristics:**

- Simple key-value pairs
- Extremely fast
- Limited query capabilities

**When to Use:**

- Caching
- Session storage
- Real-time leaderboards
- Simple lookups

**Example (Redis):**

```
SET user:123 '{"name": "John", "email": "john@example.com"}'
GET user:123
```

#### 3. Column-Family Stores

**Examples:** Cassandra, HBase, Bigtable

**Characteristics:**

- Wide-column stores
- Optimized for writes
- Partitioned by row key

**When to Use:**

- Time-series data
- Write-heavy workloads
- Large-scale analytics

**Example (Cassandra):**

```
CREATE TABLE user_activity (
    user_id UUID,
    activity_id UUID,
    activity_type TEXT,
    timestamp TIMESTAMP,
    PRIMARY KEY (user_id, timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC);
```

#### 4. Graph Databases

**Examples:** Neo4j, Amazon Neptune, ArangoDB

**Characteristics:**

- Store nodes and relationships
- Optimized for graph queries
- Social networks, fraud detection

**When to Use:**

- Social networks
- Fraud detection
- Recommendation engines
- Knowledge graphs

**Example (Neo4j):**

```
CREATE (john:User {name: "John"})
CREATE (jane:User {name: "Jane"})
CREATE (john)-[:FRIEND_OF]->(jane)

MATCH (user:User {name: "John"})-[:FRIEND_OF]->(friend)
RETURN friend
```

---

## CAP Theorem

### What is CAP?

In a distributed system, you can only have **2 out of 3**:

### C - Consistency

All nodes see the same data at the same time.

### A - Availability

Every request receives a response (success or failure).

### P - Partition Tolerance

System continues operating despite network partitions.

### CAP Trade-offs

| System | Consistency | Availability | Use Cases                    |
| ------ | ----------- | ------------ | ---------------------------- |
| CA     | High        | High         | Single-node RDBMS            |
| CP     | High        | Low          | MongoDB (default), HBase     |
| AP     | Low         | High         | Cassandra, DynamoDB, CouchDB |

---

## SQL vs NoSQL Comparison

| Aspect              | SQL                             | NoSQL                           |
| ------------------- | ------------------------------- | ------------------------------- |
| **Schema**          | Fixed, defined upfront          | Flexible, dynamic               |
| **Consistency**     | Strong                          | Eventual (usually)              |
| **Scaling**         | Vertical (scale up)             | Horizontal (scale out)          |
| **Query Language**  | SQL (standardized)              | Varied (API-specific)           |
| **Transactions**    | ACID support                    | Limited support                 |
| **Data Size**       | TB range                        | PB range                        |
| **Complex Queries** | Excellent (joins, aggregations) | Limited                         |
| **Flexibility**     | Low (schema changes are hard)   | High (schema changes are easy)  |
| **Performance**     | Good for complex queries        | Excellent for specific patterns |
| **Learning Curve**  | Standard SQL                    | varies by database              |

---

## Choosing Between SQL and NoSQL

### Choose SQL When:

1. **Data is Structured**
   - You know the schema upfront
   - Data relationships are important

2. **ACID is Required**
   - Financial transactions
   - Inventory management
   - Any system where data integrity is critical

3. **Complex Queries**
   - Need joins across multiple tables
   - Complex aggregations
   - Subqueries and nested queries

4. **Reliability Over Scalability**
   - Data accuracy is more important
   - Moderate scale (millions of rows)

### Choose NoSQL When:

1. **Data is Unstructured**
   - Varying data types
   - Frequent schema changes
   - Nested data structures

2. **High Scalability Needed**
   - Massive scale (billions of records)
   - Write-heavy workloads
   - Need horizontal scaling

3. **Rapid Development**
   - Quick iterations
   - Evolving requirements
   - Schema flexibility needed

4. **Specific Use Cases:**
   - Caching: Redis, Memcached
   - Time-series: InfluxDB, TimescaleDB
   - Graph: Neo4j
   - Documents: MongoDB
   - Wide-column: Cassandra

---

## Examples

### Use SQL: E-commerce Order System

```sql
-- Strong consistency required
-- Complex queries (reports, analytics)
-- ACID transactions (inventory, payments)

BEGIN TRANSACTION;
  UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 123;
  INSERT INTO orders (user_id, product_id, amount) VALUES (1, 123, 99.99);
  UPDATE users SET balance = balance - 99.99 WHERE id = 1;
COMMIT;
```

### Use NoSQL: Social Media Feed

```javascript
// Flexible schema (posts with different fields)
// High write throughput
// Eventual consistency acceptable

{
  "post_id": "12345",
  "user_id": "67890",
  "content": "Hello world!",
  "images": ["img1.jpg", "img2.jpg"],
  "location": {
    "lat": 37.7749,
    "lng": -122.4194
  },
  "mentions": ["@alice", "@bob"],
  "hashtags": ["#hello", "#world"]
}
```

### Use NoSQL: Real-time Analytics

```
// Time-series data
// High write volume
// Column-family store for efficiency

Cassandra table:
user_id | timestamp | metric_name | value
---------|------------|-------------|------
user123  | 1234567890 | page_view   | 1
user123  | 1234567891 | click       | 1
user456  | 1234567892 | page_view   | 1
```

---

## Hybrid Approach

### Polyglot Persistence

Use different databases for different needs:

```
Application
    ├── PostgreSQL (user data, orders, transactions)
    ├── Redis (cache, sessions, rate limiting)
    ├── MongoDB (product catalog, reviews, logs)
    └── Elasticsearch (search, analytics)
```

### Example Architecture

```
User Request
    ↓
Redis Cache (hit) → Return
    ↓ (miss)
PostgreSQL → Update Redis → Return

Write Operation
    ↓
PostgreSQL (transaction) → Invalidate Redis
    ↓
Kafka (event stream) → Analytics Service → MongoDB
```

---

## Migration Strategies

### SQL → NoSQL Migration

**Step 1: Analyze Access Patterns**

- Identify read/write patterns
- Determine query requirements

**Step 2: Design NoSQL Schema**

- Map SQL tables to NoSQL collections
- Denormalize for read performance

**Step 3: Dual-Write Period**

- Write to both SQL and NoSQL
- Verify data consistency

**Step 4: Cutover**

- Migrate historical data
- Switch reads to NoSQL
- Remove SQL writes

---

## Best Practices

### For SQL Databases

1. **Proper Indexing**
   - Index frequently queried columns
   - Use composite indexes for multi-column queries

2. **Query Optimization**
   - Use EXPLAIN ANALYZE
   - Avoid N+1 queries
   - Use appropriate JOIN types

3. **Connection Pooling**
   - PgBouncer
   - Reduce connection overhead

### For NoSQL Databases

1. **Design for Query Patterns**
   - Model data based on how it's accessed
   - Denormalize for reads

2. **Handle Consistency**
   - Implement conflict resolution
   - Use versioning or timestamps

3. **Monitor and Tune**
   - Adjust consistency levels
   - Optimize partitioning/replication

---

## Links

- [System Design Interview Overview](overview.md)
- [Distributed Systems](distributed-systems.md)
- [Caching and Message Queues](caching-message-queues.md)
