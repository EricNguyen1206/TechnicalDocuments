---
title: "Monolith to Microservices Migration"
date: 2025-02-15
tags: ["system-design", "microservices", "migration", "architecture"]
description: "Guide to migrating from monolithic architecture to microservices including patterns, strategies, and best practices."
author: "Eric Nguyen"
layout: "post"
---

# Monolith to Microservices Migration

## Monolith vs Microservices

### Monolith Architecture

```
┌─────────────────────────────────┐
│         Monolith Application       │
│  ┌───────────────────────────┐  │
│  │  Authentication          │  │
│  │  User Service           │  │
│  │  Order Service          │  │
│  │  Inventory Service       │  │
│  │  Product Service        │  │
│  │  Payment Service        │  │
│  │  │
│  │  ├─→ Shared Code          │  │
│  │  ├─→ Shared Libraries     │  │
│  │ └─→ Database           │  │
│  │                         │  │
│  └─────────────────────────────┘  │
└─────────────────────────────────┘
```

**Characteristics:**

- Single codebase
- Single database
- Deployed as one unit
- Shared in-memory state
- Tight coupling

### Microservices Architecture

```
                ┌─────────────────────────────────┐
                │  API Gateway            │
                └────────┬─────────────────┘
                         │
        ┌────────┼─────────┼─────────────────────────┼────────────────┐
        │      │         │           │              │              │
┌──────▼──────┐ │  ┌────▼─────┐ │  ┌────▼─────┐ ┌────▼─────┐  ┌────▼─────┐
│ Auth Service │ │ │ User Svc  │ │ │ Order Svc │ │ │ Invty Svc │ │ │ Prod Svc │ │ │ Pymt Svc │
└─────┬──────┘ │ └─────┬───┘ │ └─────┬───┘ │ └─────┬───┘ │ └─────┬───┘ │ └────┬───┘
        │         │         │           │              │              │              │
        │   ┌─────▼─────┐  │   ┌─────▼─────┐ │   ┌─────▼─────┐ │   ┌─────▼─────┐ │   ┌─────▼─────┐ │   ┌─────▼─────┐
        │   │    DB      │ │   │    DB      │ │   │    DB      │   │    DB      │ │   │    DB      │
        │   └─────────┘ │   └─────────┘ │   └─────────┘ │   └─────────┘ │   └─────────┘ │   └─────────┘ │   └─────────┘
        └──────────────────┘
```

**Characteristics:**

- Multiple independent services
- Each service has its own database
- Deployed independently
- Stateless (usually)
- Loosely coupled

### Comparison

| Aspect                | Monolith                          | Microservices                     |
| --------------------- | --------------------------------- | --------------------------------- |
| **Complexity**        | Lower initially, higher long-term | Higher initially, lower long-term |
| **Deployment**        | Single unit                       | Multiple units                    |
| **Scalability**       | Vertical scaling                  | Horizontal scaling                |
| **Technology**        | Single tech stack                 | Polyglot permitted                |
| **Data Consistency**  | ACID (strong)                     | BASE (eventual)                   |
| **Team Size**         | Small teams                       | Larger teams                      |
| **Communication**     | Function calls                    | Network calls                     |
| **Development Speed** | Faster initially                  | Slower initially                  |

---

## Why Migrate?

### Benefits of Microservices

**1. Scalability:**

- Scale individual services independently
- Handle different loads per service
- Cost optimization (right-size each service)

**2. Fault Isolation:**

- Failure in one service doesn't affect others
- Graceful degradation possible
- Faster recovery times

**3. Technology Freedom:**

- Different services can use different tech stacks
- Adopt new technologies incrementally
- Use best tool for each service

**4. Team Organization:**

- Smaller, focused teams
- Independent deployments
- Clear ownership

**5. Deployment Speed:**

- Deploy single service vs entire monolith
- Faster CI/CD pipelines
- Lower risk

---

## Migration Strategies

### 1. Strangler Pattern

**Approach:** Gradually extract functionality into services while keeping monolith running.

**Architecture:**

```
Phase 1: Initial State
┌──────────────────────┐
│    Monolith        │
└────────┬───────────┘
         │
         ├─→ [Database]
         └─→ [External APIs]

Phase 2: Identify Service Boundaries
┌───────────────────────────┐
│    Monolith        │
│  ┌──┬──┬──┬──┬──┐  │
│  │  │  │  │  │  │  │
│  ├──┴──┴──┴──┴──┘ │
│  Auth│User│Order│Pymnt│Invty│Prod│...
│  Svc │ Svc│  Svc │ Svc │   │
```

Phase 3: Extract First Service
┌───────────────────────────┐
│ Monolith │
│ └────────┬──────────┘
│
┌────▼───────┐
│ │ Auth Svc │
│ │ │ │
│ │ │ │ │
│ └─────┬───┘
│ │ │
│ ├─→ [DB]
└────────┴────┘
│
└──→ API Gateway

```

Phase 4: Extract Additional Services
┌─────────────────────────┐
│  Monolith        │
│  ┌──┬──┬──┬──┬──┐  │
│  │  │  │  │  │  │
│ ├──┴──┴──┴──┴──┴──┘ │
│ Auth│User│Order│Pymnt│Invty│Prod│...
│ Svc │ Svc │ Svc │ Svc │   │
│    │        │   │
│    └────────┴──┴──┘
```

Phase 5: Final State
┌─────────────────────────┐
│ API Gateway │
│ ┌──┼──┼──┼──┼──┐ │
│ │ Auth│User│Order│Pymnt│Invty│Prod│... │
│ │ ┌─▼┐┌─▼┐┌─▼┐┌─▼─┐┌─▼─┐┌─▼┐
│ │ │ │ │ │ │ │ │ │ │ │
│ │ │ │ │ │ │ │ │ │
│ └─┴─┘└─┴─└─┴─└─└─┴─└─└──┴└─└─┴─┘ │

```

**Implementation Steps:**

1. **Identify Service Boundaries:**
   - Natural functional boundaries (user, order, payment, etc.)
   - Data ownership (tables that belong together)
   - Team structure (who owns what)

2. **Create Facade Layer:**
   - Create new service with API
   - Route requests to monolith initially
   - Replace monolith functionality over time

3. **Data Migration:**
   - Copy relevant tables to service database
   - Set up data sync (dual-write initially)
   - Implement data validation

4. **Gradual Cutover:**
   - Route requests to new service gradually
   - Monitor for issues
   - Rollback if needed

5. **Remove Old Code:**
   - Remove old code from monolith once stable

---

### 2. API Gateway Pattern

**Approach:** Put API Gateway in front to route requests to services.

```

Client Request
↓
[Load Balancer]
↓
[API Gateway]
├── Authentication
├── Rate Limiting
├── Request Validation
├── Routing
└── Response Aggregation
├─→ [Auth Service]
├─→ [User Service]
├─→ [Order Service]
├─→ [Inventory Service]
└─→ [Payment Service]

````

**API Gateway Responsibilities:**
- Request routing
- Authentication/authorization
- Rate limiting
- Response aggregation
- Request/response transformation
- SSL termination
- Logging and monitoring

### API Gateway Implementation

```python
from fastapi import FastAPI
import httpx

class APIGateway:
    def __init__(self):
        self.services = {
            'auth': 'http://auth-service:8001',
            'user': 'http://user-service:8002',
            'order': 'http://order-service:8003',
            'payment': 'http://payment-service:8004',
            'inventory': 'http://inventory-service:8005',
        }
        self.auth_service = httpx.AsyncClient(base_url=self.services['auth'])
        self.user_service = httpx.AsyncClient(base_url=self.services['user'])
        self.order_service = httpx.AsyncClient(base_url=self.services['order'])
        self.payment_service = httpx.AsyncClient(base_url=self.services['payment'])
        self.inventory_service = httpx.AsyncClient(base_url=self.services['inventory'])

    async def route_request(self, path: str, headers: dict, method: str):
        # Auth check
        user_id = await self.authenticate(headers.get('Authorization'))
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")

        # Rate limit
        if not await self.check_rate_limit(user_id):
            raise HTTPException(status_code=429, detail="Too many requests")

        # Route request
        if path.startswith('/auth/'):
            return await self.proxy_request('auth', path, headers, method)
        elif path.startswith('/users/'):
            return await self.proxy_request('user', path, headers, method)
        elif path.startswith('/orders/'):
            return await self.proxy_request('order', path, headers, method)
        elif path.startswith('/payments/'):
            return await self.proxy_request('payment', path, headers, method)
        elif path.startswith('/inventory/'):
            return await self.proxy_request('inventory', path, headers, method)
        else:
            raise HTTPException(status_code=404, detail="Not found")

    async def authenticate(self, auth_header: str) -> str:
        response = await self.auth_service.get(
            '/auth/validate',
            headers={'Authorization': auth_header}
        )
        data = response.json()

        if data.get('valid', False):
            raise HTTPException(status_code=401, detail="Invalid token")

        return data.get('user_id')

    async def check_rate_limit(self, user_id: str) -> bool:
        # Check Redis cache
        redis_client = redis.Redis()
        key = f"ratelimit:{user_id}"

        current = redis_client.incr(key)

        if current == 1:
            redis_client.expire(key, 3600)  # 1 hour TTL

        if current > 1000:
            return False

        return True

    async def proxy_request(self, service: str, path: str, headers: dict, method: str):
        service_url = self.services.get(service)
        if not service_url:
            raise HTTPException(status_code=503, detail="Service unavailable")

        url = f"{service_url}{path}"

        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=method,
                url=url,
                headers=headers
            )

            return response
````

---

## Data Migration

### Database Strategies

### 1. Database per Service

```
Monolith Database:
├── users table
├── orders table
├── products table
└── payments table

Microservices Databases:
├── auth-service: users table
├── user-service: users table
├── order-service: orders table
├── product-service: products table
├── payment-service: payments table
└── inventory-service: products table

Note: Some tables may be duplicated initially
```

### 2. Shared Database

```
All services share same database:
├── Schema segregation (separate schemas per service)
├── Application-level constraints
└── Row-level security
```

### 3. Hybrid Approach

```
Critical Data: Shared database with strong consistency
- Users
- Authentication
- Orders

Non-Critical Data: Separate databases
- Product catalog
- Analytics logs
- Search indexes
```

### Data Synchronization

**Dual-Write Pattern:**

```python
import asyncio
import asyncpg

class DataMigrator:
    def __init__(self, monolith_db_url: str, service_db_url: str):
        self.monolith_db = await asyncpg.connect(monolith_db_url)
        self.service_db = await asyncpg.connect(service_db_url)

    async def migrate_user_data(self, user_id: str):
        # Read from monolith
        user = await self.monolith_db.fetchrow(
            "SELECT * FROM users WHERE id = $1",
            user_id
        )

        # Write to service
        await self.service_db.execute(
            "INSERT INTO users (id, username, email) VALUES ($1, $2, $3)",
            user
        )

    async def sync_user_data(self, user_id: str):
        # Write to both databases
        await self.monolith_db.execute(
            "UPDATE users SET last_login = NOW() WHERE id = $1",
            user_id
        )
        await self.service_db.execute(
            "UPDATE users SET last_login = NOW() WHERE id = $1",
            user_id
        )

    async def verify_migration(self):
        # Compare counts between databases
        monolith_count = await self.monolith_db.fetchval(
            "SELECT COUNT(*) FROM users"
        )
        service_count = await self.service_db.fetchval(
            "SELECT COUNT(*) FROM users"
        )

        return monolith_count == service_count
```

---

## Service-to-Service Communication

### 1. Synchronous vs Asynchronous

**Synchronous (HTTP/REST):**

```python
# Order Service calling Inventory Service
async def check_inventory(self, product_id: int, quantity: int):
    response = await httpx.post(
        'http://inventory-service/api/check',
        json={
            'product_id': product_id,
            'quantity': quantity
        }
    )

    if response.status_code != 200:
        raise Exception("Inventory check failed")

    data = response.json()
    return data['available']

# synchronous call blocks until inventory service responds
```

**Asynchronous (Message Queue):**

```python
# Order Service publishes event to queue
import kafka

class OrderPublisher:
    def __init__(self):
        self.producer = KafkaProducer()

    async def create_order(self, order: dict):
        # Create order in local DB
        order_id = await create_order_in_db(order)

        # Publish event to queue
        await self.producer.send_and_wait(
            'order-created',
            key=str(order_id),
            value=order
        )

# Inventory Service consumes event and updates inventory
class InventoryConsumer:
    def __init__(self):
        self.consumer = KafkaConsumer('order-created')

    async def process_order_event(self, message: dict):
        order_id = message['order_id']
        order = get_order_from_db(order_id)

        # Update inventory
        success = await update_inventory(
            order['items']
        )

        if not success:
            # Publish event back to order service
            await self.producer.send_and_wait(
                'order-failed',
                key=order_id,
                value=message
            )
```

---

### 2. Circuit Breaker Pattern

```python
from circuit_breaker import CircuitBreaker

class ServiceClient:
    def __init__(self, service_url: str):
        self.service_url = service_url
        self.circuit = CircuitBreaker(
            failure_threshold=5,
            timeout=30
        )

    async def call_service(self, endpoint: str, **kwargs):
        url = f"{self.service_url}{endpoint}"

        try:
            return await self.circuit.call(
                lambda: httpx.get(url, **kwargs)
            )
        except Exception as e:
            # Circuit breaker opened, service unavailable
            raise ServiceUnavailableException(
                f"Service unavailable: {self.service_url}"
            ) from e

# Usage
inventory_client = ServiceClient('http://inventory-service:8005')

try:
    available = inventory_client.call_service('/api/check', json={'product_id': 123, 'quantity': 2})
except ServiceUnavailableException:
    print("Inventory service unavailable")
    available = None
```

---

## Service Discovery

### Dynamic Service Registration

```python
class ServiceRegistry:
    def __init__(self):
        self.services = {}  # service_name -> [service_urls]

    def register_service(self, name: str, url: str):
        if name not in self.services:
            self.services[name] = []
        self.services[name].append(url)
        print(f"Registered service: {name} → {url}")

    def deregister_service(self, name: str, url: str):
        if name in self.services and url in self.services[name]:
            self.services[name].remove(url)
            print(f"Deregistered service: {name} → {url}")

    def get_service(self, name: str) -> str:
        services = self.services.get(name, [])

        if not services:
            raise Exception(f"No services found for {name}")

        # Simple round-robin selection
        import random
        return random.choice(services)

# Usage
registry = ServiceRegistry()

# Services register on startup
registry.register_service('inventory', 'http://inventory-1:8005')
registry.register_service('inventory', 'http://inventory-2:8005')

# API Gateway gets service from registry
inventory_url = registry.get_service('inventory')
```

### Load Balancing Services

```
API Gateway → Service Discovery → Multiple service instances
```

```python
class LoadBalancer:
    def __init__(self, service_discovery):
        self.discovery = service_discovery

    async def get_service_url(self, service_name: str) -> str:
        return await self.discovery.get_service(service_name)

    async def call_service(self, service_name: str, endpoint: str, **kwargs):
        service_url = await self.get_service_url(service_name)
        url = f"{service_url}{endpoint}"

        try:
            response = await httpx.request(
                method="POST",
                url=url,
                json=kwargs
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            print(f"Service error: {e.response.status_code} - {e.response.text}")
            raise ServiceError(f"Service {service_name} returned error")
```

---

## Deployment Strategies

### Containerization

```
Monolith Deployment:
├── Single container
└── Single instance (or few instances with LB)

Microservices Deployment:
├── Each service in its own container
└── Multiple instances per service with LB
```

### Container Orchestration with Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
        - name: api-gateway
          image: api-gateway:v1.0.0
          ports:
            - containerPort: 80
          env:
            - name: SERVICES_BASE_URL
              value: "http://service-discovery:5000"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inventory-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: inventory-service
  template:
    metadata:
      labels:
        app: inventory-service
    spec:
      containers:
        - name: inventory-service
          image: inventory-service:v1.0.0
          ports:
            - containerPort: 80
          env:
            - name: DATABASE_URL
              value: "postgresql://user:pass@postgres:5432/inventory"
```

---

## Monitoring and Observability

### Logging Strategy

```
Structured Logging:
├── Use JSON format
├── Include correlation ID for request tracing
├── Include service name and version
├── Use log levels (INFO, WARN, ERROR)

Centralized Logging:
├── Send all logs to centralized system
├── Use ELK Stack (Elasticsearch, Logstash, Kibana)
└── Include service and version fields
```

### Distributed Tracing

```
Request Tracing Flow:
Client Request (trace_id=abc123)
    ↓
API Gateway
  ├─→ Auth Service (trace_id=abc123)
  ├─→ Order Service (trace_id=abc123)
  ├─→ Payment Service (trace_id=abc123)
  └─→ Inventory Service (trace_id=abc123)

Trace Span Structure:
trace_id=abc123
├── span_1: API Gateway received request
├── span_2: Auth Service validated token
├── span_3: Order Service created order
├── span_4: Inventory Service checked inventory
└── span_5: Payment Service processed payment
```

### Metrics Collection

```
Metrics to Track Per Service:
- Request rate (QPS)
- Response time (P50, P95, P99)
- Error rate
- CPU/memory usage
- Database connection pool usage
- Message queue depth
- Cache hit rate
- Circuit breaker state
```

---

## Common Pitfalls

### 1. Distributed Transactions

```
Problem: Need atomic transaction across services
Solution:
- Saga pattern (chained local transactions)
- TCC (Try-Confirm-Cancel)
- Event sourcing

Example: Order Processing
1. Order Service creates order
2. Payment Service processes payment
3. Inventory Service reserves items
4. Email Service sends confirmation

All or none succeeds, with compensation for failures
```

### 2. Data Ownership Conflicts

```
Problem: Same data owned by multiple services
Solution:
- Clear ownership boundaries
- Create shared data access layers
- Use CQRS pattern (separate read/write models)
```

### 3. Service Discovery Issues

```
Problem: How to find services dynamically?
Solution:
- Service registry (ZooKeeper, etcd, Consul)
- DNS-based discovery
- Configuration management (Spring Cloud Config, Kubernetes ConfigMaps)
- Health checks and automatic deregistration
```

### 4. Configuration Drift

```
Problem: Different services have different configurations
Solution:
- Centralized configuration (ZooKeeper etcd)
- Configuration management
- Feature flags (dark launch, canary releases)
- Immutable infrastructure

### 5. Monitoring Complexity

```

Problem: How to monitor many services?
Solution:

- Distributed tracing (OpenTelemetry, Jaeger, Zipkin)
- Centralized logging (ELK Stack)
- Metrics collection (Prometheus, Grafana)
- Alerting (PagerDuty, VictorOps)

````

---

## Testing Strategy

### Contract Testing

```python
# Test service-to-service communication
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock

class TestOrderService:
    @pytest.fixture
    def inventory_client():
        return AsyncClient(base_url='http://localhost:8005')

    @pytest.fixture
    def mock_inventory():
        return AsyncMock(spec=AsyncClient)

    async def test_check_inventory_available(self, mock_inventory):
        # Mock successful response
        mock_inventory.get.return_value = response = MockResponse(
            status_code=200,
            json={'available': True}
        )

        result = await check_inventory_available(
            inventory_client,
            product_id=123,
            quantity=2
        )

        assert result is True
        mock_inventory.get.assert_called_once()
        assert mock_inventory.get.call_count == 1

    async def test_check_inventory_unavailable(self, mock_inventory):
        # Mock not available
        mock_inventory.get.return_value = response = MockResponse(
            status_code=404,
            json={'error': 'Out of stock'}
        )

        result = await check_inventory_available(
            inventory_client,
            product_id=123,
            quantity=2
        )

        assert result is False
````

### Integration Testing

```python
# Test end-to-end flows
async def test_complete_order_flow():
    # 1. Create user
    user_response = await create_user("john", "john@example.com", "pass")
    user_id = user_response.json()['id']
    token = user_response.json()['token']

    # 2. Create order
    order_response = await create_order(
        user_id=user_id,
        items=[{'product_id': 123, 'quantity': 2}],
        token=token
    )
    order_id = order_response.json()['id']

    # 3. Process payment
    payment_response = await process_payment(
        order_id=order_id,
        amount=50.00,
        payment_method='card'
    )

    assert payment_response.status_code == 200
    assert payment_response.json()['status'] == 'paid'

    # 4. Verify order status
    order = get_order(order_id)
    assert order['status'] == 'completed'
```

### Performance Testing

```python
# Load test services
import asyncio
import time

async def load_test_service(service_url: str, concurrency: int = 10, duration: int = 30):
    print(f"Load testing {service_url}")

    async def make_request(url: str):
        async with httpx.AsyncClient() as client:
            start = time.time()
            await client.get(url)
            return time.time() - start

    tasks = [make_request(service_url) for _ in range(concurrency)]

    start_time = time.time()
    await asyncio.gather(*tasks)
    total_time = time.time() - start_time

    total_requests = concurrency * duration
    throughput = total_requests / total_time

    print(f"Throughput: {throughput:.2f} requests/sec")
    print(f"Average latency: {total_time / total_requests:.4f}s")
    print(f"P95 latency: {sorted([r - start for r in results for r in results], reverse=True)[int(len(results) * 0.95)]:.4f}s")
```

---

## Rollback Strategy

### Rollback Triggers

```
Automatic Rollback:
- Payment processing fails
- Inventory reservation fails
- Service not responding (circuit breaker)
- Data validation fails

Manual Rollback:
- Admin interface to trigger rollback
- Rollback specific transactions
- Rollback to specific point in saga
```

### Rollback Implementation

```python
class RollbackManager:
    def __init__(self):
        self.compensating_actions = []

    def add_compensating_action(self, callback):
        self.compensating_actions.append(callback)

    async def execute_rollback(self, reason: str):
        print(f"Rolling back due to: {reason}")

        # Execute compensating actions in reverse order
        for action in reversed(self.compensating_actions):
            try:
                await action()
            except Exception as e:
                print(f"Rollback action failed: {e}")

    def clear_compensating_actions(self):
        self.compensating_actions = []

# Usage
async def process_order(order_data):
    rollback = RollbackManager()

    # Step 1: Reserve inventory
    inventory_reserved = False
    async def reserve_inventory():
        nonlocal inventory_reserved
        success = await inventory_service.reserve_items(
            order_data['items']
        )
        inventory_reserved = success

        if inventory_reserved:
            rollback.add_compensating_action(
                lambda: inventory_service.release_items(order_data['items'])
            )

        await reserve_inventory()

    # Step 2: Process payment
    payment_successful = False
    async def process_payment():
        success = await payment_service.charge(
            order_data['amount']
        )
        payment_successful = success

        if payment_successful:
            # Payment succeeded, clear rollback actions
            rollback.clear_compensating_actions()
        else:
            # Payment failed, rollback
            await execute_rollback("payment_failed")
            return

    await process_payment()

    # Step 3: Confirm order
    if payment_successful:
        await order_service.confirm_order(order_data['order_id'])
```

---

## Blue-Green Deployment

### Strategy

```
Phase 1: Set up environment
├── Clone monolith to new environment
├─→ Database migration scripts
├─→ Service configuration
└─→ Monitoring setup

Phase 2: Deploy infrastructure
├─ Kubernetes cluster
└─ Service discovery (etcd, Consul)

Phase 3: Deploy services
├── API Gateway
├─ Services (one by one or batch)
└── Load balancer

Phase 4: Database setup
├── Primary databases
└── Replica databases

Phase 5: Configure blue-green routing
├── Routes: /api/* → monolith
└─ Routes: /v2/api/* → new services
```

### Kubernetes ConfigMap for Blue-Green Routing

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    spec:
      containers:
      - name: api-gateway
        image: api-gateway:v2.0
        ports:
        - containerPort: 80
        env:
          - name: V1_ENABLED
            value: "true"  # Enable v2 routes
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-v2
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway-v2
  template:
    spec:
      containers:
        - name: api-gateway-v2
        image: api-gateway:v2.0.0
        ports:
          - containerPort: 80
        env:
          - name: SERVICES_BASE_URL
            value: "http://api-gateway-v2:80"

# Traffic split
# - 95% to monolith (v1)
# - 5% to new services (v2)
```

### Traffic Management

```python
class TrafficManager:
    def __init__(self):
        self.v1_percentage = 95
        self.current_v1 = True

    async def route_request(self, headers: dict) -> tuple[str, str]:
        # Check for v2 header
        use_v2 = headers.get('X-V2-Enabled', '').lower() == 'true'

        if use_v2 or not self.current_v1:
            # Route to v1 (monolith)
            return 'v1', '/api/v1'
        else:
            # Route to v2 (new services)
            return 'v2', '/api/v2'
```

---

## Canary Deployment

### Canary Strategy

```
1. Deploy canary to 5% of traffic
2. Monitor metrics for 30 minutes
3. If metrics look good, increase to 20%
4. Continue increasing gradually
5. Monitor for 1-2 hours before going 100%
```

### Canary Configuration

```python
class CanaryDeployer:
    def __init__(self, service_name: str, total_replicas=10):
        self.service_name = service_name
        self.total_replicas = total_replicas
        self.canary_replicas = 1
        self.current_replicas = 1

    def get_traffic_percentage(self) -> float:
        return (self.current_replicas / self.total_replicas) * 100

    def deploy_canary(self):
        print(f"Deploying canary: {self.get_traffic_percentage()}% to {self.service_name}")
        # Deploy canary to 1 replica

        # Wait for stabilization
        await asyncio.sleep(60)

    def check_metrics(self) -> bool:
        # Check if metrics are within thresholds
        return self.check_performance_thresholds()

    def promote_canary(self):
        """Promote canary if metrics are good"""
        metrics_ok = self.check_metrics()

        if metrics_ok:
            print(f"Promoting canary to {(self.get_traffic_percentage() * 20):.0f}%")
            # Add more replicas
            self.current_replicas = min(
                self.current_replicas + 2,
                self.total_replicas
            )
            self.deploy_canary()
        else:
            print("Rolling back canary due to bad metrics")
            # Roll back canary
            pass
```

---

## Monitoring the Migration

### Key Metrics to Track

```
Migration Metrics:
- Migration progress (% complete)
- Errors during migration
- Rollback count
- Performance metrics (before and after)
- Data consistency (compare monolith vs microservices)
- User-facing errors
```

### Migration Dashboard

```
Metrics to Display:
- Migration timeline
- Service deployment status
- Error rate per service
- Performance comparison
- Rollback events
- Canary deployment status
```

### Automated Rollback Triggers

```
Triggers:
- Error rate > 5%: Auto rollback
- Response time > 5s: Auto rollback
- Database errors: Auto rollback
- User-reported errors: Alert for investigation
```

---

## Best Practices

### 1. Start Small

```
- Migrate least critical service first
- Test thoroughly before proceeding
- Use feature flags
- Don't migrate everything at once
- Keep monolith as backup
```

### 2. Maintain Compatibility

```
- Support both v1 and v2 during migration
- Keep API contracts stable
- Maintain data compatibility
- Version all services clearly
```

### 3. Monitor Continuously

```
- Set up comprehensive monitoring
- Set up alerts for critical metrics
- Have rollback plan ready
- Document everything

### 4. Plan for Rollbacks

```

- Know how to rollback quickly
- Have pre-written rollback scripts
- Document rollback triggers
- Test rollback procedures

```

### 5. Communication

```

- Inform all stakeholders
- Share migration schedule
- Provide regular updates
- Have escalation plan
- Document success criteria

```

### 6. Data Consistency

```

- Use dual-write during migration
- Verify data consistency
- Plan for post-migration cleanup
- Archive old data properly

```

---

## Timeline Estimate

### Small Service Migration

```

- Planning: 1 week
- Development: 2-3 weeks
- Testing: 1 week
- Canary: 2 weeks
- Full rollout: 2 weeks

Total: 6-8 weeks

```

### Large Service Migration

```

- Planning: 2-4 weeks
- Development: 4-8 weeks
- Testing: 2-4 weeks
- Canary: 2-4 weeks
- Full rollout: 4-8 weeks

Total: 12-24 weeks

```

---

## Links

- [System Design Interview Overview](overview.md)
- [Design Patterns](design-patterns.md)
- [Trade-offs in System Design](trade-offs.md)
- [Leader Election & Consensus](leader-election-consensus.md)
```
