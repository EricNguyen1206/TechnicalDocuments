---
title: "Networking Fundamentals for System Design"
date: 2025-02-15
tags: ["system-design", "networking", "dns", "websocket"]
description: "Essential networking concepts including DNS, HTTP protocols, polling, and WebSockets."
author: "Eric Nguyen"
layout: "post"
---

# Networking Fundamentals for System Design

## DNS (Domain Name System)

### How DNS Works

```
User types: www.example.com
    ↓
1. Check Browser Cache
    ↓ (not found)
2. Check OS Cache
    ↓ (not found)
3. Query Recursive Resolver
    ↓
4. Query Root Server (.)
    ↓ (returns .com TLD servers)
5. Query TLD Server (com)
    ↓ (returns example.com nameservers)
6. Query Authoritative Server (example.com)
    ↓ (returns IP address)
7. Cache and Return IP to user
```

### DNS Record Types

| Type  | Purpose               | Example             |
| ----- | --------------------- | ------------------- |
| A     | IPv4 address          | `192.0.2.1`         |
| AAAA  | IPv6 address          | `2001:db8::1`       |
| CNAME | Alias to another name | `www → example.com` |
| MX    | Mail server           | `mail.example.com`  |
| TXT   | Text records          | SPF, DKIM           |
| NS    | Nameserver            | `ns1.example.com`   |

### DNS Caching

- **TTL (Time To Live)**: How long to cache
- Browser cache: ~1-5 minutes
- OS resolver cache: ~30 minutes
- ISP cache: Hours to days

### DNS Design Considerations

**High Availability:**

- Multiple nameservers (NS records)
- Anycast DNS
- DNS load balancing

**Latency:**

- GeoDNS: Route to nearest server
- CDN integration: Cache at edge

---

## HTTP/HTTPS

### HTTP vs HTTPS

| Feature     | HTTP            | HTTPS           |
| ----------- | --------------- | --------------- |
| Encryption  | No              | Yes (TLS/SSL)   |
| Port        | 80              | 443             |
| SEO         | Lower ranking   | Higher ranking  |
| Performance | Slightly faster | Slightly slower |

### HTTP Methods

| Method  | Safe | Idempotent | Use Case                 |
| ------- | ---- | ---------- | ------------------------ |
| GET     | Yes  | Yes        | Retrieve data            |
| POST    | No   | No         | Create resource          |
| PUT     | No   | Yes        | Update/Replace resource  |
| PATCH   | No   | No         | Partial update           |
| DELETE  | No   | Yes        | Delete resource          |
| HEAD    | Yes  | Yes        | Get headers only         |
| OPTIONS | Yes  | Yes        | Discover allowed methods |

### HTTP Status Codes

**2xx Success:**

- 200 OK
- 201 Created
- 204 No Content

**3xx Redirection:**

- 301 Moved Permanently
- 302 Found
- 304 Not Modified

**4xx Client Error:**

- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 429 Too Many Requests

**5xx Server Error:**

- 500 Internal Server Error
- 502 Bad Gateway
- 503 Service Unavailable
- 504 Gateway Timeout

---

## Polling Strategies

### Short Polling

```
Client          Server
  |                |
  |----Request--->|
  |<--Response----|
  |   (Data/Empty)|
  |                |
  |    Wait 1s     |
  |                |
  |----Request--->|
  |<--Response----|
  |                |
```

**Implementation:**

```javascript
setInterval(async () => {
  const response = await fetch("/updates")
  if (response.data) {
    displayUpdates(response.data)
  }
}, 1000) // Poll every second
```

**Pros:**

- Simple to implement
- Works everywhere

**Cons:**

- Wasteful (many empty responses)
- High server load
- Not real-time
- Battery drain on mobile

### Long Polling

```
Client          Server
  |                |
  |----Request--->|
  |   (Holds)      |
  |                |
  |   (Wait)       |
  |                |
  |<--Response----|
  |   (Data)       |
  |----Request--->|
  |                |
```

**Implementation:**

```javascript
async function longPoll() {
  while (true) {
    const response = await fetch("/updates", {
      timeout: 30000, // 30 second timeout
    })
    if (response.data) {
      displayUpdates(response.data)
    }
  }
}
```

**Pros:**

- Reduced server load
- More efficient than short polling
- Better battery life

**Cons:**

- Connection overhead
- May need timeouts
- Still not truly real-time

---

## WebSocket

### What is WebSocket?

WebSocket provides full-duplex communication over a single TCP connection.

```
Client          Server
  |                |
  |---HTTP Upgrade->|
  |<--101 Switching-|
  |   (WebSocket)  |
  |                |
  |<---Message----|
  |---Message---->|
  |<---Message----|
  |---Message---->|
  |   (Real-time)   |
```

### WebSocket Lifecycle

1. **Handshake**: HTTP upgrade request
2. **Connection**: Persistent TCP connection
3. **Data Transfer**: Full-duplex messages
4. **Closure**: Either party can close

### WebSocket Implementation

**Client:**

```javascript
const socket = new WebSocket("wss://api.example.com")

socket.onopen = () => {
  console.log("Connected")
  socket.send(JSON.stringify({ type: "subscribe", channel: "news" }))
}

socket.onmessage = (event) => {
  const data = JSON.parse(event.data)
  updateUI(data)
}

socket.onerror = (error) => {
  console.error("WebSocket error:", error)
}

socket.onclose = () => {
  console.log("Disconnected")
  // Implement reconnect logic
}
```

**Server (Node.js):**

```javascript
const WebSocket = require("ws")
const wss = new WebSocket.Server({ port: 8080 })

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message)
    handleMessage(data, ws)
  })

  // Broadcast to all clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ data: "Hello" }))
    }
  })
})
```

### WebSocket vs Polling

| Aspect      | Short Polling | Long Polling | WebSocket |
| ----------- | ------------- | ------------ | --------- |
| Latency     | High          | Medium       | Low       |
| Server Load | High          | Medium       | Low       |
| Real-time   | No            | No           | Yes       |
| Bandwidth   | High          | Medium       | Low       |
| Complexity  | Low           | Low          | High      |

---

## Real-Time Communication Options

### Server-Sent Events (SSE)

```
Client          Server
  |                |
  |---Request--->|
  |<---Stream----|
  |   (Events)     |
  |<---Event------|
  |<---Event------|
  |                |
```

**Characteristics:**

- One-way (Server → Client)
- HTTP-based
- Automatic reconnection
- Text-only

**Use Cases:**

- Stock tickers
- News feeds
- Live scores

### WebSocket

**Characteristics:**

- Full-duplex (Both directions)
- Binary and text support
- Lower latency

**Use Cases:**

- Chat applications
- Multiplayer games
- Real-time collaboration

### WebRTC

**Characteristics:**

- Peer-to-peer (P2P)
- Audio/Video
- Data channels

**Use Cases:**

- Video calls
- Screen sharing
- File transfer (P2P)

---

## CDN (Content Delivery Network)

### How CDN Works

```
User Request
    ↓
DNS returns nearest CDN edge
    ↓
Edge Server (Cache Hit) → User
    OR
Edge Server (Cache Miss) → Origin → Edge → User
```

### CDN Benefits

- **Reduced Latency**: Content served from nearby servers
- **Lower Bandwidth**: Cached content doesn't hit origin
- **Higher Availability**: Multiple edge locations
- **DDoS Protection**: Absorbs attack traffic

### CDN Caching Strategies

**Static Content:**

- HTML, CSS, JS, Images
- Long TTL (hours/days)
- Cache at edge

**Dynamic Content:**

- API responses
- Short TTL (seconds/minutes)
- Cache at edge or application

---

## Load Balancing

### Layer 4 (Transport Layer)

- Load balances based on IP/Port
- Fast and efficient
- No content inspection

### Layer 7 (Application Layer)

- Load balances based on HTTP content
- Can route based on URL, headers
- More intelligent but slower

---

## Links

- [System Design Interview Overview](overview.md)
- [Distributed Systems](distributed-systems.md)
- [Load Balancing Deep Dive](../devops/kubernetes-advanced.md)
