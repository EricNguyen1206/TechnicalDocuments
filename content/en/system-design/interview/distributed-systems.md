---
title: "Distributed Systems Fundamentals"
date: 2025-02-15
tags: ["system-design", "distributed-systems", "interview"]
description: "Core concepts of distributed systems including CAP theorem, consistency models, and common patterns."
author: "Eric Nguyen"
layout: "post"
---

# Distributed Systems Fundamentals

## What is a Distributed System?

A distributed system is a collection of independent computers that appears to users as a single coherent system. These systems are necessary when:

- **Scale exceeds single machine capacity**
- **High availability is required**
- **Low latency is needed globally**
- **Data needs to be replicated across regions**

---

## CAP Theorem

In a distributed data store, you can only have **2 out of 3** guarantees:

### C - Consistency

All nodes see the same data at the same time.

- **Strong Consistency**: Every read receives the most recent write
- **Example**: Banking systems (cannot show different balances)

### A - Availability

Every request receives a response (success or failure), without guarantee that it contains the most recent write.

- **High Availability**: System always responds, even if data is stale
- **Example**: Social media feeds (can show slightly old posts)

### P - Partition Tolerance

The system continues to operate despite network partitions (communication failures between nodes).

### Trade-offs

| System Type | Consistency | Availability | Use Cases                    |
| ----------- | ----------- | ------------ | ---------------------------- |
| CA          | High        | High         | Single-node DB, RDBMS        |
| CP          | High        | Low          | Banking, Payment systems     |
| AP          | Low         | High         | Social media, Shopping carts |

### Example Scenarios

**CP System (MongoDB default)**

- Network partition: Choose consistency, reject writes
- Use: Banking, Inventory management

**AP System (Cassandra, DynamoDB)**

- Network partition: Choose availability, accept stale data
- Use: Social feeds, Analytics

---

## Consistency Models

### Strong Consistency

- Reads always return the most recent write
- Implemented via: Two-phase commit, Paxos, Raft
- **Pro**: No stale data
- **Con**: High latency, lower availability

### Eventual Consistency

- System guarantees that if no new updates, eventually all accesses will return the last updated value
- **Pro**: High availability, low latency
- **Con**: May read stale data

### Example: Eventual Consistency

```
User posts on Facebook
├── East Coast DB: Update (10ms)
├── West Coast DB: Update (100ms)
└── User in West: Sees post after 100ms
```

---

## Replication Strategies

### Master-Slave (Primary-Replica)

```
Write → Master → Replicas
Read  → Master or Replicas
```

**Pros:**

- Simple to implement
- Read scalability

**Cons:**

- Write bottleneck at master
- Data delay to replicas

**Use:**

- Read-heavy workloads
- Analytics systems

### Multi-Master

```
Write → Master1 or Master2
Read  → Master1 or Master2
```

**Pros:**

- Write scalability
- High availability

**Cons:**

- Conflict resolution complexity
- Consistency challenges

**Use:**

- Multi-region systems
- High-write workloads

### Leaderless

```
Write → Any node
Read  → Quorum of nodes
```

**Pros:**

- No single point of failure
- High availability

**Cons:**

- Complex read/write logic
- Higher latency

**Use:**

- DynamoDB, Cassandra
- Critical availability systems

---

## Sharding (Horizontal Partitioning)

### What is Sharding?

Splitting data across multiple databases/servers.

### Sharding Strategies

#### 1. Horizontal Sharding by Key

```sql
-- Shard by user_id modulo 4
shard_number = user_id % 4

-- Shard by region
shard = user_region
```

**Pros:**

- Even distribution
- Simple queries

**Cons:**

- Rebalancing complexity
- Hotspot risk

#### 2. Range-based Sharding

```sql
-- Shard by user_id range
shard1: user_id 1-1000000
shard2: user_id 1000001-2000000
```

**Pros:**

- Efficient range queries
- Simple to understand

**Cons:**

- Uneven distribution
- Complex rebalancing

#### 3. Directory-based Sharding

```
Lookup Service → Maps keys to shards
Application → Query lookup service
```

**Pros:**

- Flexible
- Easy rebalancing

**Cons:**

- Single point of failure
- Extra lookup step

---

## Communication Patterns

### Synchronous Communication

```
Client → Service A → Service B
         ← Response ← Response
```

**Pros:**

- Simple error handling
- Immediate feedback

**Cons:**

- Tight coupling
- Blocking operations

**Use:**

- Queries requiring immediate response
- Request-response patterns

### Asynchronous Communication

```
Client → Service A → Message Queue → Service B
         ← Acknowledged
```

**Pros:**

- Loose coupling
- Better resilience
- Better scalability

**Cons:**

- Complex error handling
- No immediate response

**Use:**

- Background processing
- Event-driven systems
- High-throughput operations

---

## Data Partitioning Examples

### Social Media (Twitter-like)

**User Partitioning:**

```
Partition by user_id
Shard1: users 1-1000
Shard2: users 1001-2000
```

**Timeline Partitioning:**

```
Each user has their own timeline partition
User 123's timeline → timeline_123
```

### E-commerce (Amazon-like)

**Product Catalog:**

```
Partition by product_category
Shard1: Electronics
Shard2: Books
Shard3: Clothing
```

**Orders:**

```
Partition by order_date + user_id
Composite key for even distribution
```

---

## Consensus Algorithms

### Paxos

- Solves consensus in asynchronous networks
- Complex to implement
- Used in: Google Chubby, etcd

### Raft

- Simpler than Paxos
- Leader election + log replication
- Used in: etcd, Consul

### Two-Phase Commit (2PC)

- Ensures atomic transactions across distributed databases
- Coordinator → Participants → Vote → Commit/Abort
- Blocking protocol

### Three-Phase Commit (3PC)

- Non-blocking variant of 2PC
- Adds pre-commit phase
- Better fault tolerance

---

## Failure Detection

### Heartbeats

- Nodes send periodic heartbeats
- Failure detected after missed heartbeats
- Simple but can have false positives

### Phi Accrual Failure Detector

- Monitors heartbeat history
- Calculates probability of failure
- Used in: Cassandra, Akka

---

## Common Distributed System Patterns

### Circuit Breaker

```
Normal → Open (failures > threshold) → Half-Open → Closed
```

- Prevents cascading failures
- Used in: Hystrix, Resilience4j

### Bulkhead

```
Isolates failures to specific thread pools
```

- Prevents resource exhaustion
- Limits resource usage per service

### Saga Pattern

```
Compensating transactions instead of 2PC
```

- For distributed transactions
- Each step has compensating action

---

## Links

- [System Design Interview Overview](overview.md)
- [Load Balancing](../devops/kubernetes-basics.md)
- [SQL vs NoSQL](sql-vs-nosql.md)
