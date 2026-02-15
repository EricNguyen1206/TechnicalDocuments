---
title: "Design Uber - Ride-Hailing System"
date: 2025-02-15
tags: ["system-design", "uber", "ride-hailing", "interview"]
description: "Complete system design for a ride-hailing service like Uber including dispatching, pricing, and real-time tracking."
author: "Eric Nguyen"
layout: "post"
---

# Design Uber - Ride-Hailing System

## Problem Statement

Design a ride-hailing system like Uber that supports:

- Rider can request rides
- Driver can accept rides
- Real-time driver tracking
- Dynamic pricing
- Payment processing
- Ratings and reviews

---

## Functional Requirements

### Rider Features

1. **Request Ride**
   - Specify pickup and drop-off locations
   - Choose ride type (economy, premium, pool)
   - Get estimated price and ETA

2. **Track Ride**
   - See driver location in real-time
   - Get trip updates
   - Cancel ride (with/without fee)

3. **Payment**
   - Multiple payment methods (card, cash, wallet)
   - Split payment
   - Receipts and history

4. **Ratings**
   - Rate driver after ride
   - Provide feedback

### Driver Features

1. **Accept Rides**
   - Receive ride requests
   - Accept or reject
   - Go offline/online

2. **Navigation**
   - Turn-by-turn navigation
   - Optimal route
   - Real-time traffic updates

3. **Earnings**
   - View daily/weekly earnings
   - Track trips
   - Cash out

4. **Profile**
   - Set availability
   - Update vehicle info
   - View ratings

### Admin Features

1. **User Management**
   - Ban users/drivers
   - Manage disputes

2. **Analytics**
   - Ride statistics
   - Revenue tracking
   - Driver performance

---

## Non-Functional Requirements

### Scale Requirements

**Assumptions:**

- 100 million daily active riders
- 5 million active drivers
- 10 million rides/day
- Peak: 2x average load

### Performance Requirements

- **Latency:**
  - Ride request response: < 500ms
  - Driver matching: < 2 seconds
  - Real-time location updates: < 100ms

- **Availability:**
  - Rider app: 99.9%
  - Driver app: 99.95%
  - Backend services: 99.99%

### Data Requirements

**Ride Data:**

- Locations (lat, lng)
- Timestamps
- Duration, distance
- Price, tips
- Driver and rider IDs

**Daily Storage:**

```
10 million rides/day × 1 KB/ride = 10 GB/day
```

---

## High-Level Architecture

```
                          ┌─────────────┐
                          │  Rider App  │
                          └──────┬──────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Load Balancer      │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      API Gateway       │
                    │  - Auth               │
                    │  - Rate Limit          │
                    │  - Routing            │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼────────┐ ┌─────▼──────┐ ┌─────▼──────┐
│  Rider Service  │ │  Dispatcher │ │  Pricing     │
└────────┬───────┘ │  Service    │ │  Service     │
         │         └─────┬──────┘ └─────────┬────┘
         │               │                   │
┌────────▼────────┐ ┌────▼────────────┐ ┌────▼────────────┐
│   Match Service  │ │  Location       │ │  Payment        │
└────────┬─────────┘ │  Service        │ │  Service        │
         │          └────┬──────────────┘ └─────┬────────────┘
         │               │                     │
┌────────▼────────┐ ┌────▼────────────┐ ┌─────▼────────────┐
│   Notification  │ │  Database       │ │  Database       │
│   Service       │ │  Cluster        │ │  Cluster        │
└─────────────────┘ └─────────────────┘ └────────────────┘┘

                          ┌─────────────┐
                          │  Driver App  │
                          └──────┬──────┘
                                 │
                    ┌────────────▼────────────┐
                    │      API Gateway       │
                    └────────────┬────────────┘
                                 │
┌────────▼────────┐ ┌─────▼──────┐ ┌─────▼──────┐
│  Driver Service │ │  Location   │ │  Earnings     │
└────────┬─────────┘ │  Service    │ │  Service     │
         │          └────┬──────┘ └─────────┬────┘
         │               │                     │
┌────────▼────────┐ ┌────▼────────────┐ ┌─────▼────────────┐
│  Notification  │ │  Database       │ │  Database       │
│   Service       │ │  Cluster        │ │  Cluster        │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## Core Services

### 1. Rider Service

**API Endpoints:**

```yaml
# Request ride
POST /api/v1/rides/request
Request:
  {
    "rider_id": "user123",
    "pickup": {"lat": 37.7749, "lng": -122.4194},
    "dropoff": {"lat": 37.7849, "lng": -122.4094},
    "ride_type": "economy"
  }
Response:
  {
    "ride_id": "ride456",
    "estimated_price": 25.50,
    "eta": 5,
    "status": "searching"
  }

# Get ride status
GET /api/v1/rides/{ride_id}

# Cancel ride
DELETE /api/v1/rides/{ride_id}
```

### 2. Driver Service

**API Endpoints:**

```yaml
# Update location
POST /api/v1/drivers/location
Request:
  {
    "driver_id": "driver789",
    "location": {"lat": 37.7749, "lng": -122.4194},
    "heading": 45
  }

# Accept ride
POST /api/v1/drivers/rides/{ride_id}/accept

# Reject ride
POST /api/v1/drivers/rides/{ride_id}/reject

# Go online/offline
POST /api/v1/drivers/status
Request:
  {
    "status": "online",
    "location": {"lat": 37.7749, "lng": -122.4194}
  }
```

### 3. Match Service

**Matching Algorithm:**

```
1. Find available drivers near pickup (radius 5km)
2. Filter by:
   - Ride type compatibility
   - Driver rating (> 4.5)
   - Driver availability (online, not in ride)
3. Sort by:
   - Distance to pickup
   - Driver rating
   - Acceptance rate
4. Send request to top N drivers
5. Wait for acceptance (timeout 30s)
6. If all reject, expand radius and repeat
7. If no driver, show "no drivers available"
```

**Implementation:**

```python
from geopy.distance import geodesic
import heapq

class MatchService:
    def __init__(self, db, notification_service):
        self.db = db
        self.notification = notification_service

    def find_driver(self, ride_request):
        pickup = ride_request.pickup
        ride_type = ride_request.ride_type

        # Find drivers within radius
        drivers = self.db.get_nearby_drivers(
            location=pickup,
            radius_km=5,
            vehicle_type=ride_type
        )

        # Filter drivers
        eligible_drivers = []
        for driver in drivers:
            if self.is_eligible(driver, ride_request):
                eligible_drivers.append(driver)

        if not eligible_drivers:
            return None  # No drivers available

        # Sort by distance and rating
        sorted_drivers = self.sort_drivers(
            eligible_drivers,
            pickup
        )

        # Send to top drivers
        for driver in sorted_drivers[:5]:
            self.notification.send_ride_request(
                driver_id=driver.id,
                ride_id=ride_request.ride_id
            )

        # Wait for acceptance
        accepted = self.wait_for_acceptance(
            ride_request.ride_id,
            timeout=30
        )

        if accepted:
            return accepted.driver
        else:
            # Expand radius and retry
            return self.find_driver(ride_request)

    def is_eligible(self, driver, ride_request):
        # Check vehicle type
        if driver.vehicle_type != ride_request.ride_type:
            return False

        # Check rating
        if driver.rating < 4.5:
            return False

        # Check availability
        if driver.status != "online":
            return False

        return True

    def sort_drivers(self, drivers, pickup_location):
        def calculate_score(driver):
            distance = geodesic(pickup_location, driver.location).km
            rating = driver.rating

            # Score: lower distance + higher rating
            return distance * 0.6 - rating * 0.4

        return sorted(drivers, key=calculate_score)

    def wait_for_acceptance(self, ride_id, timeout=30):
        # Use Redis pub/sub or message queue
        # Wait for driver acceptance event
        pass
```

### 4. Pricing Service

**Dynamic Pricing Algorithm:**

```
Base Price = $2.00
Per Mile = $1.50
Per Minute = $0.25

Dynamic Multiplier = f(Supply, Demand)

Price = (Base Price + Distance × Per Mile + Duration × Per Minute) × Multiplier
```

**Supply/Demand Calculation:**

```python
def calculate_multiplier(pickup_location, time):
    # Get available drivers in area
    available_drivers = get_drivers_nearby(pickup_location, radius=3)

    # Get ride requests in area
    pending_requests = get_pending_requests(pickup_location, radius=3)

    # Calculate ratio
    if available_drivers == 0:
        multiplier = 2.0  # Surge pricing!
    else:
        ratio = pending_requests / available_drivers

        # Surge pricing thresholds
        if ratio > 3:
            multiplier = 2.0
        elif ratio > 2:
            multiplier = 1.5
        elif ratio > 1:
            multiplier = 1.2
        else:
            multiplier = 1.0

    return multiplier
```

**Pricing API:**

```python
class PricingService:
    def calculate_price(self, pickup, dropoff, ride_type):
        # Calculate distance and duration
        distance = self.calculate_distance(pickup, dropoff)
        duration = self.calculate_duration(pickup, dropoff)

        # Get base rates
        rates = self.get_rates(ride_type)

        # Get dynamic multiplier
        multiplier = self.calculate_multiplier(pickup, datetime.now())

        # Calculate price
        price = (
            rates.base_price +
            distance * rates.per_mile +
            duration * rates.per_minute
        ) * multiplier

        return {
            "price": round(price, 2),
            "distance": distance,
            "duration": duration,
            "surge_multiplier": multiplier,
            "breakdown": {
                "base_price": rates.base_price,
                "distance_fee": distance * rates.per_mile,
                "duration_fee": duration * rates.per_minute,
                "surge_fee": price * (multiplier - 1)
            }
        }
```

### 5. Location Service

**Real-time Location Tracking:**

```python
import redis
from datetime import datetime

class LocationService:
    def __init__(self):
        self.redis = redis.Redis(host='localhost', port=6379)

    def update_driver_location(self, driver_id, location, heading):
        # Store in Redis with TTL
        key = f"driver:{driver_id}:location"
        data = {
            "lat": location["lat"],
            "lng": location["lng"],
            "heading": heading,
            "updated_at": datetime.now().isoformat()
        }
        self.redis.geoadd("drivers", location["lng"], location["lat"], driver_id)
        self.redis.hset(key, mapping=data)
        self.redis.expire(key, 60)  # Expire after 1 minute

    def get_nearby_drivers(self, location, radius_km, vehicle_type=None):
        # Redis GEO query
        driver_ids = self.redis.georadius(
            "drivers",
            longitude=location["lng"],
            latitude=location["lat"],
            radius=radius_km,
            unit="km"
        )

        # Filter by vehicle type
        drivers = []
        for driver_id in driver_ids:
            driver_data = self.db.get_driver(driver_id)
            if vehicle_type is None or driver_data["vehicle_type"] == vehicle_type:
                drivers.append(driver_data)

        return drivers
```

### 6. Notification Service

**Push Notifications:**

```
Rider:
- Driver assigned
- Driver approaching
- Ride started
- Ride completed

Driver:
- New ride request
- Ride cancelled
- Payment received
```

**Implementation:**

```python
class NotificationService:
    def send_ride_request(self, driver_id, ride_request):
        message = {
            "type": "ride_request",
            "ride_id": ride_request.ride_id,
            "pickup": ride_request.pickup,
            "dropoff": ride_request.dropoff,
            "price": ride_request.price,
            "expires_at": datetime.now() + timedelta(seconds=30)
        }

        # Send via push notification
        self.send_push(driver_id, message)

    def send_to_rider(self, rider_id, notification_type, data):
        message = {
            "type": notification_type,
            "data": data
        }

        self.send_push(rider_id, message)
```

---

## Data Models

### User Tables

```sql
CREATE TABLE riders (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    name VARCHAR(100),
    rating DECIMAL(3,2) DEFAULT 5.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE drivers (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    name VARCHAR(100),
    vehicle_type VARCHAR(20),
    vehicle_number VARCHAR(20),
    rating DECIMAL(3,2) DEFAULT 5.0,
    status VARCHAR(20) DEFAULT 'offline',
    current_location POINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Ride Tables

```sql
CREATE TABLE rides (
    id BIGSERIAL PRIMARY KEY,
    rider_id BIGINT REFERENCES riders(id),
    driver_id BIGINT REFERENCES drivers(id),
    pickup_location POINT NOT NULL,
    dropoff_location POINT NOT NULL,
    status VARCHAR(20) DEFAULT 'requested',
    ride_type VARCHAR(20),
    distance_km DECIMAL(10,2),
    duration_minutes INTEGER,
    price DECIMAL(10,2),
    surge_multiplier DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_rider ON rides(rider_id, created_at DESC);
CREATE INDEX idx_rides_driver ON rides(driver_id, created_at DESC);
```

### Location Tables

```sql
-- Driver location updates (time-series)
CREATE TABLE driver_locations (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT REFERENCES drivers(id),
    location POINT NOT NULL,
    heading DECIMAL(5,2),
    speed_kmh DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partition by time
CREATE INDEX idx_driver_locations_driver_time ON driver_locations(driver_id, created_at DESC);
```

---

## Database Design

### Sharding Strategy

**Shard by Geographic Region:**

```
Database Cluster
    ├── US_East (riders, rides in US East)
    ├── US_West (riders, rides in US West)
    ├── EU_West (riders, rides in EU West)
    └── AP_Southeast (riders, rides in AP)
```

**Benefits:**

- Low latency (regional)
- High availability
- Independent scaling

**Geo-distribution:**

```
Request from user in Singapore
    ↓
Route to AP_Southeast shard
    ↓
Match drivers in Singapore only
```

### Replication

```
Primary Region (Master + 2 Replicas)
    ├── Write → Master
    └── Read → Master or Replicas

Replica Regions (Read-only replicas)
    ├── AP_Southeast (replica from primary)
    ├── EU_West (replica from primary)
    └── US_East (replica from primary)
```

---

## Caching Strategy

### Redis Caching

```
Cache hot data:
- Driver locations (TTL: 1 minute)
- Active rides (TTL: 5 minutes)
- Pricing calculations (TTL: 15 minutes)
- Driver availability (TTL: 1 minute)
```

**Implementation:**

```python
# Cache driver location
redis.setex(
    f"driver:{driver_id}:location",
    60,  # 1 minute TTL
    json.dumps(location_data)
)

# Get nearby drivers from cache
nearby_drivers = redis.georadius(
    "drivers",
    longitude=lng,
    latitude=lat,
    radius=5,
    unit="km"
)
```

### Cache Hit Rate Targets

- Driver location: > 95%
- Active rides: > 90%
- Pricing: > 85%

---

## Real-time Communication

### WebSocket for Live Updates

**Rider WebSocket:**

```javascript
// Rider receives updates
const socket = new WebSocket("wss://api.uber.com/rides")

socket.on("driver_assigned", (data) => {
  console.log("Driver assigned:", data.driver)
  updateMap(data.driver.location)
})

socket.on("driver_arriving", (data) => {
  showNotification("Driver arriving in " + data.eta + " minutes")
})
```

**Driver WebSocket:**

```javascript
// Driver receives requests
const socket = new WebSocket("wss://api.uber.com/drivers")

socket.on("ride_request", (data) => {
  showRideRequest(data)
})

socket.send(
  JSON.stringify({
    type: "accept",
    ride_id: data.ride_id,
  }),
)
```

### Fallback: Server-Sent Events (SSE)

```
For platforms without WebSocket support:
Use SSE for one-way updates
```

---

## Load Balancing

### Geographic Load Balancing

```
User Request
    ↓
DNS / GeoDNS
    ↓
Route to nearest region
    ↓
Regional Load Balancer
    ↓
Application Servers
```

### Service-specific Load Balancers

```
API Gateway
    ├── LB for Match Service
    ├── LB for Pricing Service
    ├── LB for Location Service
    └── LB for Notification Service
```

---

## Security Considerations

### Authentication

- JWT tokens for API auth
- OAuth 2.0 for social login
- Refresh token rotation

### Authorization

- Role-based access (rider, driver, admin)
- Resource-based access (only access own rides)
- Admin endpoints restricted

### Encryption

- TLS for all API communication
- Payment data encrypted
- Location data encrypted at rest

### Rate Limiting

```
Per user:
- 10 ride requests/hour
- 100 location updates/hour

Per IP:
- 1000 API requests/minute
```

---

## Monitoring and Analytics

### Metrics to Track

```
Business Metrics:
- Rides per minute
- Average wait time
- Average ride duration
- Cancellation rate
- Driver acceptance rate

System Metrics:
- API response times (P50, P95, P99)
- WebSocket connections
- Database query times
- Cache hit rates
- Error rates by service
```

### Alerting

```
Alert on:
- Match service > 10s latency
- API error rate > 1%
- Database connections > 80%
- Notification service down
- Price calculation errors
```

---

## Scalability Considerations

### Write Scalability

- Database sharding by region
- Write queues for location updates
- Async ride matching

### Read Scalability

- Read replicas in each region
- Caching layer (Redis cluster)
- CDN for static assets

### Service Scalability

- Stateless services (except match service)
- Horizontal scaling via auto-scaling groups
- Container orchestration (Kubernetes)

---

## Edge Cases and Solutions

### 1. No Drivers Available

```
Solution:
- Expand search radius gradually
- Show "no drivers" message
- Offer "schedule for later"
- Suggest nearby pickup location
```

### 2. Driver Cancels After Accepting

```
Solution:
- Penalty for driver (lower rating)
- Find new driver automatically
- Notify rider of new ETA
- Cancelation fee after certain time
```

### 3. Rider Cancels

```
Solution:
- No fee if cancelled within 2 minutes
- Fee if cancelled after 2 minutes
- Notify driver immediately
- Release driver back to pool
```

### 4. App Crash During Ride

```
Solution:
- Resume ride on app reopen
- Sync ride status from server
- Both rider and driver can continue
```

### 5. GPS Signal Loss

```
Solution:
- Cache last known location
- Use cellular triangulation (fallback)
- Notify user of signal loss
- Auto-complete if no signal for X minutes
```

---

## Follow-up Questions

1. **How to handle pool rides (multiple riders)?**
   - Match riders with similar routes
   - Optimize pickup/dropoff sequence
   - Dynamic pricing adjustment

2. **How to prevent driver fraud?**
   - Track driver behavior
   - Verify ride completion
   - GPS validation
   - Rider confirmation required

3. **How to handle disputes?**
   - Ride recordings (GPS, audio)
   - Evidence collection
   - Dispute resolution workflow
   - Refund policy

4. **How to optimize driver utilization?**
   - Predictive positioning
   - Queue management
   - Incentive programs for high-demand areas

5. **How to handle surge pricing?**
   - Multiplier limits (max 3x)
   - Geographic zones
   - Time-based rules
   - User notifications

---

## Links

- [System Design Interview Overview](overview.md)
- [Trade-offs in System Design](trade-offs.md)
- [Design Patterns](design-patterns.md)
- [Design WhatsApp](whatsapp-design.md)
