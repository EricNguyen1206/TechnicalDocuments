---
title: "Design a Unique ID Generator"
date: 2025-02-15
tags: ["system-design", "distributed-id", "snowflake"]
description: "Design of distributed unique ID generation systems including Snowflake and alternatives."
author: "Eric Nguyen"
layout: "post"
---

# Design a Unique ID Generator

## Problem Statement

Design a unique ID generator system that:

- Generates globally unique IDs across multiple datacenters
- IDs are roughly sortable by time
- System can generate millions of IDs per second
- No central database bottleneck
- IDs are 64-bit integers

---

## Requirements

### Functional Requirements

1. **Generate Unique IDs**
   - No collisions across system
   - IDs should be unique indefinitely

2. **Time-Sortable**
   - IDs should be roughly ordered by generation time
   - Enables efficient indexing

3. **Distributed**
   - Multiple datacenters can generate IDs independently
   - No single point of failure

4. **High Throughput**
   - Support millions of IDs per second
   - Low latency (< 10ms)

### Non-Functional Requirements

- **Availability**: 99.99% (4.32 minutes downtime/year)
- **Scalability**: Support 10x growth
- **Durability**: Never lose or duplicate IDs

---

## ID Options

### 1. UUID (Universally Unique Identifier)

**Format:** 128-bit hexadecimal string
**Example:** `550e8400-e29b-41d4-a716-446655440000`

**Pros:**

- Globally unique
- No coordination needed
- Standard libraries available

**Cons:**

- 128 bits (larger than needed)
- Not time-ordered (random)
- Poor database indexing performance

**Code:**

```python
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# Usage
id = generate_uuid()  # "550e8400-e29b-41d4-a716-446655440000"
```

### 2. Database Auto-Increment

**Format:** Sequential integers
**Example:** `1, 2, 3, ...`

**Pros:**

- Simple
- Small (64 bits)
- Perfectly ordered

**Cons:**

- Single point of failure
- Bottleneck at write time
- Doesn't work in distributed systems

### 3. Snowflake ID (Twitter's Approach)

**Format:** 64-bit integer
**Structure:**

```
0 | 0000000000 0000000000 0000000000 0000000000 0 | 00000 | 00000 | 0000000000
  │              41 bits timestamp          │ 10 bits │ 5 bits │ 12 bits sequence
  │                                        │ machine │ datacenter│
  │                                        │  ID     │  ID     │
  │                                        │         │         │
  │                                        │         │         └─ Sequence number (resets every ms)
  │                                        │         └───────────── Machine ID (0-31)
  │                                        └───────────────────────── Datacenter ID (0-31)
  └───────────────────────────────────────────────────────────── Timestamp (ms since epoch)
```

**Pros:**

- Time-ordered
- Distributed
- No coordination
- Compact (64 bits)

**Cons:**

- Requires machine registration
- Clock synchronization required

---

## Snowflake Implementation

### ID Structure Breakdown

```
Bit layout: 1 (sign) | 41 (timestamp) | 10 (machine) | 12 (sequence)
Total: 64 bits

Timestamp: 41 bits = ~69 years (from epoch)
Machine ID: 10 bits = 1024 unique machines
Sequence: 12 bits = 4096 IDs per millisecond
```

### Python Implementation

```python
import time

class SnowflakeIDGenerator:
    def __init__(self, datacenter_id, machine_id):
        self.datacenter_id = datacenter_id  # 5 bits (0-31)
        self.machine_id = machine_id        # 5 bits (0-31)
        self.sequence = 0                   # 12 bits (0-4095)
        self.last_timestamp = -1            # Last timestamp in ms
        self.epoch = 1609459200000         # Custom epoch (2021-01-01)

    def generate_id(self):
        timestamp = int(time.time() * 1000) - self.epoch

        if timestamp == self.last_timestamp:
            # Same millisecond: increment sequence
            self.sequence = (self.sequence + 1) & 0xFFF
            if self.sequence == 0:
                # Sequence overflow: wait for next millisecond
                while timestamp <= self.last_timestamp:
                    timestamp = int(time.time() * 1000) - self.epoch
        else:
            # New millisecond: reset sequence
            self.sequence = 0

        self.last_timestamp = timestamp

        # Combine components
        # Shift and OR to create 64-bit ID
        snowflake_id = (
            (timestamp << 22) |           # 41 bits at position 22
            (self.datacenter_id << 17) |  # 5 bits at position 17
            (self.machine_id << 12) |     # 5 bits at position 12
            self.sequence                   # 12 bits at position 0
        )

        return snowflake_id

    def parse_id(self, snowflake_id):
        """Parse snowflake ID back to components"""
        sequence = snowflake_id & 0xFFF
        machine_id = (snowflake_id >> 12) & 0x1F
        datacenter_id = (snowflake_id >> 17) & 0x1F
        timestamp = (snowflake_id >> 22) & 0x1FFFFFFFFFF

        return {
            'timestamp': timestamp + self.epoch,
            'datacenter_id': datacenter_id,
            'machine_id': machine_id,
            'sequence': sequence
        }

# Usage
generator = SnowflakeIDGenerator(datacenter_id=1, machine_id=10)
id = generator.generate_id()
print(f"Generated ID: {id}")

# Parse ID
parsed = generator.parse_id(id)
print(f"Parsed: {parsed}")
```

---

## Clock Synchronization

### Problem

Different servers have slightly different clocks:

- Clock drift over time
- Network latency in NTP sync
- Manual adjustments

### Solution: Clock Synchronization

**Network Time Protocol (NTP):**

```
Server regularly syncs with NTP servers
Maintains clock within ~10ms accuracy
```

**Implementation:**

```bash
# Configure NTP
apt-get install ntp
# /etc/ntp.conf
server pool.ntp.org
server time.nist.gov

# Sync clock
ntpdate -u pool.ntp.org
```

### Handling Clock Drift

**Detection:**

```python
def handle_clock_backward(timestamp):
    if timestamp < self.last_timestamp:
        # Clock moved backward (rare)
        # Option 1: Wait for clock to catch up
        while timestamp <= self.last_timestamp:
            time.sleep(0.001)
            timestamp = int(time.time() * 1000) - self.epoch

        # Option 2: Use last timestamp + 1 (risky)
        # timestamp = self.last_timestamp + 1
```

---

## Distributed Coordination

### Machine ID Assignment

**Centralized Registry:**

```
Machine Registration Service
    ├── Register new machine
    ├── Assign unique machine ID
    └── Maintain machine catalog
```

**Implementation:**

```python
class MachineRegistry:
    def register_machine(self, datacenter_id):
        machine_id = self.generate_machine_id(datacenter_id)
        self.store_machine(datacenter_id, machine_id)
        return machine_id

    def generate_machine_id(self, datacenter_id):
        # Generate unique ID for machine in datacenter
        # Could use database counter or ZooKeeper
        pass
```

### Alternative: ZooKeeper Coordination

```python
from kazoo.client import KazooClient

class ZookeeperSnowflake:
    def __init__(self, zookeeper_hosts):
        self.zk = KazooClient(zookeeper_hosts)
        self.zk.start()

    def acquire_machine_id(self, datacenter_path):
        path = f"{datacenter_path}/machine_"
        # Create ephemeral sequential node
        result = self.zk.create(path, ephemeral=True, sequence=True)
        machine_id = int(result.split('_')[-1])
        return machine_id
```

---

## High-Throughput Optimization

### Pre-allocate ID Ranges

```
Service        ZooKeeper
    │               │
    │---Request----->
    │               │
    │<--Range------|
    │   [1000-2000]
    │               │
    └──Generate from range
```

**Implementation:**

```python
class IDRangeAllocator:
    def __init__(self, zookeeper_client):
        self.zk = zookeeper_client
        self.current_id = None
        self.max_id = None

    def allocate_range(self, size=1000):
        """Allocate a range of IDs"""
        # Get current max ID from ZooKeeper
        current_max = self.zk.get("/id_counter")[0]

        # Allocate new range
        new_max = current_max + size
        if self.zk.set("/id_counter", str(new_max), version=current_version):
            self.current_id = current_max
            self.max_id = new_max
            return True
        return False  # Conflict, retry

    def generate_id(self):
        """Generate ID from allocated range"""
        if self.current_id >= self.max_id:
            self.allocate_range()

        self.current_id += 1
        return self.current_id
```

### Batch Generation

```
Generate multiple IDs in single operation
Reduce database/coordination overhead
```

---

## Alternative: ULID (Universally Unique Lexicographically Sortable ID)

**Format:** 26-character string
**Example:** `01ARZ3NDEKTSV4RRFFQ69G5FA`

**Structure:**

```
01ARZ3NDEKTSV4RRFFQ69G5FA
││││││└┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴─ Random (80 bits)
│││└┴┴┴──────────────────────────── Time (48 bits)
│└┴───────────────────────────────── Version
└─────────────────────────────────── Timestamp
```

**Pros:**

- Time-sortable
- No coordination
- Standard format (Crockford's Base32)

**Implementation:**

```python
import ulid

def generate_ulid():
    return ulid.new()  # "01ARZ3NDEKTSV4RRFFQ69G5FA"
```

---

## Architecture

```
                    ┌─────────────┐
                    │   Client   │
                    └──────┬──────┘
                           │
                    ┌────────▼─────────┐
                    │   Load Balancer  │
                    └────────┬────────┘
                             │
        ┌────────────────────────┼────────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌──────▼─────────┐  ┌──────▼─────────┐
│   ID Service 1  │  │   ID Service 2 │  │   ID Service N │
│   (Snowflake)  │  │   (Snowflake)  │  │   (Snowflake)  │
└───────┬────────┘  └──────┬─────────┘  └──────┬─────────┘
        │                    │                    │
        │                    │                    │
┌───────▼────────────────────────────────────────▼─────────┐
│                 ZooKeeper (Coordination)                  │
│  - Machine ID registry                                 │
│  - ID range allocation                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Follow-up Questions

1. **What if clock goes backward?**
   - Wait for clock to sync
   - Use last timestamp + 1

2. **What if machine ID conflicts?**
   - Use ZooKeeper for coordination
   - Auto-assign unique IDs

3. **What about 64-bit overflow?**
   - Snowflake: ~69 years before overflow
   - Use custom epoch to extend

4. **How to handle sequence overflow?**
   - Wait for next millisecond
   - Or use higher precision timestamp (microseconds)

5. **How to ensure uniqueness across restarts?**
   - Persist sequence number
   - Start from last sequence on restart

---

## Best Practices

### 1. Use Custom Epoch

```python
# Start from 2021-01-01 instead of 1970-01-01
custom_epoch = 1609459200000
timestamp = current_time - custom_epoch
```

### 2. Machine ID Registration

- Auto-register on startup
- Store in ZooKeeper/etcd
- Handle registration conflicts

### 3. Clock Monitoring

- Monitor clock drift
- Alert on significant skew
- Regular NTP sync

### 4. Graceful Degradation

- If coordination fails, use timestamp + random
- Better than crashing
- Accept slight disorder

---

## Links

- [System Design Interview Overview](overview.md)
- [Distributed Systems](distributed-systems.md)
- [TinyURL Design](tinyurl-design.md)
