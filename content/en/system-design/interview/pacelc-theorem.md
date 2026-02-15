---
title: "PACELC Theorem and Consistency Models"
date: 2025-02-15
tags: ["system-design", "pacelc", "consistency", "distributed-systems"]
description: "Deep dive into PACELC theorem, consistency models, and their trade-offs in distributed systems."
author: "Eric Nguyen"
layout: "post"
---

# PACELC Theorem and Consistency Models

## PACELC Theorem

### Statement

In a distributed data store, it's impossible to simultaneously guarantee all three of the following properties:

- **C** - Consistency: Every read receives the most recent write or an error
- **A** - Availability: Every request receives a (success or failure) response, without guaranteeing it contains the most recent write
- **P** - Partition Tolerance: System continues operating despite network partitions (nodes can't communicate)

### Trade-off

You can only have **2 out of 3** guarantees simultaneously.

---

## PACELC Examples

### 1. CA - Consistent + Available (No Partition Tolerance)

**Characteristics:**

- Strong consistency
- High availability
- No partition tolerance

**Use Cases:**

- Single-node databases
- Traditional RDBMS with synchronous replication to secondary
- Small-scale systems where partition is unlikely

**Example:**

```
┌──────────┐
│   Primary   │
└──────┬────┘
       │
       ├─→ Replica 1
       ├─→ Replica 2
       └─→ Replica 3

No network partition → All operations work normally
Network partition → System fails (cannot tolerate)
```

**Trade-offs:**

- Single point of failure
- Not suitable for distributed systems

---

### 2. CP - Consistent + Partition Tolerant (No Availability During Partition)

**Characteristics:**

- Strong consistency
- Available during partitions (but may be slow)
- NOT available during partitions (rejects or timeouts)

**Use Cases:**

- Distributed databases with strong consistency requirements
- Banking systems
- Inventory management
- Payment processing

**Example:**

```
┌────────────────────────┐
│   Primary Node 1  │
└──────┬───────────────┘
       │
       ├─→ Replica 1
       ├─→ Replica 2
       └─→ Replica 3
       │
       │
┌────────────────┐
│   Secondary  │
└─────────┬─────────┘
          │
          ├─→ Replica 1
          └─ → Replica 2

Network partition between primary and secondary:

Primary: CONTINUES accepting writes
Secondary: STOPS accepting reads (outdated data)

When partition resolves:
- Secondary catches up with primary
- System becomes fully available again
```

**Trade-offs:**

- Downtime during partitions
- Poor user experience during outages
- Slow failover

---

### 3. AP - Available + Partition Tolerant (Eventual Consistency)

**Characteristics:**

- High availability
- Continues operating during partitions
- Eventual consistency (data may be stale temporarily)
- No strong consistency

**Use Cases:**

- Social media feeds
- Shopping carts
- Content delivery networks
- Real-time analytics

**Example:**

```
┌────────────────────────┐
│   Node 1  │
├─→ [A, B, C] │
│            │
│            ├─→ [A, B]  │
│            │
└─────────────┘
       │
       │
┌──────────────┐
│   Node 2  │
├─→ [A, B, C] │
│            │
│            ├─→ [A, B,  │
└─────────────┘

Network partition between Node 1 and Node 2:

Node 1: CONTINUES accepting reads/writes
Node 2: CONTINUES accepting reads/writes

User writes to Node 1:
- Update: Node 1: [A, B, C]
- Node 2: [A, B, C] (eventually consistent)

When partition resolves:
- Both nodes have same data (eventually)
```

**Trade-offs:**

- Users may see stale data
- Conflict resolution needed
- Not suitable for banking or payment systems

---

## CAP in Practice

### CAP Theorem Limitations

1. **In Networks Without Partitions:**
   - You can have all three (C, A, P)
   - CAP doesn't force trade-offs
   - But partitions are inevitable in distributed systems

2. **Time Dimension:**
   - CAP is about network partitions in space
   - Not about network latency or node failures
   - Consider temporal consistency models

3. **Partition Definition:**
   - Total partition: No communication possible
   - Partial partition: Some nodes can communicate
   - CAP assumes worst case (total partition)

### Real-World CAP

```
Most systems:
├── "AP" most of the time (available, eventual consistency)
├── "CP" when needed for strong consistency (partitions, failover)
├── "CA" for single-node or small deployments
```

---

## Consistency Models

### 1. Strong Consistency

**Definition:**
Every read receives the most recent write or an error.

**Characteristics:**

- No stale data
- No conflicting reads
- Higher latency (coordination overhead)

**Implementation:**

- Two-Phase Commit (2PC)
- Raft (strict consistency)
- Synchronous replication

**Pros:**

- Data accuracy guaranteed
- Simplified application logic

**Cons:**

- Higher latency
- Lower availability (blocking writes)
- Complex implementation

**Use Cases:**

- Banking transactions
- Inventory management
- Payment processing
- Auction bidding

---

### 2. Eventual Consistency

**Definition:**
System guarantees that if no new updates are made, eventually all accesses will return the last updated value.

**Characteristics:**

- May return stale data temporarily
- No data loss
- Better performance than strong consistency

**Implementation:**

- Asynchronous replication
- Conflict-free replicated data types (CRDTs)
- Version vectors
- Write-behind caching

**Pros:**

- Higher availability
- Lower latency
- Better performance

**Cons:**

- Stale data possible
- Complex conflict resolution
- Not suitable for all use cases

**Use Cases:**

- Social media feeds
- User profiles
- Product catalogs
- Comment systems
- Analytics dashboards

**Example:**

```javascript
// User posts on Facebook
// Node A (East Coast)
await write_to_node_a("New post!") // 10ms after write

// User reads post on Node B (West Coast)
await read_from_node_b("post_id") // 100ms after write (stale data)

// After replication completes (2 seconds)
// User reads post on Node B (West Coast)
await read_from_node_b("post_id") // Fresh data
```

**Timeline:**

```
T0: User writes post to Node A
T0+10ms: User reads from Node A → Fresh data
T0+100ms: User reads from Node B → Stale data (Node B not synced yet)
T0+2s: Node B receives write → Fresh data
```

---

### 3. Causal Consistency

**Definition:**
If process B has causally related to process A, any process that has seen the effects of A will also see the effects of B.

**Characteristics:**

- Guarantees causal relationships
- Allows for stale data outside causal chain
- No conflicting causally-related data

**Implementation:**

- Vector clocks
- Logical timestamps
- Causal ordering

**Pros:**

- Better performance than strong consistency
- Preserves causal ordering
- Good for many use cases

**Cons:**

- Complex to implement
- Requires causal tracking
- Can be confusing for developers

**Use Cases:**

- Chat applications (message ordering)
- Social feeds (timeline ordering)
- Notification systems
- Shopping cart (session affinity)

**Example:**

```python
class VectorClock:
    def __init__(self):
        self.clock = {}

    def increment(self, key: str):
        self.clock[key] = self.clock.get(key, 0) + 1
        return self.clock

    def compare(self, other: dict) -> str:
        """
        Returns 'concurrent', 'happens-before', 'happens-after', 'conflict'
        """
        all_keys = set(self.clock.keys()) | set(other.keys())

        results = []
        for key in all_keys:
            my_val = self.clock.get(key, 0)
            other_val = other.get(key, 0)

            if my_val == other_val:
                results.append('concurrent')
            elif my_val < other_val:
                results.append('happens-before')
            else:
                results.append('happens-after')

        if all(r != 'conflict' for r in results):
            return results[0]
        return 'conflict'

# Usage
clock1 = VectorClock()
clock2 = VectorClock()

clock1.increment('x')
clock1.increment('y')

clock2.increment('x')

print(clock1.compare(clock2.clock))  # 'happens-before'
```

---

### 4. Read Your Writes

**Definition:**
Client always reads from the same leader/writer.

**Characteristics:**

- Strong consistency for single entity
- Simple to implement
- No read-your-write conflicts

**Implementation:**

- Sticky sessions (route all requests for user to same server)
- Database-level locking

**Pros:**

- Simple to understand
- No conflicts for same user
- Predictable behavior

**Cons:**

- Requires session management
- Load may be uneven
- Not suitable for distributed reads

**Use Cases:**

- User profile updates
- Shopping cart (same user)
- Draft documents (auto-save)
- Personal settings

---

### 5. Session Consistency

**Definition:**
All reads within a session see writes from that session in order.

**Characteristics:**

- Maintains consistency within session
- Different sessions may have different views

**Implementation:**

- Version vectors with session ID
- Session-based routing

**Pros:**

- Good for user-specific data
- Simple mental model

**Cons:**

- Complex for multi-user operations
- May be confusing for some operations

**Use Cases:**

- Web browsing sessions
- Document editing (Google Docs style)
- Form submissions
- Multi-step workflows

---

### 6. Monotonic Reads

**Definition:**
Within a session, reads see data in non-decreasing order of writes.

**Characteristics:**

- Clients never go back in time
- Simplifies caching

**Implementation:**

- Version numbers per session
- Version vectors
- Server tracks read/write points

**Pros:**

- Predictable for clients
- Better caching
- Easy to implement

**Cons:**

- Conflicts still possible across sessions
- May require waiting for newer data

**Use Cases:**

- Feeds and timelines
- Audit logs
- Chat history
- Activity logs

---

### 7. Write Skew

**Definition:**
In any execution, the system presents all writes as if they happened in a single serial order.

**Characteristics:**

- Consistent ordering across all writes
- Can reorder writes before committing
- Better performance

**Implementation:**

- Sequence numbers
- Timestamp ordering
- Write buffers

**Pros:**

- Consistent view across system
- Better performance for batch writes
- Simplifies debugging

**Cons:**

- Complex to implement
- May delay writes
- Requires conflict resolution

**Use Cases:**

- Document versioning (Google Docs)
- Chat message ordering
- Comment threads
- Event logs

---

## Consistency vs Availability Trade-offs

### Strong vs Eventual

| Aspect        | Strong            | Eventual            |
| ------------- | ----------------- | ------------------- |
| Data Accuracy | Always correct    | May be stale        |
| Latency       | Higher            | Lower               |
| Availability  | Lower             | Higher              |
| Complexity    | Lower             | Higher              |
| Use Cases     | Banking, Payments | Social Media, Feeds |

### Tuning Consistency

```
Read-your-write + Causal:
- Strong for user's own data
- Eventual for others

Session + Monotonic:
- Consistent within session
- May be stale across sessions

Write skew + Eventual:
- Ordering across all writes
- Eventual consistency for reads
```

---

## Real-World Examples

### 1. Database Systems

**PostgreSQL (CP)**

- Strong consistency
- Synchronous replication
- Partition handling: Failover, downtime

**MongoDB (AP)**

- Default: Eventual consistency
- Sharding by shard key
- Partition handling: Continue serving from available shards

**Cassandra (AP)**

- Eventual consistency
- Tunable consistency level per query
- Partition handling: Continue serving from available replicas

### 2. Caching Systems

**Redis Cache (AP)**

- Single instance: Strong consistency
- Cluster with replication: Eventual consistency
- High availability for reads

**Memcached (AP)**

- Eventual consistency
- Partition handling: Data loss possible

### 3. Messaging Systems

**Kafka (AP)**

- Eventual consistency
- Ordering within partition
- Exactly-once semantics per partition

**RabbitMQ (CA)**

- Can be configured as CP or AP
- Consistent queues with acknowledgment

---

## Consistency Patterns

### Read Repair

```
Client reads stale data
    ↓
Detect stale version (via version number)
    ↓
Request fresh data from server
    ↓
Update client cache
```

### Write Repair

```
Server receives conflicting writes
    ↓
Detect conflict (via version comparison)
    ↓
Merge or choose winner
    ↓
Send repaired data to clients
```

### Quorum Reads

```
Client reads from N replicas
    ↓
Wait for majority (N/2 + 1) replicas to respond
    ↓
Use latest version
```

### Hinted Handoff

```
Client A has stale data
    ↓
Requests from Client B (has fresh data)
    ↓
Server: Redirect to Client B's replica
    ↓
Client A fetches fresh data
```

---

## PACELC Extensions

### PACELC with Failure Detection

```
In addition to CAP:
- F - Failure detection: System can detect when partition ends
- E - Escape: System can switch between CAP properties
```

Example:

- Normal operation: CA (consistent + available)
- Partition detected: Switch to CP (consistent only, no availability)
- Partition resolved: Return to CA

### PACELC with Latency

```
In addition to CAP:
- L - Latency: System guarantees response time bound
```

Example:

- Normal operation: AP (available + partition tolerant)
- High load: Switch to CP to meet latency requirement

### PACELC with Network

```
In addition to CAP:
- N - Network: Network reliability (partition probability)
```

Example:

- Network reliable: CA (consistent + available)
- Unreliable network: CP (tolerate partitions)

---

## Monitoring Consistency

### Metrics to Track

```
Consistency Metrics:
- Data staleness (how old is cached data)
- Conflict rate (how often do conflicts occur)
- Replication lag (time to sync replicas)
- Error rate (conflict resolution failures)

Availability Metrics:
- Uptime percentage
- Partition detection rate
- Failover time (time to recover from partition)
- Response time (P50, P95, P99)
```

---

## Choosing Consistency Model

### Decision Framework

```
1. Data criticality?
   ├─ Critical → Strong consistency
   └─ Less critical → Eventual consistency

2. Performance requirements?
   ├─ Low latency required → Eventual consistency
   └─ Can tolerate higher latency → Strong consistency

3. Availability requirements?
   ├─ High availability → Eventual consistency
   └─ Can tolerate downtime → Strong consistency during partitions

4. User expectations?
   ├─ Expects real-time → Eventual consistency
   └─ Accepts slight delays → Strong consistency

5. Conflict tolerance?
   ├─ Cannot tolerate → Strong consistency
   └─ Can handle conflicts → Eventual with conflict resolution
```

### Examples

**Banking:**

```
Critical data + no conflict tolerance + can tolerate slight downtime
→ CP (Strong consistency during partitions)

Result: 99.9% uptime, <10s failover time
```

**Social Media:**

```
Non-critical + high availability required + real-time expected
→ AP (Eventual consistency)

Result: 99.99% uptime, <100ms latency
```

**E-commerce:**

```
Inventory: Critical, no conflict tolerance
→ Strong consistency (synchronous)

Shopping cart: User-specific, needs availability
→ Read-your-write (sticky sessions)

Product catalog: Less critical, needs availability
→ Eventual consistency
```

---

## Follow-up Questions

1. **How to handle migration from AP to CP?**
   - Data migration scripts
   - Downtime window
   - Gradual cutover

2. **How to handle split-brain scenarios?**
   - Use multi-region deployment
   - Per-region consistency (each region is CP)
   - Global eventual consistency

3. **How to test consistency?**
   - Write chaos tests
   - Simulate network partitions
   - Measure replication lag
   - Test conflict resolution

4. **How to debug stale data issues?**
   - Log version numbers
   - Track replication lag
   - Monitor conflict rates
   - Add request tracing

5. **How to communicate consistency to users?**
   - Document expected consistency behavior
   - Show freshness indicators (e.g., "Last updated 5 min ago")
   - Show refresh options for stale data

---

## Links

- [System Design Interview Overview](overview.md)
- [Distributed Systems Fundamentals](distributed-systems.md)
- [Trade-offs in System Design](trade-offs.md)
- [Leader Election & Consensus](leader-election-consensus.md)
