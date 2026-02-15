---
title: "Design WhatsApp - Messaging System"
date: 2025-02-15
tags: ["system-design", "whatsapp", "messaging", "chat"]
description: "Complete system design for a messaging service like WhatsApp including real-time chat, media sharing, and group features."
author: "Eric Nguyen"
layout: "post"
---

# Design WhatsApp - Messaging System

## Problem Statement

Design a messaging service like WhatsApp that supports:

- One-on-one and group chat
- Real-time messaging
- Media sharing (images, videos, files)
- Online/offline status
- Message delivery receipts
- End-to-end encryption
- Offline message queuing

---

## Functional Requirements

### Core Features

**One-on-One Chat:**

- Send text messages
- Send/receive images, videos, documents
- Voice messages
- Real-time typing indicators
- Read receipts (blue ticks)
- Delivery receipts (grey ticks)

**Group Chat:**

- Create groups (up to 1024 members)
- Add/remove members
- Group admin permissions
- Group profile picture
- Group name/description

**Status & Presence:**

- Online/offline status
- Last seen timestamp
- Profile picture
- About/bio section

**Media:**

- Image compression
- Video compression
- File upload (up to 100MB)
- Thumbnail generation
- Media CDN delivery

**Privacy:**

- Block users
- Report users
- Privacy settings (last seen, profile photo)

---

## Non-Functional Requirements

### Scale Requirements

**Assumptions:**

- 2 billion monthly active users
- 10 billion daily messages
- 5 billion daily media uploads
- 100 million concurrent connections
- 10:1 read/write ratio for messages

### Performance Requirements

- **Latency:**
  - Message delivery: < 200ms
  - Media upload: < 5 seconds (first 100KB)
  - Presence updates: < 500ms

- **Availability:** 99.99%

### Data Requirements

**Daily Storage:**

```
Text messages: 5B × 100 bytes = 500 GB
Media files: 5B × 500 KB avg = 2.5 PB
Media thumbnails: 5B × 10 KB = 50 GB
Total: ~3 PB/day
```

---

## High-Level Architecture

```
                      ┌───────────┐
                      │   Clients  │
                      └─────┬─────┘
                            │
                ┌─────────▼─────────┐
                │   Load Balancer   │
                └─────────┬─────────┘
                          │
          ┌─────────────┼─────────────┐
          │             │             │
    ┌─────▼─────┐ ┌──▼──────┐ ┌──▼──────┐
    │   Client   │ │ Presence │ │ Media  │
    │ Service  │ │ Service │ │ Service │
    └─────┬─────┘ └──┬───────┘ └──┬───────┘
          │             │             │
          └─────────┬─────┴─────────┘
                    │
          ┌─────────▼─────────┐
          │   Message Queue   │
          │   (Kafka)        │
          └─────────┬─────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼─────┐  ┌────▼─────┐  ┌────▼─────┐
│  Storage │  │ Presence  │  │  Media   │
│ Service  │  │  Service  │  │  Service  │
└─────┬─────┘  └─────┬───────┘  └─────┬───────┘
      │              │               │
      │         ┌────┴───────┐       │
      │         │                │       │
┌─────▼─────────▼──┐    ┌────────▼─────┐
│  Database Cluster  │    │ Object Storage │
│   (Cassandra)     │    │ (S3, GCS)    │
│                   │    │                │
└───────────────────┘    └────────────────┘
```

---

## API Design

### Messaging APIs

```yaml
# Send message
POST /api/v1/messages
Request:
  {
    "recipient_id": "user123",
    "content": "Hello world!",
    "media_id": "media456",  # optional
    "message_type": "text"  # text, image, video, audio, document
  }
Response:
  {
    "message_id": "msg789",
    "timestamp": "2025-02-15T10:00:00Z",
    "status": "queued"
  }

# Get messages (pagination)
GET /api/v1/chats/{chat_id}/messages
Query Params:
  - before_id: "msg789"  # pagination
  - limit: 50
Response:
  {
    "messages": [...],
    "has_more": true
  }

# Mark as read
POST /api/v1/messages/{message_id}/read
Response:
  {
    "success": true
  }
```

### Media APIs

```yaml
# Upload media
POST /api/v1/media/upload
Content-Type: multipart/form-data
Response:
  {
    "media_id": "media456",
    "url": "https://cdn.whatsapp.com/media/456.jpg",
    "thumbnail_url": "https://cdn.whatsapp.com/thumbnails/456.jpg",
    "size": 1024000
  }

# Get media
GET /api/v1/media/{media_id}
Response:
  Returns file or redirect to CDN
```

### Presence APIs

```yaml
# Update presence
POST /api/v1/presence
Request:
  {
    "status": "online",  # online, offline, away
    "last_seen": "2025-02-15T10:00:00Z"
  }

# Get presence
GET /api/v1/presence/{user_id}
Response:
  {
    "status": "online",
    "last_seen": "2025-02-15T10:00:00Z"
  }
```

---

## Data Models

### User Table

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    profile_picture_url TEXT,
    about TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_username (username)
);
```

### Chat Table

```sql
CREATE TABLE chats (
    id BIGSERIAL PRIMARY KEY,
    chat_type VARCHAR(20),  -- individual, group
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Chat Participants Table

```sql
CREATE TABLE chat_participants (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20),  -- admin, member
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (chat_id, user_id),
    INDEX idx_chat (chat_id),
    INDEX idx_user (user_id)
);
```

### Messages Table

```sql
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
    sender_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    media_id VARCHAR(100),
    message_type VARCHAR(20),  -- text, image, video, audio, document
    status VARCHAR(20),  -- sent, delivered, read, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_chat_created (chat_id, created_at DESC),
    INDEX idx_sender (sender_id, created_at DESC)
);
```

### Message Receipts Table

```sql
CREATE TABLE message_receipts (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT REFERENCES messages(id) ON DELETE CASCADE,
    recipient_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20),  -- delivered, read, failed
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    UNIQUE (message_id, recipient_id),
    INDEX idx_message (message_id),
    INDEX idx_recipient (recipient_id, status)
);
```

### Groups Table

```sql
CREATE TABLE groups (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
    name VARCHAR(100),
    description TEXT,
    profile_picture_url TEXT,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Database Design

### Sharding Strategy

**Shard by Chat ID:**

```
Shard 0: Chat IDs ending in 0, 4, 8, c...
Shard 1: Chat IDs ending in 1, 5, 9, d...
Shard 2: Chat IDs ending in 2, 6, a, e...
Shard 3: Chat IDs ending in 3, 7, b, f...
```

**Benefits:**

- Even distribution
- Efficient queries for specific chat
- Simple to implement

**Cassandra Data Model:**

```sql
-- Messages table (partition key: chat_id, clustering key: created_at)
CREATE TABLE messages (
    chat_id UUID,
    created_at TIMESTAMP,
    message_id UUID,
    sender_id UUID,
    content TEXT,
    media_id VARCHAR(100),
    message_type VARCHAR(20),
    status VARCHAR(20),
    PRIMARY KEY (chat_id, created_at, message_id)
);

-- Chat metadata
CREATE TABLE chats (
    chat_id UUID PRIMARY KEY,
    chat_type VARCHAR(20),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Chat participants
CREATE TABLE chat_participants (
    chat_id UUID,
    user_id UUID,
    role VARCHAR(20),
    added_at TIMESTAMP,
    PRIMARY KEY (chat_id, user_id)
);
```

---

## Real-Time Communication

### WebSocket Connection Flow

```
Client
  │
  ├───[1] WebSocket Upgrade───> WebSocket Server
  │<──[2] 101 Switching Protocols───
  │
  │<──[3] Connection Established───
  │
  ├───[4] Send Message──────> Server
  │<──[5] Broadcast to Recipient───
  │
  └──[6] Receive Message──────< Server
```

### WebSocket Implementation

```javascript
// Client-side
class WhatsAppClient {
  constructor() {
    this.socket = null
    this.userId = null
  }

  connect() {
    this.socket = new WebSocket("wss://api.whatsapp.com/ws")

    this.socket.onopen = () => {
      console.log("Connected to WebSocket")
      this.authenticate()
    }

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      this.handleMessage(message)
    }

    this.socket.onclose = () => {
      console.log("Disconnected, reconnecting in 5s...")
      setTimeout(() => this.connect(), 5000)
    }

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error)
    }
  }

  authenticate() {
    const authMessage = {
      type: "auth",
      token: localStorage.getItem("jwt_token"),
    }
    this.socket.send(JSON.stringify(authMessage))
  }

  sendMessage(recipientId, content, messageType = "text") {
    const message = {
      type: "message",
      recipient_id: recipientId,
      content: content,
      message_type: messageType,
      timestamp: new Date().toISOString(),
    }
    this.socket.send(JSON.stringify(message))
  }

  markAsRead(messageId) {
    const message = {
      type: "read_receipt",
      message_id: messageId,
    }
    this.socket.send(JSON.stringify(message))
  }

  handleMessage(message) {
    switch (message.type) {
      case "message":
        this.displayMessage(message)
        break
      case "read_receipt":
        this.updateMessageStatus(message.message_id, "read")
        break
      case "presence":
        this.updatePresence(message.user_id, message.status)
        break
      case "typing":
        this.showTypingIndicator(message.sender_id)
        break
    }
  }
}

// Usage
const client = new WhatsAppClient()
client.connect()
```

### Server-Side WebSocket Handler

```python
import asyncio
import json
from websockets import WebSocket

class WhatsAppWebSocketServer:
    def __init__(self):
        self.active_connections = {}
        self.user_sockets = {}  # user_id -> socket

    async def handle_client(self, websocket, path):
        await self.register(websocket)

        try:
            async for message in websocket:
                await self.process_message(websocket, message)
        except Exception as e:
            await self.unregister(websocket)

    async def register(self, websocket):
        await websocket.accept()
        user_id = await self.authenticate(websocket)

        if user_id:
            self.active_connections[websocket] = user_id
            self.user_sockets[user_id] = websocket

            # Broadcast online status
            await self.broadcast_presence(user_id, 'online')

    async def unregister(self, websocket):
        user_id = self.active_connections.pop(websocket, None)

        if user_id and user_id in self.user_sockets:
            del self.user_sockets[user_id]

            # Broadcast offline status
            await self.broadcast_presence(user_id, 'offline')

    async def process_message(self, websocket, message):
        data = json.loads(message)

        if data['type'] == 'message':
            await self.handle_message(websocket, data)
        elif data['type'] == 'read_receipt':
            await self.handle_read_receipt(data)

    async def handle_message(self, websocket, data):
        recipient_id = data['recipient_id']
        user_socket = self.user_sockets.get(recipient_id)

        if user_socket:
            # Send to recipient if online
            await user_socket.send(json.dumps(data))
            # Update message status to delivered
            await self.update_message_status(
                data['message_id'],
                'delivered'
            )
        else:
            # Queue for offline delivery
            await self.queue_offline_message(recipient_id, data)

    async def broadcast_presence(self, user_id, status):
        # Broadcast to user's contacts
        contacts = await self.get_user_contacts(user_id)

        for contact_id in contacts:
            if contact_id in self.user_sockets:
                presence_message = {
                    'type': 'presence',
                    'user_id': user_id,
                    'status': status
                }
                await self.user_sockets[contact_id].send(
                    json.dumps(presence_message)
                )
```

---

## Media Management

### Upload Flow

```
Client
  │
  ├───[1] Upload to CDN───> CDN Upload Endpoint
  │<──[2] Media ID (async)───
  │
  ├───[3] Send Message with Media ID───> Server
  │<──[4] Message Queued───
  │
  └──[5] Download Media───< CDN
```

### CDN Configuration

```
Upload URL: https://upload.whatsapp.com/media
Download URL: https://cdn.whatsapp.com/media/{media_id}

CDN Caching:
- Images: 1 year
- Videos: 1 year
- Thumbnails: 1 year

Image Optimization:
- Generate multiple resolutions
- WebP format support
```

---

## Message Queuing

### Kafka Topics

```
messages-topic: All messages
  Partition: chat_id
  Replication Factor: 3
  Retention: 7 days

presence-topic: Online/offline events
  Partition: user_id
  Replication Factor: 3
  Retention: 24 hours

notifications-topic: Push notifications
  Partition: user_id
  Replication Factor: 3
  Retention: 7 days
```

### Message Producer

```python
from kafka import KafkaProducer
import json

class MessageProducer:
    def __init__(self):
        self.producer = KafkaProducer(
            bootstrap_servers=['kafka1:9092', 'kafka2:9092', 'kafka3:9092'],
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )

    def send_message(self, topic, message):
        future = self.producer.send(
            topic=topic,
            value=message,
            key=message['chat_id']  # Partition by chat_id
        )

        # Callback for delivery reports
        future.add_callback(self.delivery_report)

        return future

    def delivery_report(self, metadata, exception):
        if exception:
            print(f"Message delivery failed: {exception}")
        else:
            print(f"Message delivered: {metadata}")
```

### Message Consumer

```python
from kafka import KafkaConsumer
import json

class MessageConsumer:
    def __init__(self, message_handler):
        self.consumer = KafkaConsumer(
            'messages-topic',
            bootstrap_servers=['kafka1:9092', 'kafka2:9092', 'kafka3:9092'],
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            group_id='message-consumers',
            auto_offset_reset='latest'
        )
        self.message_handler = message_handler

    def start_consuming(self):
        for message in self.consumer:
            try:
                self.message_handler.handle(message.value)
                # Commit offset after processing
                self.consumer.commit()
            except Exception as e:
                print(f"Error processing message: {e}")
                # Move to dead-letter queue on retry limit

# Message handler
async def handle_message(message):
    recipient_id = message['recipient_id']

    # Check if recipient is online
    is_online = await websocket_server.is_user_online(recipient_id)

    if is_online:
        # Send via WebSocket
        await websocket_server.send_to_user(recipient_id, message)
    else:
        # Send push notification
        await push_service.send(recipient_id, {
            'type': 'new_message',
            'data': message
        })
```

---

## Offline Message Queue

### Offline Message Storage

```
User Message Queue (Redis)
├── user123: [msg1, msg2, msg3, ...]
├── user456: [msg4, msg5, ...]
└── ...

When user comes online:
1. Get all queued messages
2. Send via WebSocket
3. Clear queue
```

### Implementation

```python
import redis
import json

class OfflineMessageQueue:
    def __init__(self):
        self.redis = redis.Redis(host='localhost', port=6379, db=0)

    def queue_message(self, user_id, message):
        queue_key = f"offline_messages:{user_id}"

        # Add to queue
        self.redis.rpush(queue_key, json.dumps(message))

        # Set expiration (7 days)
        self.redis.expire(queue_key, 7 * 24 * 60 * 60)

    def get_queued_messages(self, user_id):
        queue_key = f"offline_messages:{user_id}"

        # Get all messages
        messages_json = self.redis.lrange(queue_key, 0, -1)

        if messages_json:
            messages = [json.loads(msg) for msg in messages_json]

            # Clear queue
            self.redis.delete(queue_key)

            return messages

        return []

    def get_queue_size(self, user_id):
        queue_key = f"offline_messages:{user_id}"
        return self.redis.llen(queue_key)
```

---

## End-to-End Encryption

### Signal Protocol

```
1. Key Exchange:
   - Public keys exchanged via server
   - DH (Diffie-Hellman) key agreement

2. Session Key:
   - Ephemeral session key for each chat
   - Server never has access

3. Encryption:
   - Messages encrypted with session key
   - Only sender and recipient can decrypt

4. Message Authentication:
   - MAC (Message Authentication Code)
   - Ensures message integrity
```

### Implementation

```python
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

class EncryptionManager:
    def __init__(self):
        self.backend = default_backend()

    def generate_key_pair(self):
        private_key = self.backend.generate_private_key()
        public_key = private_key.public_key()
        return private_key, public_key

    def encrypt_message(self, message: str, public_key):
        # Generate ephemeral key
        ephemeral_key = self.backend.generate_private_key()
        ephemeral_public_key = ephemeral_key.public_key()

        # Encrypt message with ephemeral key
        cipher = Cipher(
            algorithms.AES(self.backend),
            modes.CBC(self.backend)
        )
        encrypted = cipher.encrypt_padded(message.encode())

        # Encrypt ephemeral key with recipient's public key
        rsa_padding = padding.OAEP(
            mgf=padding.MGF1(algorithms.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
        key_cipher = ephemeral_public_key.public_key().encrypt(
            ephemeral_key,
            rsa_padding
        )

        return {
            'encrypted_message': encrypted.hex(),
            'encrypted_key': key_cipher.hex()
        }

    def decrypt_message(self, encrypted_data: str, private_key):
        # Decrypt ephemeral key
        rsa_padding = padding.OAEP(
            mgf=padding.MGF1(algorithms.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
        ephemeral_key = private_key.decrypt(
            bytes.fromhex(encrypted_data['encrypted_key']),
            rsa_padding
        )

        # Decrypt message
        cipher = Cipher(
            ephemeral_key,
            modes.CBC(self.backend)
        )
        decrypted = cipher.decrypt_padded(
            bytes.fromhex(encrypted_data['encrypted_message'])
        )

        return decrypted.decode()
```

---

## Notification Service

### Push Notifications

```
Push Service
  ├── Firebase Cloud Messaging (Android)
  ├── Apple Push Notification Service (iOS)
  └── Windows Push Notification Services
```

### Notification Types

```yaml
# New message
{
  "type": "new_message",
  "data": {
    "message_id": "msg123",
    "sender_id": "user456",
    "content": "Hello!",
    "chat_id": "chat789"
  }
}

# Message read receipt
{
  "type": "read_receipt",
  "data": {
    "message_id": "msg123",
    "reader_id": "user456",
    "timestamp": "2025-02-15T10:00:00Z"
  }
}

# Group chat
{
  "type": "group_message",
  "data": {
    "message_id": "msg123",
    "group_id": "group456",
    "sender_name": "John",
    "content": "Hello everyone!"
  }
}
```

---

## Scalability

### Write Scalability

```
Message Writes:
├── Kafka partitioned by chat_id
├── 3 partitions per chat (redundancy)
└── Producers send to any available partition

Media Uploads:
├── Direct to CDN (S3, GCS)
├── Presigned URLs for security
└── Asynchronous processing
```

### Read Scalability

```
Message Reads:
├── Cassandra partitioned by chat_id
├── Read replicas (3 per region)
├── Localized reads (nearest replica)
└── Cached message history (Redis)
```

### Connection Scalability

```
WebSocket Connections:
├── Multiple WebSocket servers
├── Sticky sessions via hash
├── Connection pool management
└── Automatic reconnection
```

---

## Monitoring

### Key Metrics

```
Message Metrics:
- Messages per second (sent, delivered, read)
- Average message latency
- Failed message rate
- Queue depth (Kafka lag)

WebSocket Metrics:
- Active connections
- Messages per second (WebSocket)
- Connection duration
- Disconnection rate

Media Metrics:
- Upload success rate
- Upload bandwidth
- CDN hit rate
- Storage usage

Performance Metrics:
- API response times (P50, P95, P99)
- Database query times
- Kafka producer/consumer lag
```

---

## Follow-up Questions

1. **How to handle message ordering?**
   - Use sequence numbers per chat
   - Sort by timestamp on client
   - Handle out-of-order messages

2. **How to handle duplicates?**
   - Use message IDs (UUID)
   - Deduplicate on receiver side
   - Idempotent message processing

3. **How to handle large files?**
   - Chunked uploads
   - Resumable uploads
   - CDN streaming

4. **How to handle network disconnections?**
   - Auto-reconnect with exponential backoff
   - Queue messages during offline
   - Sync on reconnection

5. **How to scale to billions of users?**
   - Geographic distribution
   - Database sharding
   - CDN caching
   - Load balancing across regions

6. **How to handle end-to-end encryption key rotation?**
   - Periodic key exchange
   - Ratchet protocol (Double Ratchet)
   - Forward secrecy

---

## Links

- [System Design Interview Overview](overview.md)
- [Design Patterns](design-patterns.md)
- [Trade-offs in System Design](trade-offs.md)
