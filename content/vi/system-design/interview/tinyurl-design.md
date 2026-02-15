---
title: "Thiết kế URL Shortener (TinyURL)"
date: 2025-02-15
tags: ["system-design", "url-shortener", "system-design-interview"]
description: "Thiết kế hệ thống hoàn chỉnh cho một dịch vụ rút ngắn URL như TinyURL hoặc Bit.ly."
author: "Eric Nguyen"
layout: "post"
---

# Thiết kế URL Shortener (TinyURL)

## Tuyên bố Vấn đề

Thiết kế một dịch vụ rút ngắn URL như TinyURL hoặc Bit.ly mà:

- Rút ngắn các URL dài
  | Chuyển hướng các URL ngắn tới các URL gốc
  | Xử lý hàng triệu URL
  | Cung cấp phân tích (lượt click, timestamps)
  | Có tính sẵn sàng cao và khả năng mở rộng

---

## Các Yêu cầu Chức năng

### Các Tính năng Cốt lõi

1. **Rút ngắn URL**
   - Input: URL dài (ví dụ, `https://example.com/very/long/path`)
   - Output: URL ngắn (ví dụ, `https://tinyurl.com/abc123`)

2. **Chuyển hướng**
   - Input: URL ngắn
   - Output: Chuyển hướng tới URL gốc

3. **Alias Tùy chỉnh**
   - Người dùng có thể tạo các URL ngắn tùy chỉnh
   - Ví dụ: `https://tinyurl.com/my-product`

4. **Hết hạn**
   - Các URL có thể có ngày hết hạn
   - Tự động xóa sau khi hết hạn

5. **Phân tích**
   - Theo dõi số lần click
   - Ghi lại timestamps
   - Lưu thông tin người dùng (IP, vị trí, thiết bị)

### Các Câu chuyện Người dùng

- "Tôi muốn chia sẻ một URL dài trên Twitter"
  | "Tôi muốn theo dõi các click trên liên kết đã chia sẻ của tôi"
  | "Tôi muốn một URL ngắn đáng nhớ cho sản phẩm của tôi"
  | "Tôi muốn các liên kết của tôi hết hạn sau 30 ngày"

---

## Các Yêu cầu Không Chức năng

### Các Yêu cầu Quy mô

**Các Giả định:**

- 100M URLs được lưu trữ
  | 100M URLs mới mỗi ngày
  | 10B lần chuyển hướng mỗi ngày
  | Tỷ lệ đọc/ghi: 10:1

**Các Tính toán:**

```
Ghi mỗi giây:
100M URLs / ngày = 1,157 URLs/giây

Đọc mỗi giây:
10B chuyển hướng / ngày = 115,740 chuyển hướng/giây

Lưu trữ:
100M URLs × 500 bytes = 50 GB

Băng thông (đọc):
10B chuyển hướng × 500 bytes = 5 TB/ngày = 58 MB/giây
```

### Các Yêu cầu Hiệu suất

- **Độ trễ**: < 100ms cho cả rút ngắn và chuyển hướng
  | **Tính sẵn sàng**: 99.9% (43.2 phút downtime/tháng)
  | **Khả năng mở rộng**: Xử lý tăng trưởng 10x

### Các Yêu cầu Tính nhất quán

- Tính nhất quán mạnh cho các ghi
  | Tính nhất quán cuối cùng cho các chuyển hướng chấp nhận được

---

## Thiết kế Cao cấp

### Các Thành phần

```
Client
    ↓
[Load Balancer]
    ↓
[API Gateway]
    ↓
    ├─→ [Dịch vụ Rút ngắn URL]
    │       ↓
    │   [Database Cluster]
    │
    ├─→ [Dịch vụ Chuyển hướng]
    │       ↓
    │   [Cache Cluster]
    │       ↓ (miss)
    │   [Database Cluster]
    │
    └─→ [Dịch vụ Phân tích]
            ↓
        [Database Cluster]
```

### Các API Endpoints

```yaml
# Rút ngắn URL
POST /api/v1/shorten
Request:
  {
    "url": "https://example.com/very/long/path",
    "custom_alias": "my-product",  # tùy chọn
    "expires_at": "2025-03-15T00:00:00Z"  # tùy chọn
  }
Response:
  {
    "short_url": "https://tinyurl.com/abc123",
    "original_url": "https://example.com/very/long/path",
    "created_at": "2025-02-15T10:00:00Z"
  }

# Chuyển hướng
GET /:alias
Response:
  301 Chuyển hướng tới URL gốc

# Lấy Thông tin URL
GET /api/v1/info/:alias
Response:
  {
    "original_url": "https://example.com/very/long/path",
    "created_at": "2025-02-15T10:00:00Z",
    "clicks": 1234,
    "expires_at": "2025-03-15T00:00:00Z"
  }

# Xóa URL
DELETE /api/v1/url/:alias
Response:
  {
    "success": true
  }
```

---

## Mô hình Dữ liệu

### Bảng URL

```sql
CREATE TABLE urls (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    user_id BIGINT,  -- tùy chọn, cho alias tùy chỉnh
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,  -- tùy chọn
    click_count BIGINT DEFAULT 0,
    INDEX idx_short_code (short_code),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_id (user_id)
);
```

### Bảng Phân tích

```sql
CREATE TABLE url_analytics (
    id BIGSERIAL PRIMARY KEY,
    url_id BIGINT REFERENCES urls(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    country VARCHAR(2),
    city VARCHAR(100),
    INDEX idx_url_id (url_id),
    INDEX idx_clicked_at (clicked_at)
);
```

---

## Tạo Hash

### Cách tiếp cận 1: Base62 Encoding

```python
import string

def encode(num):
    """Chuyển đổi số sang chuỗi Base62"""
    characters = string.digits + string.ascii_letters + string.ascii_uppercase
    base = len(characters)  # 62

    if num == 0:
        return characters[0]

    arr = []
    base = len(characters)
    while num:
        num, rem = divmod(num, base)
        arr.append(characters[rem])

    return ''.join(reversed(arr))

def decode(str):
    """Chuyển đổi chuỗi Base62 sang số"""
    characters = string.digits + string.ascii_letters + string.ascii_uppercase
    base = len(characters)

    num = 0
    for char in str:
        num = num * base + characters.index(char)

    return num

# Sử dụng
id = 123456789
short_code = encode(id)  # "8m0Kx"
```

### Cách tiếp cận 2: Hash + Base62

```python
import hashlib
import string

def generate_short_code(url):
    """Tạo short code từ hash URL"""
    # Tạo hash
    hash_obj = hashlib.md5(url.encode())
    hash_hex = hash_obj.hexdigest()

    # Chuyển đổi sang số
    hash_num = int(hash_hex[:8], 16)

    # Mã hóa sang Base62
    return encode(hash_num)

# Sử dụng
url = "https://example.com/very/long/path"
short_code = generate_short_code(url)  # "abc123"
```

### Cách tiếp cận 3: Dựa trên Counter

```python
def generate_short_code_counter(counter):
    """Tạo short code sử dụng counter database"""
    # Sử dụng counter phân tán (ví dụ, trong Redis)
    counter.increment()
    id = counter.get_value()
    return encode(id)
```

---

## Thiết kế Database

### Chiến lược Sharding

**Sharding Dựa trên Hash:**

```
shard_number = hash(short_code) % number_of_shards

Shard 0: các short codes bắt đầu với 0, 6, c, ...
Shard 1: các short codes bắt đầu với 1, 7, d, ...
Shard 2: các short codes bắt đầu với 2, 8, e, ...
...
```

**Ưu điểm:**

- Phân phối đều
  | Các tra cứu đơn giản

**Nhược điểm:**

- Độ phức tạp rebalancing

### Schema Database (Sharded)

```
Database Cluster
    ├── Shard 0 (Master + 2 Replicas)
    ├── Shard 1 (Master + 2 Replicas)
    ├── Shard 2 (Master + 2 Replicas)
    └─→ Shard N (Master + 2 Replicas)
```

---

## Chiến lược Caching

### Cache cho Các URL Hot

```
Yêu cầu Client → Cache (Redis)
                ↓
            Hit → Trả về
                ↓
            Miss → Database
                ↓
                Cập nhật Cache
```

**Cache Key:**

```
url:abc123 → "https://example.com/very/long/path"
```

**TTL:**

- 24 giờ cho các URL phổ biến
  | 1 giờ cho các ít phổ biến hơn

### Triển khai

```python
import redis
import json

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def get_original_url(short_code):
    cache_key = f"url:{short_code}"

    # Kiểm tra cache
    cached_url = redis_client.get(cache_key)
    if cached_url:
        return cached_url.decode('utf-8')

    # Cache miss: truy vấn database
    url = db.query("SELECT original_url FROM urls WHERE short_code = ?", short_code)

    if url:
        # Cập nhật cache
        redis_client.setex(cache_key, 3600, url)
        return url

    return None
```

---

## Rate Limiting

### Ngăn chặn Lạm dụng

**Rate Limit theo Người dùng/IP:**

- 1000 yêu cầu rút ngắn mỗi giờ mỗi người dùng
  | 10,000 yêu cầu chuyển hướng mỗi giờ mỗi IP

**Triển khai:**

```python
def check_rate_limit(user_id, limit=1000, window_seconds=3600):
    key = f"ratelimit:{user_id}"
    current = redis_client.incr(key)

    if current == 1:
        redis_client.expire(key, window_seconds)

    if current > limit:
        raise Exception("Vượt quá giới hạn rate limit")

    return True
```

---

## Triển khai Phân tích

### Theo dõi các Click

```python
def track_click(short_code, request_data):
    # Tăng số lần click
    db.execute(
        "UPDATE urls SET click_count = click_count + 1 WHERE short_code = ?",
        short_code
    )

    # Ghi lại phân tích bất đồng bộ
    analytics_queue.publish({
        'short_code': short_code,
        'clicked_at': datetime.now(),
        'ip_address': request_data['ip'],
        'user_agent': request_data['user_agent'],
        'country': request_data['country'],
        'city': request_data['city']
    })
```

### Xử lý Batch

```
Dịch vụ Phân tích
    ↓
Message Queue
    ↓
Batch Insert (mỗi 5 phút)
```

---

## Các Xem xét Khả năng Mở rộng

### Khả năng Mở rộng Ghi

1. **Database Sharding**
   - Phân phối các ghi qua nhiều database
   - Sử dụng consistent hashing để phân phối đều

2. **Xử lý Bất đồng bộ**
   - Các phân tích được ghi bất đồng bộ
   - Giảm tải ghi trên database chính

### Khả năng Mở rộng Đọc

1. **Layer Caching**
   - Cluster Redis cho các URL hot
   - CDN cho các static assets

2. **Read Replicas**
   - Nhiều read replicas
   - Load balance các đọc

3. **Phân phối Địa lý**
   - Triển khai trong nhiều vùng
   - Route tới datacenter gần nhất

---

## Sơ đồ Kiến trúc Hệ thống

```
                        ┌─────────────┐
                        │   Client    │
                        └──────┬──────┘
                               │
                    ┌──────────▼──────────┐
                    │   Load Balancer    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   API Gateway     │
                    │  - Xác thực       │
                    │  - Rate Limit     │
                    │  - Logging        │
                    └──────────┬──────────┘
                               │
               ┌──────────────────┼──────────────────┐
               │                  │                  │
       ┌───────▼────────┐ ┌────▼───────┐ ┌────▼──────────┐
       │   Shortener   │ │  Redirect   │ │   Analytics   │
       │   Service     │ │  Service    │ │   Service     │
       └───────┬────────┘ └────┬───────┘ └────┬──────────┘
               │                │               │
       ┌───────▼────────┐ ┌────▼───────┐ ┌────▼──────────┐
       │  Redis Cache   │ │Redis Cache  │ │ Redis Queue   │
       └───────┬────────┘ └────┬───────┘ └────┬──────────┘
               │                │               │
       ┌───────▼────────┐ ┌────▼───────┐ ┌────▼──────────┐
       │ PostgreSQL    │ │ PostgreSQL  │ │ PostgreSQL    │
       │   Cluster     │ │   Cluster   │ │   Cluster     │
       │   (Shards)   │ │   (Shards) │ │   (Shards)   │
       └───────────────┘ └────────────┘ └───────────────┘
```

---

## Các Phương án Thay thế & Tối ưu hóa

### 1. Sử dụng Dịch vụ Counter

```
Counter phân tán để tạo các ID duy nhất
Tránh tranh chấp database
```

### 2. Pre-generate Short Codes

```
Tạo short codes theo batches
Lưu trữ trong pool
Gán theo yêu cầu
```

### 3. Bloom Filters

```
Sử dụng bloom filter để kiểm tra tồn tại nhanh
Giảm các tra cứu database
```

---

## Các Câu hỏi Tiếp theo

1. **Làm thế nào để xử lý các xung đột alias tùy chỉnh?**
   - Kiểm tra tính sẵn có trước khi gán
   - Trả về lỗi nếu không sẵn có

2. **Làm thế nào để xử lý các URL hết hạn?**
   - Background job để dọn dẹp các URL hết hạn
   - Trả về 404 cho các URL hết hạn

3. **Làm thế nào để xử lý các URL độc hại?**
   - Quét và xác thực URL
   - Blocklist cho các vùng đáng ngờ
   - Rate limiting

4. **Làm thế nào để xử lý phân tích ở quy mô?**
   - Xử lý stream (Kafka, Kinesis)
   - Database chuỗi thời gian (InfluxDB)
   - Tổng hợp và lấy mẫu dữ liệu

---

## Các Liên kết

- [Tổng quan Phỏng vấn Thiết kế Hệ thống](overview.md)
- [Hệ thống Phân tán](distributed-systems.md)
- [Caching và Message Queues](caching-message-queues.md)
