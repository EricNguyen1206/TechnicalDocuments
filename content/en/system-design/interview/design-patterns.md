---
title: "Design Patterns in Distributed Systems"
date: 2025-02-15
tags: ["system-design", "patterns", "circuit-breaker", "saga", "cqrs"]
description: "Essential distributed system design patterns including Circuit Breaker, Side-car, Saga, CQRS, and Retry."
author: "Eric Nguyen"
layout: "post"
---

# Design Patterns in Distributed Systems

## Why Design Patterns Matter?

Design patterns provide tested, reusable solutions to common problems in distributed systems. They help:

- Solve known problems efficiently
- Avoid reinventing the wheel
- Improve system reliability
- Standardize approaches across teams

---

## 1. Circuit Breaker Pattern

### Problem

When a service is slow or failing, clients keep making requests, causing:

- Cascading failures
- Resource exhaustion
- Poor user experience
- Timeouts and retries

### Solution

Circuit Breaker monitors service health and blocks requests to failing services.

```
Normal → Open (failures > threshold) → Half-Open → Closed

States:
- CLOSED: Requests pass normally
- OPEN: Requests fail fast (no actual calls)
- HALF-OPEN: Limited requests to test recovery
```

### Implementation

```python
from enum import Enum
from datetime import datetime, timedelta
import time

class CircuitBreakerState(Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"

class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout  # seconds in OPEN state
        self.failure_count = 0
        self.state = CircuitBreakerState.CLOSED
        self.next_attempt = None
        self.last_failure_time = None

    def call(self, func, *args, **kwargs):
        # Check if circuit is OPEN
        if self.state == CircuitBreakerState.OPEN:
            if datetime.now() < self.next_attempt:
                raise Exception("Circuit is OPEN")
            # Try HALF_OPEN
            self.state = CircuitBreakerState.HALF_OPEN

        try:
            result = func(*args, **kwargs)
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise e

    def on_success(self):
        self.failure_count = 0
        self.state = CircuitBreakerState.CLOSED

    def on_failure(self):
        self.failure_count += 1
        self.last_failure_time = datetime.now()

        if self.failure_count >= self.failure_threshold:
            self.state = CircuitBreakerState.OPEN
            self.next_attempt = datetime.now() + timedelta(seconds=self.timeout)

# Usage
circuit = CircuitBreaker(failure_threshold=3, timeout=30)

def call_external_service():
    # Simulate service call
    pass

try:
    result = circuit.call(call_external_service)
    print("Success:", result)
except Exception as e:
    print("Failed:", e)
```

### Use Cases

- API calls to external services
- Database connections
- Third-party integrations
- Microservice communication

### Pros & Cons

**Pros:**

- Prevents cascading failures
- Faster failure (no waiting for timeouts)
- Resource conservation
- Automatic recovery

**Cons:**

- Adds complexity
- May block legitimate requests temporarily
- Needs tuning (thresholds, timeouts)

---

## 2. Side-car Pattern

### Problem

Microservices need cross-cutting concerns (logging, monitoring, config) without:

- Adding logic to each service
- Language-specific implementations
- Tight coupling to infrastructure

### Solution

Side-car is a companion process that runs alongside each service instance.

```
┌─────────────────────────────────┐
│          Service Pod           │
│  ┌──────────┐  ┌──────────┐ │
│  │  Service  │  │ Side-car │ │
│  │           │  │           │ │
│  │           │  │ - Logging │ │
│  │           │  │ - Metrics │ │
│  │           │  │ - Config  │ │
│  └──────────┘  └──────────┘ │
└─────────────────────────────────┘
```

### Benefits

- **Separation of concerns:** Service focus on business logic
- **Technology agnostic:** Side-car can be any language
- **Easy deployment:** Deploy together as one unit
- **Flexibility:** Swap side-cars without changing services
- **Observability:** Built-in logging and metrics

### Use Cases

1. **Logging:** Centralized log collection
2. **Monitoring:** Metrics and health checks
3. **Configuration:** Dynamic config management
4. **Service Discovery:** Registration and discovery
5. **Communication:** Proxy for service-to-service calls
6. **Security:** TLS termination, authentication

### Example: Envoy Side-car

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
    - name: app
      image: myapp:latest
      ports:
        - containerPort: 8080
    - name: envoy
      image: envoyproxy/envoy:latest
      ports:
        - containerPort: 8443
      volumeMounts:
        - name: config
          mountPath: /etc/envoy
  volumes:
    - name: config
      configMap:
        name: envoy-config
```

### Envoy Configuration

```yaml
static_resources:
  listeners:
    - name: listener_0
      address:
        socket_address:
          protocol: TCP
          address: 0.0.0.0:8443
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                stat_prefix: ingress_http
                route_config:
                  virtual_hosts:
                    - name: backend
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/"
                          route:
                            cluster: service_cluster
                http_filters:
                  - name: envoy.filters.http.router
                  - name: envoy.filters.http.cors
  clusters:
    - name: service_cluster
      connect_timeout: 0.25s
      type: strict_dns
      lb_policy: round_robin
      hosts:
        - socket_address:
            address: 127.0.0.1:8080
```

### Pros & Cons

**Pros:**

- Clean separation
- Language independent
- Reusable side-cars
- Easy to update
- Single deployment unit

**Cons:**

- More complex deployment
- Additional resource overhead
- Network latency (extra hop)
- Monitoring complexity (side-car + service)

---

## 3. Saga Pattern

### Problem

How to maintain data consistency across multiple microservices when:

- Distributed transaction is needed
- 2PC (Two-Phase Commit) is too slow
- Services may be temporarily unavailable
- Need eventual consistency

### Solution

Saga pattern breaks a transaction into a sequence of local transactions, each updating data within a single service.

### Saga Types

#### 1. Choreography-based Saga

```
Order Service
    │
    ├─→ Payment Service
    │       │
    │       ├─→ Inventory Service
    │       │       │
    │       │       └─→ Notification Service
    │       │
    │       └─→ Order Service (update status)
    │
    └─→ Order Service (status update)
```

**Characteristics:**

- No central coordinator
- Services communicate via events
- Decoupled
- Complex to debug

**Implementation:**

```python
# Order Service publishes events
class OrderService:
    def create_order(self, order):
        # Create order
        order_id = self.db.create(order)

        # Publish event
        event_bus.publish("order_created", {
            "order_id": order_id,
            "user_id": order.user_id,
            "amount": order.amount
        })

# Payment Service listens and processes
class PaymentService:
    @event_bus.subscribe("order_created")
    def process_payment(self, event):
        # Process payment
        payment = self.process(event)

        # Publish success/failure
        event_bus.publish("payment_completed", {
            "order_id": event["order_id"],
            "status": payment.status
        })

# Inventory Service
class InventoryService:
    @event_bus.subscribe("payment_completed")
    def reserve_inventory(self, event):
        # Reserve items
        self.reserve(event["order_id"])

        # Publish completion
        event_bus.publish("inventory_reserved", {
            "order_id": event["order_id"]
        })
```

#### 2. Orchestration-based Saga

```
Order Saga Orchestrator
    │
    ├─→ Payment Service
    │       └─→ Orchestrator
    │
    ├─→ Inventory Service
    │       └─→ Orchestrator
    │
    ├─→ Notification Service
    │       └─→ Orchestrator
    │
    └─→ Complete
```

**Characteristics:**

- Central coordinator
- Easier to understand
- Easier to debug
- Single point of failure

**Implementation:**

```python
class OrderSaga:
    def __init__(self, order_id):
        self.order_id = order_id
        self.current_step = "payment"
        self.compensating_actions = []

    def execute(self):
        try:
            # Step 1: Payment
            if not self.process_payment():
                return False

            # Step 2: Inventory
            if not self.reserve_inventory():
                self.compensate_payment()
                return False

            # Step 3: Notification
            if not self.send_notification():
                self.compensate_inventory()
                self.compensate_payment()
                return False

            # Success
            self.mark_order_completed()
            return True

        except Exception as e:
            self.compensate_all()
            raise e

    def compensate_all(self):
        for action in reversed(self.compensating_actions):
            action()

    def process_payment(self):
        # Execute payment
        payment = payment_service.charge(self.order_id)
        self.compensating_actions.append(
            lambda: payment_service.refund(self.order_id)
        )
        return payment.success
```

### Compensating Transactions

Each step must have a compensating action:

```
Original Transaction      Compensating Transaction
----------------------      ------------------------
Charge credit card       Refund credit card
Reserve inventory         Release inventory
Send email              Send cancellation email
Update status            Revert status
```

**Example:**

```python
class PaymentService:
    def charge(self, order_id, amount):
        # Charge card
        payment = self.process_payment(amount)
        self.db.save_payment(order_id, payment)
        return payment

    def refund(self, order_id):
        # Get original payment
        payment = self.db.get_payment(order_id)

        # Refund
        self.process_refund(payment.amount)

        # Update status
        self.db.update_status(order_id, "refunded")
```

### Pros & Cons

| Aspect       | Choreography | Orchestration            |
| ------------ | ------------ | ------------------------ |
| Complexity   | High         | Medium                   |
| Debugging    | Difficult    | Easier                   |
| Coupling     | Low          | Higher (to orchestrator) |
| Coordination | None         | Centralized              |
| Flexibility  | High         | Medium                   |

---

## 4. TCC (Try-Confirm-Cancel) Pattern

### Problem

Need strong consistency in distributed transactions but 2PC is too slow and locks resources too long.

### Solution

TCC is a two-phase commit variant where:

- **Try Phase:** Reserve resources
- **Confirm Phase:** Confirm/commit
- **Cancel Phase:** Rollback/undo

### TCC Workflow

```
Client
    ↓
┌─────────────────────────┐
│ Try All Participants    │
├─→ Service A: Try     │
├─→ Service B: Try     │
└─→ Service C: Try     │
    ↓ (All Try succeed)
┌─────────────────────────┐
│ Confirm All           │
├─→ Service A: Confirm │
├─→ Service B: Confirm │
└─→ Service C: Confirm │
    ↓ (Success)
Transaction Complete

    ↓ (Any Try fail)
┌─────────────────────────┐
│ Cancel All            │
├─→ Service A: Cancel  │
├─→ Service B: Cancel  │
└─→ Service C: Cancel  │
```

### Implementation

```python
class TCCTransaction:
    def __init__(self, participants):
        self.participants = participants
        self.confirmed = []

    def execute(self):
        # Phase 1: Try all
        try:
            for participant in self.participants:
                if not participant.try():
                    # Cancel all tried participants
                    self.cancel_all()
                    return False

        # Phase 2: Confirm all
        for participant in self.participants:
            participant.confirm()
            self.confirmed.append(participant)

        return True

    def cancel_all(self):
        for participant in self.confirmed:
            participant.cancel()

# Example: Payment TCC
class PaymentService:
    def try(self, order_id, amount):
        # Reserve/lock funds
        locked = self.lock_funds(amount)
        if not locked:
            return False

        # Record pending transaction
        self.db.create_pending(order_id, amount)
        return True

    def confirm(self, order_id):
        # Confirm transaction
        self.db.confirm_pending(order_id)
        return True

    def cancel(self, order_id):
        # Release locked funds
        self.db.release_pending(order_id)
        return True
```

### TCC vs 2PC

| Aspect        | 2PC                 | TCC                              |
| ------------- | ------------------- | -------------------------------- |
| Coordinator   | Required            | Not required (application-level) |
| Lock Duration | Long (until commit) | Short (try phase only)           |
| Performance   | Slow                | Better                           |
| Flexibility   | Low                 | High                             |
| Complexity    | Low                 | High                             |

---

## 5. CQRS (Command Query Responsibility Segregation)

### Problem

Single model for both read and write operations leads to:

- Complex queries
- Poor read performance
- Locking contentions
- Difficulty scaling reads vs writes separately

### Solution

CQRS separates the model into:

- **Command model:** For write operations (commands)
- **Query model:** For read operations (queries)

### CQRS Architecture

```
┌─────────────────────────────────┐
│          Application           │
└──────────────┬──────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐  ┌─────▼───────┐
│  Write Side   │  │  Read Side   │
│              │  │              │
│ Commands     │  │ Queries      │
│   ↓          │  │   ↓          │
│ Command DB   │  │  Query DB    │
│ (SQL/NoSQL) │  │ (Denormalized)│
│              │  │              │
│   Events     │  │  Replication  │
└──────┬───────┘  └──────────────┘
       │
       ↓
  Event Bus
       │
       ↓
┌──────▼───────┐
│ Event Handler  │
└───────────────┘
```

### Implementation

#### Command Side

```python
# Command
class CreateOrderCommand:
    def __init__(self, user_id, items):
        self.user_id = user_id
        self.items = items

# Command Handler
class CreateOrderHandler:
    def __init__(self, db, event_bus):
        self.db = db
        self.event_bus = event_bus

    def handle(self, command):
        # Validate
        self.validate(command)

        # Create order (write model)
        order = Order(
            user_id=command.user_id,
            items=command.items,
            status="created",
            created_at=datetime.now()
        )
        order_id = self.db.save(order)

        # Publish event
        self.event_bus.publish(OrderCreatedEvent(
            order_id=order.id,
            user_id=order.user_id,
            total=self.calculate_total(command.items)
        ))

        return order_id
```

#### Query Side

```python
# Query Model (Denormalized)
class OrderView:
    order_id: str
    user_id: str
    total: float
    status: str
    items: List[OrderItemView]
    created_at: datetime

# Query Handler
class GetOrderQueryHandler:
    def __init__(self, read_db):
        self.read_db = read_db

    def handle(self, query):
        # Direct query to read database
        return self.read_db.query_one(query.filter)
```

#### Event Handler

```python
class OrderCreatedEventHandler:
    def __init__(self, read_db):
        self.read_db = read_db

    def handle(self, event):
        # Update read model
        order_view = OrderView(
            order_id=event.order_id,
            user_id=event.user_id,
            total=event.total,
            status="created",
            items=event.items,
            created_at=datetime.now()
        )
        self.read_db.save(order_view)
```

### Benefits

- **Optimized Reads:** Denormalized for read performance
- **Optimized Writes:** Normalized for write consistency
- **Separate Scaling:** Scale reads and writes independently
- **Complex Queries:** Pre-computed, fast
- **Flexibility:** Different read models for different use cases

### Drawbacks

- **Complexity:** More components to maintain
- **Eventual Consistency:** Read model may be stale
- **Data Synchronization:** Need to keep models in sync
- **Development Overhead:** More code to write

### When to Use CQRS

**Use CQRS When:**

- High read-to-write ratio (>10:1)
- Complex business logic
- Multiple read models needed
- Performance is critical
- Microservices architecture

**Don't Use CQRS When:**

- Simple CRUD application
- Low traffic
- Small team
- Read/write ratio is balanced

### CQRS + Event Sourcing

```
Event Store
    ↓ (events)
    ├─→ Read Models (multiple projections)
    └─→ Audit Log
```

---

## 6. Retry Pattern

### Problem

Distributed systems experience transient failures:

- Network timeouts
- Service temporarily unavailable
- Rate limiting
- Resource exhaustion

### Solution

Retry pattern automatically re-fails failed operations to handle transient issues.

### Retry Strategies

#### 1. Fixed Delay Retry

```
Attempt 1 (fail) → Wait 1s → Attempt 2 (fail) → Wait 1s → ...
```

**Implementation:**

```python
import time

def retry_fixed(func, max_retries=3, delay=1):
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            time.sleep(delay)
```

#### 2. Exponential Backoff

```
Attempt 1 (fail) → Wait 1s → Attempt 2 (fail) → Wait 2s → ...
                      1s         2s         4s
                      (2^0)       (2^1)       (2^2)
```

**Implementation:**

```python
import time
import random

def retry_exponential(func, max_retries=5, base_delay=1, max_delay=60):
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise e

            # Calculate delay with jitter
            delay = min(base_delay * (2 ** attempt), max_delay)
            delay = delay * (0.5 + random.random())  # jitter

            time.sleep(delay)
```

#### 3. Linear Backoff

```
Attempt 1 (fail) → Wait 1s → Attempt 2 (fail) → Wait 2s → ...
                      1s         2s         3s
```

**Implementation:**

```python
import time

def retry_linear(func, max_retries=5, delay_increment=1, max_delay=60):
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise e

            delay = min((attempt + 1) * delay_increment, max_delay)
            time.sleep(delay)
```

### Retry with Circuit Breaker

```python
from circuit_breaker import CircuitBreaker

class RetryWithCircuitBreaker:
    def __init__(self, max_retries=3, backoff="exponential"):
        self.circuit = CircuitBreaker()
        self.max_retries = max_retries
        self.backoff = backoff

    def call(self, func, *args, **kwargs):
        # Check circuit first
        if self.circuit.state == CircuitBreakerState.OPEN:
            raise Exception("Circuit is OPEN")

        for attempt in range(self.max_retries):
            try:
                return self.circuit.call(func, *args, **kwargs)
            except Exception as e:
                if attempt == self.max_retries - 1:
                    raise e
                # Wait before retry
                self._wait(attempt)

    def _wait(self, attempt):
        if self.backoff == "exponential":
            delay = min(2 ** attempt, 60)
        elif self.backoff == "linear":
            delay = min((attempt + 1) * 1, 60)

        import time
        time.sleep(delay)
```

### Idempotency

Critical for retries: operations must be idempotent.

```python
# Bad: Not idempotent (multiple calls = multiple charges)
def charge_card(amount):
    payment = payment_gateway.charge(amount)
    return payment

# Good: Idempotent (multiple calls = same result)
def charge_card(order_id, amount):
    # Check if already charged
    if db.get_payment(order_id):
        return db.get_payment(order_id)

    # Charge
    payment = payment_gateway.charge(amount)

    # Store payment
    db.save_payment(order_id, payment)
    return payment
```

### Retry Best Practices

1. **Use exponential backoff with jitter**
   - Prevents thundering herd
   - Avoids synchronized retries

2. **Set max retries**
   - Don't retry indefinitely
   - Fail fast after N attempts

3. **Use circuit breaker**
   - Stop retrying failing service
   - Allow service to recover

4. **Make operations idempotent**
   - Safe to retry multiple times
   - Use unique request IDs

5. **Handle specific exceptions**
   - Retry on transient errors
   - Don't retry on client errors (4xx)

6. **Log retry attempts**
   - Monitor retry patterns
   - Alert on excessive retries

### Retry Implementation with Decorator

```python
import time
import random
from functools import wraps
from typing import Callable

def retry(
    max_attempts: int = 3,
    backoff: str = "exponential",
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    jitter: bool = True
):
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e

                    if attempt < max_attempts - 1:
                        # Calculate delay
                        if backoff == "exponential":
                            delay = min(base_delay * (2 ** attempt), max_delay)
                        else:
                            delay = min((attempt + 1) * base_delay, max_delay)

                        # Add jitter
                        if jitter:
                            delay = delay * (0.5 + random.random())

                        time.sleep(delay)

            raise last_exception

        return wrapper
    return decorator

# Usage
@retry(max_attempts=3, backoff="exponential")
def call_external_api(url):
    response = requests.get(url)
    response.raise_for_status()
    return response.json()
```

---

## 7. Bulkhead Pattern

### Problem

A single failing component can consume all resources, affecting unrelated operations.

### Solution

Bulkhead pattern isolates resources so that failure in one component doesn't affect others.

### Implementation

```python
import concurrent.futures
from threading import BoundedSemaphore

class Bulkhead:
    def __init__(self, max_concurrent=10):
        self.semaphore = BoundedSemaphore(max_concurrent)

    def execute(self, func, *args, **kwargs):
        with self.semaphore:
            return func(*args, **kwargs)

# Usage
bulkhead_api = Bulkhead(max_concurrent=5)

def call_api(endpoint):
    return bulkhead_api.execute(lambda: requests.get(endpoint))

# Multiple bulkheads for different operations
api_bulkhead = Bulkhead(10)
db_bulkhead = Bulkhead(5)
email_bulkhead = Bulkhead(3)
```

### Java Thread Pool Example

```java
// Java ExecutorService with thread pools
ExecutorService apiExecutor = Executors.newFixedThreadPool(10);
ExecutorService dbExecutor = Executors.newFixedThreadPool(5);
ExecutorService emailExecutor = Executors.newFixedThreadPool(3);

// Submit to appropriate bulkhead
apiExecutor.submit(() -> callApi());
dbExecutor.submit(() -> callDb());
emailExecutor.submit(() -> sendEmail());
```

### Benefits

- **Resource Isolation:** Failing component limited to its resources
- **Graceful Degradation:** Other operations continue
- **Predictable Performance:** Resource usage controlled
- **Better Resilience:** Cascading failures prevented

---

## Pattern Decision Framework

### When to Use Which Pattern?

| Pattern             | Use When                                              | Avoid When                                   |
| ------------------- | ----------------------------------------------------- | -------------------------------------------- |
| **Circuit Breaker** | Calling external services, unreliable dependencies    | Reliable services, simple applications       |
| **Side-car**        | Microservices, cross-cutting concerns, polyglot       | Monolithic, single language                  |
| **Saga**            | Distributed transactions, eventual consistency OK     | Single service, strong consistency required  |
| **TCC**             | Strong consistency needed, 2PC too slow               | Simple transactions, eventual consistency OK |
| **CQRS**            | High read:write ratio, complex queries, scaling needs | Simple CRUD, balanced reads/writes           |
| **Retry**           | Transient failures, unreliable network                | Permanent failures, client errors            |
| **Bulkhead**        | Resource contention, mixed workloads                  | Single workload type, simple app             |

### Combining Patterns

```
Retry + Circuit Breaker + Bulkhead
┌─────────────────────────────┐
│      Application            │
└──────────┬────────────────┘
           │
┌──────────▼────────────────┐
│  Bulkhead (Resource)     │
└──────────┬────────────────┘
           │
┌──────────▼────────────────┐
│  Circuit Breaker (Service) │
└──────────┬────────────────┘
           │
┌──────────▼────────────────┐
│  Retry (Operation)        │
└───────────────────────────┘
```

---

## Conclusion

Design patterns are tools, not solutions. Use them when:

1. They solve a real problem
2. They fit your requirements
3. The benefits outweigh the complexity

Remember: The best pattern is the one that makes the right trade-offs for your specific context.

---

## Links

- [System Design Interview Overview](overview.md)
- [Distributed Systems Fundamentals](distributed-systems.md)
- [Trade-offs in System Design](trade-offs.md)
