---
title: "Thiết kế Bộ tạo ID duy nhất"
date: 2025-02-15
tags: ["system-design", "distributed-id", "snowflake"]
description: "Thiết kế các hệ thống tạo ID duy nhất phân tán bao gồm Snowflake và các phương án thay thế."
author: "Eric Nguyen"
layout: "post"
---

# Thiết kế Bộ tạo ID duy nhất

## Tuyên bố Vấn đề

Thiết kế một hệ thống tạo ID duy nhất mà:

- Tạo các ID duy nhất toàn cầu qua nhiều datacenters
  | Các ID có thể được sắp xếp gần đúng theo thời gian
  | Hệ thống có thể tạo hàng triệu ID mỗi giây
  | Không có nút thắt database trung tâm
  | Các ID là số nguyên 64-bit

---

## Các Yêu cầu

### Các Yêu cầu Chức năng

1. **Tạo Các ID Duy nhất**
   - Không có xung đột qua hệ thống
   - Các ID phải duy nhất vĩnh viễn

2. **Có thể Sắp xếp theo Thời gian**
   - Các ID nên được sắp xếp gần đúng theo thời gian tạo
   - Bật cho indexing hiệu quả

3. **Phân tán**
   - Nhiều datacenters có thể tạo các ID độc lập
   - Không có điểm thất bại đơn lẻ

4. **Thông lượng Cao**
   - Hỗ trợ hàng triệu ID mỗi giây
   - Độ trễ thấp (< 10ms)

### Các Yêu cầu Không Chức năng

- **Tính sẵn sàng**: 99.99% (4.32 phút downtime/năm)
  | **Khả năng mở rộng**: Hỗ trợ tăng trưởng 10x
  | **Độ bền**: Không bao giờ mất hoặc nhân bản ID

---

## Các Tùy chọn ID

### 1. UUID (Universally Unique Identifier)

**Định dạng:** Chuỗi hexadecimal 128-bit
**Ví dụ:** `550e8400-e29b-41d4-a716-446655440000`

**Ưu điểm:**

- Duy nhất toàn cầu
  | Không cần phối hợp
  | Các thư viện tiêu chuẩn có sẵn

**Nhược điểm:**

- 128 bits (lớn hơn cần thiết)
  | Không được sắp xếp theo thời gian (ngẫu nhiên)
  | Hiệu suất indexing database kém

**Mã:**

```python
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# Sử dụng
id = generate_uuid()  # "550e8400-e29b-41d4-a716-446655440000"
```

### 2. Database Auto-Increment

**Định dạng:** Các số nguyên tuần tự
**Ví dụ:** `1, 2, 3, ...`

**Ưu điểm:**

- Đơn giản
  | Nhỏ (64 bits)
  | Được sắp xếp hoàn hảo

**Nhược điểm:**

- Điểm thất bại đơn lẻ
  | Nút thắt tại thời điểm ghi
  | Không hoạt động trong các hệ thống phân tán

### 3. Snowflake ID (Cách tiếp cận của Twitter)

**Định dạng:** Số nguyên 64-bit
**Cấu trúc:**

```
0 | 0000000000 0000000000 0000000000 0000000000 0 | 00000 | 00000 | 0000000000
  │              41 bits timestamp          │ 10 bits │ 5 bits │ 12 bits sequence
  │                                        │ machine │ datacenter│
  │                                        │  ID     │  ID     │
  │                                        │         │         │
  │                                        │         │         └─ Số thứ tự (reset mỗi ms)
  │                                        │         └───────────── ID máy (0-31)
  │                                        └───────────────────────── ID datacenter (0-31)
  └───────────────────────────────────────────────────────────── Timestamp (ms từ epoch)
```

**Ưu điểm:**

- Được sắp xếp theo thời gian
  | Phân tán
  | Không cần phối hợp
  | Nhỏ gọn (64 bits)

**Nhược điểm:**

- Cần đăng ký máy
  | Cần đồng bộ hóa đồng hồ

---

## Triển khai Snowflake

### Phân rã Cấu trúc ID

```
Bố trí bit: 1 (dấu) | 41 (timestamp) | 10 (machine) | 12 (sequence)
Tổng: 64 bits

Timestamp: 41 bits = ~69 năm (từ epoch)
Machine ID: 10 bits = 1024 máy duy nhất
Sequence: 12 bits = 4096 IDs mỗi mili giây
```

### Triển khai Python

```python
import time

class SnowflakeIDGenerator:
    def __init__(self, datacenter_id, machine_id):
        self.datacenter_id = datacenter_id  # 5 bits (0-31)
        self.machine_id = machine_id        # 5 bits (0-31)
        self.sequence = 0                   # 12 bits (0-4095)
        self.last_timestamp = -1            # Last timestamp trong ms
        self.epoch = 1609459200000         # Epoch tùy chỉnh (2021-01-01)

    def generate_id(self):
        timestamp = int(time.time() * 1000) - self.epoch

        if timestamp == self.last_timestamp:
            # Cùng mili giây: tăng sequence
            self.sequence = (self.sequence + 1) & 0xFFF
            if self.sequence == 0:
                # Sequence tràn: chờ mili giây tiếp theo
                while timestamp <= self.last_timestamp:
                    timestamp = int(time.time() * 1000) - self.epoch
        else:
            # Mili giây mới: reset sequence
            self.sequence = 0

        self.last_timestamp = timestamp

        # Kết hợp các thành phần
        # Dịch và OR để tạo ID 64-bit
        snowflake_id = (
            (timestamp << 22) |           # 41 bits tại vị trí 22
            (self.datacenter_id << 17) |  # 5 bits tại vị trí 17
            (self.machine_id << 12) |     # 5 bits tại vị trí 12
            self.sequence                   # 12 bits tại vị trí 0
        )

        return snowflake_id

    def parse_id(self, snowflake_id):
        """Phân rã snowflake ID lại thành các thành phần"""
        sequence = snowflake_id & 0xFFF
        machine_id = (snowflake_id >> 12) & 0x1F
        datacenter_id = (snowflake_id >> 17) & 0x1F
        timestamp = (snowflake_id >> 22) & 0x1FFFFFFFFFF

        return {
            'timestamp': timestamp + self.epoch,
            'datacenter_id': datacenter_id,
            'machine_id': machine_id,
            'sequence': sequence
        }

# Sử dụng
generator = SnowflakeIDGenerator(datacenter_id=1, machine_id=10)
id = generator.generate_id()
print(f"ID đã tạo: {id}")

# Phân rã ID
parsed = generator.parse_id(id)
print(f"Đã phân rã: {parsed}")
```

---

## Đồng bộ hóa Đồng hồ

### Vấn đề

Các server khác nhau có đồng hồ hơi khác nhau:

- Drift đồng hồ theo thời gian
  | Độ trễ mạng trong đồng bộ NTP
  | Các điều chỉnh thủ công

### Giải pháp: Đồng bộ hóa Đồng hồ

**Giao thức Thời gian Mạng (NTP):**

```
Server thường xuyên đồng bộ với các server NTP
Duy trì đồng hồ trong khoảng chính xác ~10ms
```

**Triển khai:**

```bash
# Cấu hình NTP
apt-get install ntp
# /etc/ntp.conf
server pool.ntp.org
server time.nist.gov

# Đồng bộ đồng hồ
ntpdate -u pool.ntp.org
```

### Xử lý Clock Drift

**Phát hiện:**

```python
def handle_clock_backward(timestamp):
    if timestamp < self.last_timestamp:
        # Đồng hồ đã di chuyển lùi (hiếm)
        # Tùy chọn 1: Chờ đồng hồ bắt kịp
        while timestamp <= self.last_timestamp:
            time.sleep(0.001)
            timestamp = int(time.time() * 1000) - self.epoch

        # Tùy chọn 2: Sử dụng timestamp cuối cùng + 1 (rủi ro)
        # timestamp = self.last_timestamp + 1
```

---

## Phối hợp Phân tán

### Gán ID Máy

**Registry Tập trung:**

```
Dịch vụ Đăng ký Máy
    ├── Đăng ký máy mới
    ├── Gán ID máy duy nhất
    └── Duy trì catalog máy
```

**Triển khai:**

```python
class MachineRegistry:
    def register_machine(self, datacenter_id):
        machine_id = self.generate_machine_id(datacenter_id)
        self.store_machine(datacenter_id, machine_id)
        return machine_id

    def generate_machine_id(self, datacenter_id):
        # Tạo ID duy nhất cho máy trong datacenter
        # Có thể sử dụng counter database hoặc ZooKeeper
        pass
```

### Phương án Thay thế: Phối hợp ZooKeeper

```python
from kazoo.client import KazooClient

class ZookeeperSnowflake:
    def __init__(self, zookeeper_hosts):
        self.zk = KazooClient(zookeeper_hosts)
        self.zk.start()

    def acquire_machine_id(self, datacenter_path):
        path = f"{datacenter_path}/machine_"
        # Tạo node tuần tự ephemeral
        result = self.zk.create(path, ephemeral=True, sequence=True)
        machine_id = int(result.split('_')[-1])
        return machine_id
```

---

## Tối ưu hóa Thông lượng Cao

### Pre-allocate ID Ranges

```
Service        ZooKeeper
    │               │
    │---Yêu cầu----->
    │               │
    │<--Range------|
    │   [1000-2000]
    │               │
    └──Tạo từ range
```

**Triển khai:**

```python
class IDRangeAllocator:
    def __init__(self, zookeeper_client):
        self.zk = zookeeper_client
        self.current_id = None
        self.max_id = None

    def allocate_range(self, size=1000):
        """Phân bổ một range IDs"""
        # Lấy max ID hiện tại từ ZooKeeper
        current_max = self.zk.get("/id_counter")[0]

        # Phân bổ range mới
        new_max = current_max + size
        if self.zk.set("/id_counter", str(new_max), version=current_version):
            self.current_id = current_max
            self.max_id = new_max
            return True
        return False  # Xung đột, thử lại

    def generate_id(self):
        """Tạo ID từ range đã phân bổ"""
        if self.current_id >= self.max_id:
            self.allocate_range()

        self.current_id += 1
        return self.current_id
```

### Tạo Batch

```
Tạo nhiều IDs trong một thao tác duy nhất
Giảm chi phí database/phối hợp
```

---

## Phương án Thay thế: ULID (Universally Unique Lexicographically Sortable ID)

**Định dạng:** Chuỗi 26 ký tự
**Ví dụ:** `01ARZ3NDEKTSV4RRFFQ69G5FA`

**Cấu trúc:**

```
01ARZ3NDEKTSV4RRFFQ69G5FA
││││││└┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴─ Random (80 bits)
│││└┴┴┴──────────────────────────── Time (48 bits)
│└┴───────────────────────────────── Phiên bản
└─────────────────────────────────── Timestamp
```

**Ưu điểm:**

- Có thể sắp xếp theo thời gian
  | Không cần phối hợp
  | Định dạng tiêu chuẩn (Crockford's Base32)

**Triển khai:**

```python
import ulid

def generate_ulid():
    return ulid.new()  # "01ARZ3NDEKTSV4RRFFQ69G5FA"
```

---

## Kiến trúc

```
                    ┌─────────────┐
                    │   Client   │
                    └──────┬──────┘
                           │
                    ┌────────▼─────────┐
                    │   Load Balancer  │
                    └────────┬────────┘
                             │
         ┌────────────────────────┼────────────────────────┐
         │                    │                    │
 ┌───────▼────────┐  ┌──────▼─────────┐  ┌──────▼─────────┐
 │   ID Service 1  │  │   ID Service 2 │  │   ID Service N │
 │   (Snowflake)  │  │   (Snowflake)  │  │   (Snowflake)  │
 └───────┬────────┘  └──────┬─────────┘  └──────┬─────────┘
         │                    │                    │
         │                    │                    │
 ┌───────▼────────────────────────────────────────▼─────────┐
 │                 ZooKeeper (Phối hợp)                  │
 │  - Registry ID máy                                   │
 │  - Phân bổ range ID                                  │
 └─────────────────────────────────────────────────────────────┘
```

---

## Các Câu hỏi Tiếp theo

1. **Đồng hồ đi lùi thì sao?**
   - Chờ đồng hồ đồng bộ
   - Sử dụng timestamp cuối cùng + 1

2. **ID máy xung đột thì sao?**
   - Sử dụng ZooKeeper để phối hợp
   - Tự động gán các ID duy nhất

3. **Tràn 64-bit thì sao?**
   - Snowflake: ~69 năm trước khi tràn
   - Sử dụng epoch tùy chỉnh để mở rộng

4. **Làm thế nào để xử lý tràn sequence?**
   - Chờ mili giây tiếp theo
   - Hoặc sử dụng timestamp có độ chính xác cao hơn (micro giây)

5. **Làm thế nào để đảm bảo tính duy nhất qua các khởi động lại?**
   - Persist số thứ tự
   - Bắt đầu từ sequence cuối cùng khi khởi động lại

---

## Các Thực hành Tốt nhất

### 1. Sử dụng Epoch Tùy chỉnh

```python
# Bắt đầu từ 2021-01-01 thay vì 1970-01-01
custom_epoch = 1609459200000
timestamp = current_time - custom_epoch
```

### 2. Đăng ký ID Máy

- Tự động đăng ký khi khởi động
  | Lưu trữ trong ZooKeeper/etcd
  | Xử lý các xung đột đăng ký

### 3. Giám sát Đồng hồ

- Giám sát drift đồng hồ
  | Cảnh báo cho các skew đáng kể
  | Đồng bộ NTP thường xuyên

### 4. Sự suy giảm Nhẹ nhàng

- Nếu phối hợp thất bại, sử dụng timestamp + ngẫu nhiên
  | Tốt hơn là sập
  | Chấp nhận sự rối loạn nhẹ

---

## Các Liên kết

- [Tổng quan Phỏng vấn Thiết kế Hệ thống](overview.md)
- [Hệ thống Phân tán](distributed-systems.md)
- [Thiết kế TinyURL](tinyurl-design.md)
