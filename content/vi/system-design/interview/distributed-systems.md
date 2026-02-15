---
title: "Cơ bản về Hệ thống Phân tán"
date: 2025-02-15
tags: ["system-design", "distributed-systems", "interview"]
description: "Các khái niệm cốt lõi của hệ thống phân tán bao gồm định lý CAP, mô hình tính nhất quán, và các pattern thông dụng."
author: "Eric Nguyen"
layout: "post"
---

# Cơ bản về Hệ thống Phân tán

## Hệ thống Phân tán là gì?

Hệ thống phân tán là tập hợp các máy tính độc lập xuất hiện với người dùng như một hệ thống thống nhất. Các hệ thống này cần thiết khi:

- **Quy mô vượt quá khả năng của một máy đơn**
- **Cần tính sẵn sàng cao**
- **Cần độ trễ thấp trên phạm vi toàn cầu**
- **Dữ liệu cần được sao chép qua nhiều vùng**

---

## Định lý CAP

Trong một kho dữ liệu phân tán, bạn chỉ có thể có **2 trong 3** bảo đảm:

### C - Consistency (Tính nhất quán)

Tất cả các node thấy cùng một dữ liệu tại cùng thời điểm.

- **Strong Consistency**: Mọi lần đọc đều nhận được ghi gần nhất
- **Ví dụ**: Hệ thống ngân hàng (không thể hiển thị số dư khác nhau)

### A - Availability (Tính sẵn sàng)

Mọi yêu cầu nhận được phản hồi (thành công hoặc thất bại), không đảm bảo rằng nó chứa ghi gần nhất.

- **High Availability**: Hệ thống luôn phản hồi, ngay cả khi dữ liệu đã cũ
- **Ví dụ**: Bảng tin mạng xã hội (có thể hiển thị bài viết cũ hơn)

### P - Partition Tolerance (Khả năng chịu phân vùng)

Hệ thống tiếp tục hoạt động dù có phân vùng mạng (thất bại giao tiếp giữa các node).

### Sự đánh đổi

| Loại Hệ thống | Tính nhất quán | Tính sẵn sàng | Các trường hợp sử dụng         |
| ------------- | -------------- | ------------- | ------------------------------ |
| CA            | Cao            | Cao           | DB một node, RDBMS             |
| CP            | Cao            | Thấp          | Ngân hàng, Hệ thống thanh toán |
| AP            | Thấp           | Cao           | Mạng xã hội, Giỏ hàng mua sắm  |

### Các Kịch bản Ví dụ

**Hệ thống CP (MongoDB mặc định)**

- Phân vùng mạng: Chọn nhất quán, từ chối ghi
- Sử dụng: Ngân hàng, Quản lý tồn kho

**Hệ thống AP (Cassandra, DynamoDB)**

- Phân vùng mạng: Chọn sẵn sàng, chấp nhận dữ liệu cũ
- Sử dụng: Bảng tin xã hội, Phân tích

---

## Các Mô hình Tính nhất quán

### Strong Consistency

- Các lần đọc luôn trả về ghi gần nhất
- Được triển khai qua: Two-phase commit, Paxos, Raft
- **Ưu**: Không có dữ liệu cũ
- **Nhược**: Độ trễ cao, tính sẵn sàng thấp hơn

### Eventual Consistency

- Hệ thống đảm bảo rằng nếu không có cập nhật mới, cuối cùng mọi lần truy cập sẽ trả về giá trị cập nhật cuối cùng
- **Ưu**: Tính sẵn sàng cao, độ trễ thấp
- **Nhược**: Có thể đọc dữ liệu cũ

### Ví dụ: Eventual Consistency

```
Người dùng đăng bài trên Facebook
├── DB Bờ Đông: Cập nhật (10ms)
├── DB Bờ Tây: Cập nhật (100ms)
└── Người dùng ở Bờ Tây: Thấy bài viết sau 100ms
```

---

## Chiến lược Sao chép

### Master-Slave (Primary-Replica)

```
Ghi → Master → Replicas
Đọc → Master hoặc Replicas
```

**Ưu điểm:**

- Dễ triển khai
- Khả năng đọc mở rộng

**Nhược điểm:**

- Nút thắt ghi tại master
- Độ trễ dữ liệu đến các replicas

**Sử dụng:**

- Khối lượng đọc lớn
- Hệ thống phân tích

### Multi-Master

```
Ghi → Master1 hoặc Master2
Đọc → Master1 hoặc Master2
```

**Ưu điểm:**

- Khả năng ghi mở rộng
- Tính sẵn sàng cao

**Nhược điểm:**

- Độ phức tạp giải quyết xung đột
- Thách thức về tính nhất quán

**Sử dụng:**

- Hệ thống đa vùng
- Khối lượng ghi lớn

### Leaderless

```
Ghi → Bất kỳ node
Đọc → Quorum của các node
```

**Ưu điểm:**

- Không có điểm thất bại đơn lẻ
- Tính sẵn sàng cao

**Nhược điểm:**

- Logic đọc/ghi phức tạp
- Độ trễ cao hơn

**Sử dụng:**

- DynamoDB, Cassandra
- Các hệ thống có yêu cầu tính sẵn sàng quan trọng

---

## Sharding (Phân vùng ngang)

### Sharding là gì?

Chia dữ liệu qua nhiều cơ sở dữ liệu/máy chủ.

### Chiến lược Sharding

#### 1. Horizontal Sharding theo Key

```sql
-- Shard theo user_id modulo 4
shard_number = user_id % 4

-- Shard theo vùng
shard = user_region
```

**Ưu điểm:**

- Phân phối đều
- Truy vấn đơn giản

**Nhược điểm:**

- Độ phức tạp cân bằng lại
- Rủi ro hotspot

#### 2. Range-based Sharding

```sql
-- Shard theo khoảng user_id
shard1: user_id 1-1000000
shard2: user_id 1000001-2000000
```

**Ưu điểm:**

- Truy vấn khoảng hiệu quả
- Dễ hiểu

**Nhược điểm:**

- Phân phối không đều
- Cân bằng lại phức tạp

#### 3. Directory-based Sharding

```
Dịch vụ Lookup → Ánh xạ keys tới shards
Ứng dụng → Truy vấn dịch vụ lookup
```

**Ưu điểm:**

- Linh hoạt
- Dễ cân bằng lại

**Nhược điểm:**

- Điểm thất bại đơn lẻ
- Bước lookup thêm

---

## Các Pattern Giao tiếp

### Giao tiếp Đồng bộ

```
Client → Service A → Service B
         ← Phản hồi ← Phản hồi
```

**Ưu điểm:**

- Xử lý lỗi đơn giản
- Phản hồi ngay lập tức

**Nhược điểm:**

- Mối quan hệ chặt chẽ
- Hoạt động blocking

**Sử dụng:**

- Truy vấn yêu cầu phản hồi ngay
- Pattern yêu cầu-phản hồi

### Giao tiếp Bất đồng bộ

```
Client → Service A → Message Queue → Service B
         ← Đã xác nhận
```

**Ưu điểm:**

- Mối quan hệ lỏng lẻo
- Khả năng phục hồi tốt hơn
- Khả năng mở rộng tốt hơn

**Nhược điểm:**

- Xử lý lỗi phức tạp
- Không có phản hồi ngay

**Sử dụng:**

- Xử lý nền
- Hệ thống điều khiển sự kiện
- Hoạt động có thông lượng cao

---

## Các Ví dụ về Phân vùng Dữ liệu

### Mạng xã hội (giống Twitter)

**Phân vùng Người dùng:**

```
Phân vùng theo user_id
Shard1: users 1-1000
Shard2: users 1001-2000
```

**Phân vùng Timeline:**

```
Mỗi người dùng có phân vùng timeline riêng
Timeline của User 123 → timeline_123
```

### Thương mại điện tử (giống Amazon)

**Danh mục Sản phẩm:**

```
Phân vùng theo product_category
Shard1: Electronics
Shard2: Books
Shard3: Clothing
```

**Đơn hàng:**

```
Phân vùng theo order_date + user_id
Key tổng hợp để phân phối đều
```

---

## Các Thuật toán Đồng thuận

### Paxos

- Giải quyết đồng thuận trong mạng bất đồng bộ
- Phức tạp để triển khai
- Được sử dụng trong: Google Chubby, etcd

### Raft

- Đơn giản hơn Paxos
- Bầu chọn leader + sao chép log
- Được sử dụng trong: etcd, Consul

### Two-Phase Commit (2PC)

- Đảm bảo giao dịch nguyên tử qua cơ sở dữ liệu phân tán
- Coordinator → Participants → Vote → Commit/Abort
- Giao thức blocking

### Three-Phase Commit (3PC)

- Biến thể non-blocking của 2PC
- Thêm giai đoạn pre-commit
- Khả năng chịu lỗi tốt hơn

---

## Phát hiện Thất bại

### Heartbeats

- Các node gửi heartbeats định kỳ
- Phát hiện thất bại sau khi bỏ lỡ heartbeats
- Đơn giản nhưng có thể có dương tính giả

### Phi Accrual Failure Detector

- Giám sát lịch sử heartbeat
- Tính toán xác suất thất bại
- Được sử dụng trong: Cassandra, Akka

---

## Các Pattern Hệ thống Phân tán Thông dụng

### Circuit Breaker

```
Bình thường → Mở (thất bại > ngưỡng) → Nửa mở → Đóng
```

- Ngăn chặn các thất bại lan truyền
- Được sử dụng trong: Hystrix, Resilience4j

### Bulkhead

```
Cô lập các thất bại tới các pool thread cụ thể
```

- Ngăn chặn cạn kiệt tài nguyên
- Giới hạn sử dụng tài nguyên cho mỗi service

### Saga Pattern

```
Giao dịch bồi thường thay vì 2PC
```

- Cho các giao dịch phân tán
- Mỗi bước có hành động bồi thường

---

## Các Liên kết

- [Tổng quan Phỏng vấn Thiết kế Hệ thống](overview.md)
- [Load Balancing](../devops/kubernetes-basics.md)
- [SQL vs NoSQL](sql-vs-nosql.md)
