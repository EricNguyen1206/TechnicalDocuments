---
title: "Bloom Filters and Probabilistic Data Structures"
date: 2025-02-15
tags: ["system-design", "bloom-filter", "probabilistic", "data-structures"]
description: "Comprehensive guide to Bloom Filters and other probabilistic data structures for distributed systems."
author: "Eric Nguyen"
layout: "post"
---

# Bloom Filters and Probabilistic Data Structures

## What are Probabilistic Data Structures?

Probabilistic data structures sacrifice absolute accuracy for:

- **Space efficiency**: Use significantly less memory
- **Performance**: Faster operations
- **Scalability**: Better suited for distributed systems

Trade-off: **May have false positives, but never false negatives**

---

## Bloom Filter

### What is Bloom Filter?

A space-efficient probabilistic data structure that tests whether an element is a member of a set.

### Properties

- **Space efficient**: O(m) where m is bit array size
- **Fast operations**: O(k) where k is number of hash functions
- **False positives possible**: May say element exists when it doesn't
- **No false negatives**: Never says element doesn't exist when it does

### Structure

```
Bit Array: [0, 0, 0, 0, 1, 0, 1, 0, ...]
      ↑               ↑              ↑
      0               k              m-1

Hash Functions:
h1(x) → position 1
h2(x) → position 5
h3(x) → position 8
...
```

### Operations

```python
import mmh3
import numpy as np

class BloomFilter:
    def __init__(self, expected_items: int, false_positive_rate: float = 0.01):
        """
        Initialize Bloom Filter
        expected_items: Expected number of items
        false_positive_rate: Acceptable false positive rate (1%)
        """
        # Calculate optimal size and hash functions
        self.size = self._calculate_size(expected_items, false_positive_rate)
        self.hash_count = self._calculate_hash_count(self.size, expected_items)

        # Initialize bit array
        self.bit_array = np.zeros(self.size, dtype=np.uint8)

        # Generate hash functions
        self.hash_functions = self._generate_hash_functions()

    def _calculate_size(self, expected_items: int, false_positive_rate: float) -> int:
        m = -(expected_items * np.log(false_positive_rate)) / (np.log(2) ** 2)
        return int(m)

    def _calculate_hash_count(self, size: int, expected_items: int) -> int:
        k = (size / expected_items) * np.log(2)
        return int(k)

    def _generate_hash_functions(self):
        """Generate k independent hash functions"""
        return [mmh3.hash() for _ in range(self.hash_count)]

    def add(self, item: str):
        """Add item to Bloom Filter"""
        for hash_func in self.hash_functions:
            hash_val = hash_func(item)
            index = hash_val % self.size
            self.bit_array[index] = 1

    def contains(self, item: str) -> bool:
        """Check if item might be in set (may have false positive)"""
        for hash_func in self.hash_functions:
            hash_val = hash_func(item)
            index = hash_val % self.size

            if self.bit_array[index] == 0:
                # Definitely not in set
                return False

        # All positions set - likely in set
        return True

    def add_all(self, items: list):
        """Add multiple items at once"""
        for item in items:
            self.add(item)

# Usage
# Create Bloom Filter for 1M items with 1% false positive rate
bloom = BloomFilter(expected_items=1000000, false_positive_rate=0.01)

# Add items
bloom.add("user123")
bloom.add("user456")
bloom.add("post789")

# Check membership
print(bloom.contains("user123"))  # True
print(bloom.contains("user999"))  # False (definitely not in set)
print(bloom.contains("user456"))  # True (may be false positive)
```

### Scalable Bloom Filter (Redis)

```python
import redis
import mmh3

class RedisBloomFilter:
    def __init__(self, key: str, size: int, hash_count: int):
        self.redis = redis.Redis(host='localhost', port=6379, db=0)
        self.key = key
        self.size = size
        self.hash_count = hash_count
        self.hash_functions = [mmh3.hash() for _ in range(hash_count)]

    def add(self, item: str):
        """Add item to Bloom Filter in Redis"""
        for hash_func in self.hash_functions:
            hash_val = hash_func(item)
            index = hash_val % self.size
            self.redis.setbit(f"{self.key}:{index}", index, 1)

    def contains(self, item: str) -> bool:
        """Check if item might be in set"""
        for hash_func in self.hash_functions:
            hash_val = hash_func(item)
            index = hash_val % self.size

            if not self.redis.getbit(f"{self.key}:{index}", index):
                return False

        return True

    def batch_add(self, items: list):
        """Add multiple items (pipeline for efficiency)"""
        pipeline = self.redis.pipeline()

        for item in items:
            for hash_func in self.hash_functions:
                hash_val = hash_func(item)
                index = hash_val % self.size
                pipeline.setbit(f"{self.key}:{index}", index, 1)

        pipeline.execute()
```

---

## Use Cases for Bloom Filter

### 1. Username Availability Check

```python
class UsernameService:
    def __init__(self):
        self.taken_usernames = RedisBloomFilter(
            key='usernames',
            size=10000000,  # 10 million bits ~ 1.25 MB
            hash_count=10
        )
        self.db = DatabaseConnection()  # For actual check

    def check_availability(self, username: str) -> tuple[bool, bool]:
        # Quick Bloom Filter check
        if self.taken_usernames.contains(username):
            # Likely taken (may be false positive)
            # Verify with actual database
            exists_in_db = self.db.check_username(username)
            return (not exists_in_db, True)
        else:
            # Definitely available (no false negative)
            return (True, False)

# Usage
service = UsernameService()

print(service.check_availability("john_doe"))  # (True, False) - Available
print(service.check_availability("existing_user"))  # (False, False) - Likely taken
print(service.check_availability("probably_taken"))  # (True, True) - Verify needed
```

### 2. URL Shortener Deduplication

```python
class URLDeduplicator:
    def __init__(self):
        self.url_filter = RedisBloomFilter(
            key='url_dedup',
            size=50000000,  # 50M bits ~ 6.25 MB
            hash_count=7
        )

    def is_duplicate(self, long_url: str) -> bool:
        if self.url_filter.contains(long_url):
            # Likely duplicate
            return True
        return False

    def add_url(self, long_url: str):
        self.url_filter.add(long_url)

# Usage
deduplicator = URLDeduplicator()

long_url = "https://example.com/page"

if not deduplicator.is_duplicate(long_url):
    deduplicator.add_url(long_url)
    # Create short URL and store
    short_code = create_short_url(long_url)
    store_mapping(short_code, long_url)
else:
    # Return existing short code
    short_code = get_existing_short_code(long_url)
```

### 3. Content Delivery Network Cache

```python
class CDNCache:
    def __init__(self):
        self.cache_filter = RedisBloomFilter(
            key='cdn_cache',
            size=100000000,  # 100M bits ~ 12.5 MB
            hash_count=5
        )
        self.cache = RedisCache()

    def get(self, key: str):
        if self.cache_filter.contains(key):
            # Might be cached
            cached_data = self.cache.get(key)
            return cached_data
        else:
            # Definitely not cached
            return None

    def set(self, key: str, value, ttl: int = 3600):
        # Add to Bloom Filter
        self.cache_filter.add(key)

        # Store in cache
        self.cache.set(key, value, ttl)
```

### 4. Crawler URL Frontier

```python
class CrawlerFrontier:
    def __init__(self):
        self.visited_urls = RedisBloomFilter(
            key='visited_urls',
            size=1000000000,  # 1B bits ~125 MB
            hash_count=10
        )
        self.url_queue = PriorityQueue()

    def add_url(self, url: str):
        if not self.visited_urls.contains(url):
            # Not visited (no false negative)
            self.visited_urls.add(url)
            self.url_queue.put(url)

    def get_next_url(self):
        if not self.url_queue.empty():
            return self.url_queue.get()
        return None
```

### 5. Spam Email Filter

```python
class SpamFilter:
    def __init__(self):
        self.spam_emails = RedisBloomFilter(
            key='spam_emails',
            size=500000000,  # 500M bits ~62.5 MB
            hash_count=8
        )
        self.db = DatabaseConnection()

    def check_spam(self, email: str) -> tuple[bool, bool]:
        if self.spam_emails.contains(email):
            # Likely spam
            # Verify with database
            is_spam = self.db.check_spam_email(email)
            return (is_spam, True)
        else:
            # Likely not spam
            return (False, False)

    def mark_spam(self, email: str):
        self.spam_emails.add(email)
        self.db.mark_as_spam(email)
```

---

## Count-Min Sketch

### What is Count-Min Sketch?

Probabilistic data structure for counting distinct elements in a stream.

### Properties

- **Space efficient**: O(k \* m) where k = hash functions, m = size
- **Update**: O(1) per element
- **Query**: O(k) to get count
- **Accuracy**: Within error bounds with probability

### Structure

```
Count-Min Sketch (k=3, m=10):
Row 1: [0, 5, 2, 8, 1, 3, 6, 0, 4]
Row 2: [1, 3, 0, 2, 9, 4, 7, 8, 1, 5]
Row 3: [0, 2, 3, 1, 5, 7, 0, 9, 2, 4]

For item x:
  h1(x) → Row 1: position 5
  h2(x) → Row 2: position 3
  h3(x) → Row 3: position 3

Estimated count = min(2, 3, 3) = 2
```

### Implementation

```python
import mmh3
import numpy as np

class CountMinSketch:
    def __init__(self, width: int = 1000, depth: int = 5):
        """
        Initialize Count-Min Sketch
        width: Size of each row
        depth: Number of hash functions
        """
        self.width = width
        self.depth = depth
        self.counters = np.zeros((depth, width), dtype=np.uint32)
        self.hash_functions = [mmh3.hash() for _ in range(depth)]

    def add(self, item: int):
        """Add item to sketch"""
        for i in range(self.depth):
            hash_val = self.hash_functions[i](str(item))
            index = hash_val % self.width
            self.counters[i][index] += 1

    def count(self, item: int) -> int:
        """Get estimated count of item"""
        min_count = float('inf')

        for i in range(self.depth):
            hash_val = self.hash_functions[i](str(item))
            index = hash_val % self.width
            min_count = min(min_count, self.counters[i][index])

        return int(min_count)

    def merge(self, other_sketch: 'CountMinSketch'):
        """Merge two sketches by taking min values"""
        self.counters = np.minimum(self.counters, other_sketch.counters)

# Usage
sketch = CountMinSketch(width=10000, depth=5)

# Add elements (streaming)
for i in range(100000):
    sketch.add(i)

# Get count for specific element
count = sketch.count(42)  # Estimated count
print(f"Element 42 appeared approximately {count} times")

# Get distinct count estimate
total_distinct = np.min(np.sum(self.counters, axis=1))
print(f"Approximately {total_distinct} distinct elements")
```

### Use Cases

**1. Counting Unique Visitors:**

```python
class UniqueVisitorCounter:
    def __init__(self):
        self.sketch = CountMinSketch(width=100000, depth=5)

    def add_visitor(self, visitor_id: int):
        self.sketch.add(visitor_id)

    def get_unique_count(self) -> int:
        total = np.sum(np.min(self.sketch.counters, axis=1))
        return int(total)

    def get_visitor_count(self, visitor_id: int) -> int:
        return self.sketch.count(visitor_id)
```

**2. Heavy Hitters Detection:**

```python
class HeavyHitterDetector:
    def __init__(self, size=10000):
        self.sketch = CountMinSketch(width=size, depth=5)
        self.top_elements = []

    def add_element(self, element):
        self.sketch.add(element)
        # Periodically update top elements
        pass

    def get_top_elements(self, n: int) -> list:
        # Get counts for candidate elements
        # Return top n
        pass
```

---

## HyperLogLog

### What is HyperLogLog?

Probabilistic algorithm for estimating the cardinality (number of distinct elements) of very large datasets.

### Implementation

```python
import mmh3
import numpy as np

class HyperLogLog:
    def __init__(self, precision_bits: int = 12):
        """
        Initialize HyperLogLog
        precision_bits: Controls accuracy (5-18, default 12)
        """
        self.precision_bits = precision_bits
        self.registers = np.zeros(1 << precision_bits, dtype=np.uint8)
        self.hash_functions = [mmh3.hash() for _ in range(1)]

    def add(self, item):
        """Add item to HyperLogLog"""
        x = self.hash_functions[0](str(item))

        # Find leftmost 1-bit in binary representation of x + 2^63
        idx = (x >> (64 - self.precision_bits)) + 1

        # Set all bits after idx to 1
        self.registers[idx:8] = self.registers[idx:8] | 255
        self.registers[idx:8] = (self.registers[idx:8] & 127)

        # Set leading bits of idx to 1
        for i in range(7):
            if (idx & (1 << i)):
                break
            self.registers[idx + i:8] |= 1 << i

    def count(self) -> int:
        """Get estimated distinct count"""
        zero_count = np.sum(self.registers == 0)
        m = 1 << self.precision_bits

        # Apply small correction
        if zero_count != m and zero_count != 0:
            # Calculate alpha and V from zero_count
            alpha = m * np.log(m / zero_count) * (m / zero_count)
            return int((m / 2) * alpha - (alpha * alpha) / 2) * np.log2(2) / alpha))
        elif zero_count != m:
            # Calculate V and result
            V = self.registers.sum() / m
            H = self._hash_values_sum() / m
            result = int(m * V)
            return result
        else:
            return 0

    def merge(self, other_sketch: 'HyperLogLog'):
        """Merge two HyperLogLogs"""
        for i in range(len(self.registers)):
            self.registers[i] = max(self.registers[i], other_sketch.registers[i])

# Usage
hll = HyperLogLog(precision_bits=12)

# Add items
for i in range(1000000):
    hll.add(i)

# Get distinct count
distinct_count = hll.count()
print(f"Approximately {distinct_count} distinct elements")
```

---

## Probabilistic Data Structures Comparison

| Feature             | Bloom Filter    | Count-Min Sketch     | HyperLogLog  |
| ------------------- | --------------- | -------------------- | ------------ |
| **Purpose**         | Membership test | Frequency count      | Cardinality  |
| **Space**           | O(m)            | O(k \* m)            | O(m)         |
| **Update**          | O(k)            | O(k)                 | O(1)         |
| **Query**           | O(k)            | O(k)                 | O(1)         |
| **False Negatives** | No              | No                   | No           |
| **False Positives** | Yes             | No                   | No           |
| **Error**           | Controllable    | Controllable         | Controllable |
| **Main Use**        | Set membership  | Frequency estimation | Cardinality  |

---

## Real-World Examples

### 1. YouTube Video Views Counting

```
Problem: Count unique views (exclude duplicates)

Solution:
- Bloom Filter: Track video URLs seen
- Count-Min Sketch: Count unique users watching
- HyperLogLog: Estimate total unique users

Architecture:
View Event → Bloom Filter (check duplicate)
        → Count-Min Sketch (add viewer_id)
        → Database (store exact counts for verification)
```

### 2. Twitter Hashtag Tracking

```
Problem: Track trending hashtags

Solution:
- Count-Min Sketch: Real-time hashtag counts
- Bloom Filter: Check hashtag uniqueness
- Database: Store top hashtags

Data Flow:
Tweet → Extract hashtags
      → Bloom Filter (new hashtag?)
      → Count-Min Sketch (increment)
      → Top K algorithm (get trending)
```

### 3. E-commerce Search

```
Problem: Efficient product search filters

Solution:
- Bloom Filter: Pre-filter products that don't match
- Query database with remaining candidates
- Reduce database load

Query Flow:
User Search Query
    ↓
Bloom Filter (price range, category, brand)
    ↓
Filtered Products
    ↓
Full Query (with other filters)
    ↓
Results
```

---

## Tuning Bloom Filters

### Optimal Parameters

```python
import math

def calculate_optimal_parameters(expected_items: int, false_positive_rate: float):
    """
    Calculate optimal size and hash count for Bloom Filter
    """
    # Optimal size
    m = -(expected_items * math.log(false_positive_rate)) / (math.log(2) ** 2)

    # Optimal hash functions
    k = (m / expected_items) * math.log(2)

    return int(m), int(k)

# Examples
m, k = calculate_optimal_parameters(1000000, 0.01)
print(f"Optimal size: {m} bits ({m / 8 / 1024:.2f} KB)")
print(f"Optimal hash functions: {k}")

m, k = calculate_optimal_parameters(10000000, 0.001)
print(f"Optimal size: {m} bits ({m / 8 / 1024:.2f} KB)")
print(f"Optimal hash functions: {k}")
```

### False Positive Rate vs Size Trade-off

```
Size (bits) | False Positive Rate | Memory Usage
-------------|---------------------|--------------
1,000,000     | 1.0%               | 125 KB
10,000,000    | 0.1%               | 1.25 MB
100,000,000   | 0.01%              | 12.5 MB
1,000,000,000 | 0.001%             | 125 MB
```

---

## Scaling Probabilistic Data Structures

### Distributed Bloom Filter

```python
class DistributedBloomFilter:
    def __init__(self, shards: list):
        self.shards = shards
        self.hash_functions = [mmh3.hash() for _ in range(7)]

    def add(self, item: str):
        # Add to all shards
        for shard in self.shards:
            shard.add(item)

    def contains(self, item: str) -> bool:
        # Check all shards
        for shard in self.shards:
            if shard.contains(item):
                return True
        return False

# Usage
shard1 = RedisBloomFilter('bloom:shard1', 1000000, 7)
shard2 = RedisBloomFilter('bloom:shard2', 1000000, 7)
shard3 = RedisBloomFilter('bloom:shard3', 1000000, 7)

bloom = DistributedBloomFilter([shard1, shard2, shard3])
```

### Merging Sketches

```python
def merge_count_min_sketches(sketches: list[CountMinSketch]) -> CountMinSketch:
    """Merge multiple Count-Min sketches into one"""
    merged = sketches[0]

    for sketch in sketches[1:]:
        merged = merge.count_min_sketches(merged, sketch)

    return merged

def merge_hyperlog_logs(sketches: list[HyperLogLog]) -> HyperLogLog:
    """Merge multiple HyperLogLogs into one"""
    merged = sketches[0]

    for sketch in sketches[1:]:
        merged = merged.merge(sketch)

    return merged
```

---

## Monitoring

### Bloom Filter Metrics

```
Performance Metrics:
- Operation latency (add, contains)
- Memory usage
- False positive rate (sampled)
- Cache hit rate (for Redis Bloom Filter)

Accuracy Metrics:
- False positive rate
- False negative rate (should be 0%)
- Accuracy vs actual database (for sampled queries)
```

### Count-Min Sketch Metrics

```
Performance Metrics:
- Update latency
- Memory usage
- Query latency

Accuracy Metrics:
- Error rate vs ground truth (for sampled data)
- Distribution of errors
```

---

## Follow-up Questions

1. **How to handle false positives?**
   - Verify with actual data source
   - Cache verification results
   - Update Bloom Filter periodically

2. **How to resize Bloom Filter?**
   - Create new larger filter
   - Migrate data from old filter
   - Use both filters during migration

3. **How to handle deletions?**
   - Bloom Filters don't support deletion
   - Use Counting Bloom Filter or Cuckoo Filter
   - Periodic rebuild of filter

4. **How to handle count updates?**
   - Count-Min Sketch: Increment only (no decrement)
   - Use separate sketch for add/remove operations
   - HyperLogLog: No deletions, new filter for updated data

5. **How to choose parameters?**
   - Expected items: Estimate unique elements
   - Acceptable false positive rate: 1%, 0.1%, etc.
   - Calculate optimal m and k

---

## Links

- [System Design Interview Overview](overview.md)
- [Distributed Systems Fundamentals](distributed-systems.md)
- [Caching and Message Queues](caching-message-queues.md)
