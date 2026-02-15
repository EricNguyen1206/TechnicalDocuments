---
title: "Caching và Message Queues"
date: 2025-02-15
tags: ["system-design", "caching", "message-queue", "kafka"]
description: "Hướng dẫn toàn diện về các chiến lược caching và các pattern message queue trong hệ thống phân tán."
author: "Eric Nguyen"
layout: "post"
---

# Caching và Message Queues

## Caching

### Caching là gì?

Caching lưu trữ dữ liệu được truy cập thường xuyên trong lưu trữ nhanh (bộ nhớ) để giảm độ trễ và tải trên lưu trữ chậm hơn (database, đĩa).

```
Yêu cầu
    ↓
Cache? → CÓ → Trả về Dữ liệu
    ↓ KHÔNG
Database → Cập nhật Cache → Trả về Dữ liệu
```

### Các Cấp Cache

**Level 1 Cache (L1):**

- CPU cache (on-chip)
- Nhanh nhất, nhỏ nhất (KB)

**Level 2 Cache (L2):**

- CPU cache (on-chip)
- Nhanh, nhỏ (MB)

**Level 3 Cache (L3):**

- CPU cache (on-chip, chia sẻ)
- Chậm hơn, lớn hơn (MB)

**Application Cache:**

- Redis, Memcached
- Nhanh (micro giây)
- Kích thước trung bình (GB)

**Database Cache:**

- Cache kết quả truy vấn
- Buffer pool
- Chậm hơn (mili giây)

---

## Các Chiến lược Caching

### 1. Cache Aside (Lazy Loading)

```
Application          Cache          Database
    |                 |               |
    |--Kiểm tra------->|               |
    |<--Miss----------|               |
    |                                 |
    |----------------------Query------>|
    |<-------------------Dữ liệu------|
    |                                 |
    |--Set Dữ liệu---->|               |
    |                 |
    |<--Dữ liệu--------|
```

**Quy trình:**

1. Ứng dụng kiểm tra cache
2. Nếu miss, truy vấn database
3. Lưu kết quả trong cache
4. Trả về dữ liệu

**Ưu điểm:**

- Chỉ dữ liệu được cache được tải
- Đơn giản để triển khai

**Nhược điểm:**

- Cache miss = hit database chậm
- Nhiều miss đồng thời gây cache stampede

**Triển khai:**

```python
def get_user(user_id):
    cache_key = f"user:{user_id}"

    # Kiểm tra cache
    user = redis.get(cache_key)
    if user:
        return json.loads(user)

    # Cache miss: truy vấn database
    user = db.query("SELECT * FROM users WHERE id = ?", user_id)

    # Set cache
    redis.setex(cache_key, 3600, json.dumps(user))  # TTL 1 giờ

    return user
```

### 2. Read Through

```
Application          Cache          Database
    |                 |               |
    |--Yêu cầu------->|               |
    |                 |---Miss------->|
    |                 |<---Dữ liệu------|
    |                 |               |
    |<--Dữ liệu--------|               |
```

**Quy trình:**

1. Ứng dụng luôn đọc từ cache
2. Cache quản lý tải từ database
3. Cache trả về dữ liệu cho ứng dụng

**Ưu điểm:**

- Mã ứng dụng đơn giản hơn
- Caching nhất quán

**Nhược điểm:**

- Cache trở thành điểm thất bại đơn lẻ
- Triển khai cache phức tạp hơn

### 3. Write Through

```
Application          Cache          Database
    |                 |               |
    |--Ghi----------->|               |
    |                 |---Ghi-------->|
    |                 |               |
    |<--Ack----------|               |
    |                 |<---Ack------|
```

**Quy trình:**

1. Ứng dụng ghi vào cache
2. Cache ghi vào database
3. Cả hai phải thành công

**Ưu điểm:**

- Cache và database luôn đồng bộ
- Tính nhất quán mạnh

**Nhược điểm:**

- Ghi chậm hơn (hai thao tác)
- Tải trên cache cao hơn

**Triển khai:**

```python
def update_user(user_id, data):
    cache_key = f"user:{user_id}"

    # Ghi vào cache
    redis.setex(cache_key, 3600, json.dumps(data))

    # Ghi vào database
    db.execute("UPDATE users SET ... WHERE id = ?", user_id)
```

### 4. Write Behind (Write Back)

```
Application          Cache          Database
    |                 |               |
    |--Ghi----------->|               |
    |<--Ack----------|               |
    |                 |---Ghi Bất đồng bộ>|
    |                 |<---Ack------|
```

**Quy trình:**

1. Ứng dụng ghi vào cache
2. Cache xác nhận ngay lập tức
3. Cache ghi bất đồng bộ vào database

**Ưu điểm:**

- Ghi rất nhanh
  | Batch các ghi database

**Nhược điểm:**

- Mất dữ liệu nếu cache thất bại
  | Triển khai phức tạp
  | Tính nhất quán cuối cùng

### 5. Refresh Ahead

```
Cache kiểm tra TTL
Nếu sắp hết hạn:
  Làm mới từ database trước khi hết hạn
```

**Quy trình:**

1. Cache giám sát TTL
2. Pre-fetch dữ liệu trước khi hết hạn
3. Người dùng không bao giờ thấy cache miss

**Ưu điểm:**

- Không có cache miss
  | Trải nghiệm người dùng tốt hơn

**Nhược điểm:**

- Độ phức tạp
  | Có thể fetch dữ liệu không được sử dụng

---

## Các Chính sách Hủy Cache

### LRU (Least Recently Used)

```
Cache: [A, B, C, D] (tối đa 4)
Mới: E
Hủy: A (gần nhất)
Cache: [E, B, C, D]
```

**Ưu điểm:**

- Đơn giản để triển khai
  | Tính địa phương thời gian tốt

**Nhược điểm:**

- Không xem xét tần suất truy cập

### LFU (Least Frequently Used)

```
Số lần truy cập: A: 5, B: 3, C: 2, D: 1
Mới: E
Hủy: D (ít nhất)
```

**Ưu điểm:**

- Giữ dữ liệu phổ biến

**Nhược điểm:**

- Vấn đề dữ liệu lạnh (dữ liệu mới bị hủy)
  | Cần theo dõi số lần truy cập

### FIFO (First In First Out)

```
Cache: [A, B, C, D] (A được thêm trước)
Mới: E
Hủy: A
Cache: [E, B, C, D]
```

**Ưu điểm:**

- Rất đơn giản

**Nhược điểm:**

- Bỏ qua các pattern truy cập

### Hủy Ngẫu nhiên

```
Cache: [A, B, C, D]
Mới: E
Hủy: Ngẫu nhiên (ví dụ, C)
Cache: [E, B, A, D]
```

**Ưu điểm:**

- Đơn giản
  | Phân phối công bằng

**Nhược điểm:**

- Có thể hủy dữ liệu nóng

---

## Hủy Cache

### Time to Live (TTL)

```
Cache dữ liệu với thời gian hết hạn
Sau khi TTL hết hạn, dữ liệu bị xóa tự động
```

**Triển khai:**

```python
# Set với TTL 1 giờ
redis.setex("user:123", 3600, json.dumps(user_data))

# Get
data = redis.get("user:123")
```

### Hủy Dựa trên Sự kiện

```
Người dùng cập nhật hồ sơ
    ↓
Cập nhật Database
    ↓
Hủy Cache
    ↓
Cache Miss → Tải lại từ Database
```

**Triển khai:**

```python
def update_user(user_id, data):
    # Cập nhật database
    db.execute("UPDATE users SET ...", data)

    # Hủy cache
    cache_key = f"user:{user_id}"
    redis.delete(cache_key)
```

### Hủy Write-through

```
Hoạt động ghi tự động cập nhật cache
Không cần hủy riêng biệt
```

---

## Các Thực hành Tốt nhất cho Caching

### 1. Sử dụng TTL Phù hợp

- Không cache quá lâu (dữ liệu cũ)
- Không cache quá ngắn (nhiều miss hơn)

### 2. Xử lý Cache Stampede

```
Nhiều yêu cầu cho cùng dữ liệu (cache miss)
Giải pháp: Sử dụng cache lock
```

**Triển khai:**

```python
def get_user_with_lock(user_id):
    cache_key = f"user:{user_id}"
    lock_key = f"lock:{user_id}"

    # Thử lấy lock
    if redis.setnx(lock_key, 1, 10):  # lock 10 giây
        try:
            user = db.query("SELECT ...")
            redis.setex(cache_key, 3600, json.dumps(user))
            return user
        finally:
            redis.delete(lock_key)
    else:
        # Chờ và thử lại
        time.sleep(0.1)
        return get_user_with_lock(user_id)
```

### 3. Giám sát Tỷ lệ Hit Cache

```
Tỷ lệ Hit = (Cache Hits) / (Cache Hits + Cache Misses)

Tốt: > 80%
Chấp nhận được: 60-80%
Kém: < 60%
```

### 4. Sử dụng Cache Compression

```
Nén dữ liệu lớn trước khi cache
Giảm sử dụng bộ nhớ
```

---

## Message Queues

### Message Queue là gì?

Message queue là dịch vụ giao tiếp bất đồng bộ lưu trữ tin nhắn cho đến khi chúng được xử lý.

```
Producer          Message Queue          Consumer
    |                 |                  |
    |--Tin nhắn------->|                  |
    |                 |---Tin nhắn------->|
    |                 |                  |
    |--Tin nhắn------->|                  |
    |                 |---Tin nhắn------->|
```

### Tại sao Sử dụng Message Queues?

**Decoupling:**

- Các dịch vụ không cần biết về nhau
  | Producer không chờ consumer

**Xử lý Bất đồng bộ:**

- Các tác vụ dài không chặn yêu cầu người dùng
  | Xử lý nền

**Độ tin cậy:**

- Tin nhắn tồn tại ngay cả khi consumer xuống
  | Các cơ chế retry

**Khả năng mở rộng:**

- Thêm consumer dễ dàng
  | Xử lý spike lưu lượng

---

## Các Pattern Message Queue

### 1. Publish-Subscribe (Pub/Sub)

```
Publisher          Exchange          Subscribers
    |                 |                  |
    |--Tin nhắn------->|                  |
    |                 |---Tin nhắn1----->| Sub 1
    |                 |---Tin nhắn2----->| Sub 2
    |                 |---Tin nhắn3----->| Sub 3
```

**Trường hợp sử dụng:**

- Thông báo
  | Broadcast sự kiện
  | Các kịch bản fan-out

**Triển khai (Redis Pub/Sub):**

```python
# Publisher
import redis
r = redis.Redis()
r.publish('channel_name', 'message_data')

# Subscriber
pubsub = r.pubsub()
pubsub.subscribe('channel_name')
for message in pubsub.listen():
    if message['type'] == 'message':
        print(message['data'])
```

### 2. Work Queue (Task Queue)

```
Producer          Queue          Workers
    |                 |               |
    |--Task1--------->|               |
    |--Task2--------->|---Task1----->| Worker 1
    |--Task3--------->|---Task2----->| Worker 2
    |                 |---Task3----->| Worker 3
```

**Trường hợp sử dụng:**

- Gửi email
  | Xử lý hình ảnh
  | Chuyển đổi video

**Triển khai (Redis Queue):**

```python
import redis
r = redis.Redis()

# Producer: Thêm task
r.rpush('task_queue', json.dumps({'task': 'send_email', 'to': 'user@example.com'}))

# Worker: Lấy task
while True:
    task_json = r.blpop('task_queue', timeout=5)
    if task_json:
        task = json.loads(task_json[1])
        process_task(task)
```

### 3. Priority Queue

```
Các task có độ ưu tiên
Các task ưu tiên cao được xử lý trước
```

**Triển khai:**

```python
# Thêm với ưu tiên
r.zadd('priority_queue', {'task1': 10, 'task2': 1})

# Lấy ưu tiên cao nhất (score thấp nhất)
task = r.zpopmin('priority_queue')
```

### 4. Delayed Queue

```
Các task được thực hiện sau độ trễ
```

**Triển khai:**

```python
# Thêm task với độ trễ
r.zadd('delayed_queue', {task_json: execution_time})

# Worker kiểm tra các task sẵn sàng
now = time.time()
ready_tasks = r.zrangebyscore('delayed_queue', 0, now)
for task in ready_tasks:
    process_task(task)
```

---

## Các Công nghệ Message Queue

### RabbitMQ

**Tính năng:**

- Giao thức AMQP
  | Routing linh hoạt
  | Xác nhận tin nhắn
  | Tồn tại tin nhắn

**Trường hợp sử dụng:**

- Routing phức tạp
  | Giao tiếp đáng tin cậy
  | Ứng dụng doanh nghiệp

**Ví dụ Cơ bản:**

```python
import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# Producer
channel.basic_publish(
    exchange='',
    routing_key='task_queue',
    body=json.dumps({'task': 'process_order'})
)

# Consumer
def callback(ch, method, properties, body):
    task = json.loads(body)
    process_task(task)
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue='task_queue', on_message_callback=callback)
channel.start_consuming()
```

### Kafka

**Tính năng:**

- Log phân tán
  | Thông lượng cao
  | Xử lý stream
  | Partitioning

**Trường hợp sử dụng:**

- Streaming sự kiện
  | Tổng hợp log
  | Phân tích thời gian thực

**Ví dụ Cơ bản:**

```python
from kafka import KafkaProducer, KafkaConsumer

# Producer
producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)
producer.send('orders', {'order_id': 123, 'amount': 100})

# Consumer
consumer = KafkaConsumer(
    'orders',
    bootstrap_servers=['localhost:9092'],
    value_deserializer=lambda m: json.loads(m.decode('utf-8'))
)
for message in consumer:
    process_order(message.value)
```

### Redis

**Tính năng:**

- Trong bộ nhớ
  | Nhanh và đơn giản
  | Pub/Sub, Lists, Sorted Sets

**Trường hợp sử dụng:**

- Các task queue đơn giản
  | Pub/Sub thời gian thực
  | Caching

### AWS SQS

**Tính năng:**

- Được quản lý hoàn toàn
  | Tự động mở rộng
  | Giao tiếp ít nhất một lần

**Trường hợp sử dụng:**

- Hệ sinh thái AWS
  | Các dịch vụ decoupled

---

## Các Đảm bảo Tin nhắn

### At-Most-Once

- Tin nhắn có thể bị mất
  | Không bao giờ giao hai lần
  | Nhanh nhưng không đáng tin cậy

### At-Least-Once

- Tin nhắn không bao giờ bị mất
  | Có thể giao nhiều lần
  | Cần consumers idempotent

### Exactly-Once

- Tin nhắn giao chính xác một lần
  | Khó triển khai nhất
  | Kafka với giao dịch

---

## Các Liên kết

- [Tổng quan Phỏng vấn Thiết kế Hệ thống](overview.md)
- [Hệ thống Phân tán](distributed-systems.md)
- [SQL vs NoSQL](sql-vs-nosql.md)
