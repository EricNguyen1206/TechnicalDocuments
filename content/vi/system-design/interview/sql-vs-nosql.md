---
title: "Cơ sở dữ liệu SQL vs NoSQL"
date: 2025-02-15
tags: ["system-design", "database", "sql", "nosql"]
description: "So sánh các cơ sở dữ liệu SQL và NoSQL, các trường hợp sử dụng, và khi nào sử dụng từng loại."
author: "Eric Nguyen"
layout: "post"
---

# Cơ sở dữ liệu SQL vs NoSQL

## SQL (Cơ sở dữ liệu Quan hệ)

### Các Đặc điểm

- **Dữ liệu Cấu trúc**: Các lược đồ cố định với bảng và mối quan hệ
- **Tuân thủ ACID**: Atomicity, Consistency, Isolation, Durability
- **Schema-on-Write**: Cấu trúc được xác định trước khi chèn dữ liệu
- **Tính nhất quán Mạnh**: Dữ liệu luôn nhất quán
- **Vertical Scaling**: Scale up (thêm tài nguyên cho server đơn)

### Các Cơ sở dữ liệu SQL

- **PostgreSQL**: Mã nguồn mở, các tính năng nâng cao, hỗ trợ JSONB
- **MySQL/MariaDB**: Phổ biến, ứng dụng web, tốt cho đọc
- **Oracle**: Các tính năng doanh nghiệp, đắt
- **SQL Server**: Hệ sinh thái Microsoft, doanh nghiệp

### Khi nào Sử dụng SQL

**1. Dữ liệu Cấu trúc**

- Giao dịch tài chính
- Hồ sơ người dùng
  | Quản lý tồn kho
  | Các hệ thống kế toán

**2. Cần Tính nhất quán Mạnh**

- Ứng dụng ngân hàng
  | Đơn hàng thương mại điện tử
  | Các hệ thống đặt chỗ

**3. Các Truy vấn Phức tạp**

- Các join qua nhiều bảng
  | Các tổng hợp
  | Các truy vấn con

**4. Yêu cầu ACID**

- Các giao dịch phải tất cả hoặc không
  | Không được phép dữ liệu bị hỏng

### Ví dụ SQL

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Truy vấn phức tạp với joins
SELECT
    u.username,
    COUNT(o.id) as order_count,
    SUM(o.amount) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.status = 'completed'
GROUP BY u.id, u.username
HAVING total_spent > 1000;
```

---

## NoSQL (Cơ sở dữ liệu Không Quan hệ)

### Các Đặc điểm

- **Schema Linh hoạt**: Các lược đồ động, không có cấu trúc cố định
- **BASE**: Basically Available, Soft state, Eventual consistency
- **Schema-on-Read**: Cấu trúc được hiểu khi đọc dữ liệu
- **Horizontal Scaling**: Scale out (thêm nhiều server)
  | **Hiệu suất Cao**: Được tối ưu hóa cho các pattern truy cập cụ thể

### Các Loại NoSQL

#### 1. Document Stores

**Ví dụ:** MongoDB, CouchDB, Amazon DocumentDB

**Đặc điểm:**

- Lưu trữ các tài liệu (JSON, BSON)
  | Schema linh hoạt
  | Các cấu trúc dữ liệu lồng nhau

**Khi nào Sử dụng:**

- Các hệ thống quản lý nội dung
  | Danh mục
  | Hồ sơ người dùng với các trường thay đổi

**Ví dụ (MongoDB):**

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "username": "john_doe",
  "email": "john@example.com",
  "profile": {
    "age": 30,
    "location": "San Francisco",
    "interests": ["coding", "music", "travel"]
  },
  "social": {
    "twitter": "@johndoe",
    "github": "johndoe"
  }
}
```

#### 2. Key-Value Stores

**Ví dụ:** Redis, Memcached, DynamoDB

**Đặc điểm:**

- Các cặp key-value đơn giản
  | Cực kỳ nhanh
  | Khả năng truy vấn hạn chế

**Khi nào Sử dụng:**

- Caching
  | Lưu trữ phiên
  | Bảng xếp hạng thời gian thực
  | Các tra cứu đơn giản

**Ví dụ (Redis):**

```
SET user:123 '{"name": "John", "email": "john@example.com"}'
GET user:123
```

#### 3. Column-Family Stores

**Ví dụ:** Cassandra, HBase, Bigtable

**Đặc điểm:**

- Các wide-column stores
  | Được tối ưu hóa cho ghi
  | Được phân vùng theo row key

**Khi nào Sử dụng:**

- Dữ liệu chuỗi thời gian
  | Các khối lượng ghi lớn
  | Phân tích quy mô lớn

**Ví dụ (Cassandra):**

```
CREATE TABLE user_activity (
    user_id UUID,
    activity_id UUID,
    activity_type TEXT,
    timestamp TIMESTAMP,
    PRIMARY KEY (user_id, timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC);
```

#### 4. Graph Databases

**Ví dụ:** Neo4j, Amazon Neptune, ArangoDB

**Đặc điểm:**

- Lưu trữ các node và mối quan hệ
  | Được tối ưu hóa cho các truy vấn đồ thị
  | Mạng xã hội, phát hiện gian lận

**Khi nào Sử dụng:**

- Mạng xã hội
  | Phát hiện gian lận
  | Các engine đề xuất
  | Các đồ thị kiến thức

**Ví dụ (Neo4j):**

```
CREATE (john:User {name: "John"})
CREATE (jane:User {name: "Jane"})
CREATE (john)-[:FRIEND_OF]->(jane)

MATCH (user:User {name: "John"})-[:FRIEND_OF]->(friend)
RETURN friend
```

---

## Định lý CAP

### CAP là gì?

Trong một hệ thống phân tán, bạn chỉ có thể có **2 trong 3**:

### C - Consistency (Tính nhất quán)

Tất cả các node thấy cùng một dữ liệu tại cùng thời điểm.

### A - Availability (Tính sẵn sàng)

Mỗi yêu cầu nhận được phản hồi (thành công hoặc thất bại).

### P - Partition Tolerance (Khả năng chịu phân vùng)

Hệ thống tiếp tục hoạt động dù có phân vùng mạng.

### Các đánh đổi CAP

| Hệ thống | Tính nhất quán | Tính sẵn sàng | Các trường hợp sử dụng       |
| -------- | -------------- | ------------- | ---------------------------- |
| CA       | Cao            | Cao           | RDBMS một node               |
| CP       | Cao            | Thấp          | MongoDB (mặc định), HBase    |
| AP       | Thấp           | Cao           | Cassandra, DynamoDB, CouchDB |

---

## So sánh SQL vs NoSQL

| Khía cạnh                 | SQL                           | NoSQL                           |
| ------------------------- | ----------------------------- | ------------------------------- |
| **Schema**                | Cố định, xác định trước       | Linh hoạt, dynamic              |
| **Tính nhất quán**        | Mạnh                          | Cuối cùng (thường)              |
| **Scaling**               | Vertical (scale up)           | Horizontal (scale out)          |
| **Ngôn ngữ Truy vấn**     | SQL (tiêu chuẩn hóa)          | Biến đổi (API-specific)         |
| **Giao dịch**             | Hỗ trợ ACID                   | Hỗ trợ hạn chế                  |
| **Kích thước Dữ liệu**    | Phạm vi TB                    | Phạm vi PB                      |
| **Các Truy vấn Phức tạp** | Xuất sắc (joins, tổng hợp)    | Hạn chế                         |
| **Linh hoạt**             | Thấp (thay đổi schema khó)    | Cao (thay đổi schema dễ)        |
| **Hiệu suất**             | Tốt cho các truy vấn phức tạp | Xuất sắc cho các pattern cụ thể |
| **Đường cong Học tập**    | SQL tiêu chuẩn                | Biến đổi theo database          |

---

## Chọn giữa SQL và NoSQL

### Chọn SQL Khi:

1. **Dữ liệu được Cấu trúc**
   - Bạn biết schema trước
   - Các mối quan hệ dữ liệu quan trọng

2. **ACID được Yêu cầu**
   - Các giao dịch tài chính
   - Quản lý tồn kho
   - Bất kỳ hệ thống nào mà tính toàn vẹn dữ liệu quan trọng

3. **Các Truy vấn Phức tạp**
   - Cần các join qua nhiều bảng
   - Các tổng hợp phức tạp
   - Các truy vấn con và truy vấn lồng nhau

4. **Độ tin cậy trên Khả năng mở rộng**
   - Tính chính xác dữ liệu quan trọng hơn
   - Quy mô trung bình (hàng triệu hàng)

### Chọn NoSQL Khi:

1. **Dữ liệu Không Cấu trúc**
   - Các kiểu dữ liệu thay đổi
   - Thay đổi schema thường xuyên
   - Các cấu trúc dữ liệu lồng nhau

2. **Cần Khả năng mở rộng Cao**
   - Quy mô lớn (hàng tỷ bản ghi)
   - Các khối lượng ghi lớn
   - Cần horizontal scaling

3. **Phát triển Nhanh**
   - Các lần lặp nhanh
   - Các yêu cầu đang phát triển
   - Cần tính linh hoạt schema

4. **Các Trường hợp Sử dụng Cụ thể:**
   - Caching: Redis, Memcached
   - Time-series: InfluxDB, TimescaleDB
   - Graph: Neo4j
   - Documents: MongoDB
   - Wide-column: Cassandra

---

## Các Ví dụ

### Sử dụng SQL: Hệ thống Đơn hàng Thương mại Điện tử

```sql
-- Cần tính nhất quán mạnh
-- Các truy vấn phức tạp (báo cáo, phân tích)
-- Các giao dịch ACID (tồn kho, thanh toán)

BEGIN TRANSACTION;
  UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 123;
  INSERT INTO orders (user_id, product_id, amount) VALUES (1, 123, 99.99);
  UPDATE users SET balance = balance - 99.99 WHERE id = 1;
COMMIT;
```

### Sử dụng NoSQL: Bảng tin Mạng xã hội

```javascript
// Schema linh hoạt (bài viết với các trường khác nhau)
// Thông lượng ghi cao
// Tính nhất quán cuối cùng chấp nhận được

{
  "post_id": "12345",
  "user_id": "67890",
  "content": "Hello world!",
  "images": ["img1.jpg", "img2.jpg"],
  "location": {
    "lat": 37.7749,
    "lng": -122.4194
  },
  "mentions": ["@alice", "@bob"],
  "hashtags": ["#hello", "#world"]
}
```

### Sử dụng NoSQL: Phân tích Thời gian thực

```
// Dữ liệu chuỗi thời gian
// Khối lượng ghi lớn
// Column-family store để hiệu quả

Bảng Cassandra:
user_id | timestamp | metric_name | value
---------|------------|-------------|------
user123  | 1234567890 | page_view   | 1
user123  | 1234567891 | click       | 1
user456  | 1234567892 | page_view   | 1
```

---

## Cách tiếp cận Hybrid

### Polyglot Persistence

Sử dụng các database khác nhau cho các nhu cầu khác nhau:

```
Ứng dụng
    ├── PostgreSQL (dữ liệu người dùng, đơn hàng, giao dịch)
    ├── Redis (cache, sessions, rate limiting)
    ├── MongoDB (danh mục sản phẩm, đánh giá, logs)
    └── Elasticsearch (tìm kiếm, phân tích)
```

### Ví dụ Kiến trúc

```
Yêu cầu Người dùng
    ↓
Redis Cache (hit) → Trả về
    ↓ (miss)
PostgreSQL → Cập nhật Redis → Trả về

Hoạt động Ghi
    ↓
PostgreSQL (giao dịch) → Hủy Redis
    ↓
Kafka (stream sự kiện) → Dịch vụ Phân tích → MongoDB
```

---

## Các Chiến lược Di chuyển

### Di chuyển SQL → NoSQL

**Bước 1: Phân tích Các Pattern Truy cập**

- Xác định các pattern đọc/ghi
  | Xác định các yêu cầu truy vấn

**Bước 2: Thiết kế Schema NoSQL**

- Ánh xạ các bảng SQL tới các collection NoSQL
  | Denormalize để hiệu suất đọc

**Bước 3: Giai đoạn Ghi Kép**

- Ghi vào cả SQL và NoSQL
  | Xác minh tính nhất quán dữ liệu

**Bước 4: Cutover**

- Di chuyển dữ liệu lịch sử
  | Chuyển đổi đọc sang NoSQL
  | Loại bỏ các ghi SQL

---

## Các Thực hành Tốt nhất

### Cho Các Cơ sở dữ liệu SQL

1. **Indexing Đúng**
   - Index các cột được truy vấn thường xuyên
   - Sử dụng các index composite cho các truy vấn đa cột

2. **Tối ưu hóa Truy vấn**
   - Sử dụng EXPLAIN ANALYZE
   - Tránh các truy vấn N+1
   - Sử dụng các loại JOIN thích hợp

3. **Connection Pooling**
   - PgBouncer
   - Giảm chi phí kết nối

### Cho Các Cơ sở dữ liệu NoSQL

1. **Thiết kế cho Các Pattern Truy vấn**
   - Mô hình hóa dữ liệu dựa trên cách nó được truy cập
   - Denormalize cho các lần đọc

2. **Xử lý Tính nhất quán**
   - Triển khai giải quyết xung đột
   - Sử dụng versioning hoặc timestamps

3. **Giám sát và Tinh chỉnh**
   - Điều chỉnh các mức độ nhất quán
   - Tối ưu hóa partitioning/replication

---

## Các Liên kết

- [Tổng quan Phỏng vấn Thiết kế Hệ thống](overview.md)
- [Hệ thống Phân tán](distributed-systems.md)
- [Caching và Message Queues](caching-message-queues.md)
