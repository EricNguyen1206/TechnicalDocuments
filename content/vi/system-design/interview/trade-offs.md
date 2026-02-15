---
title: "Các Trade-off trong Thiết kế Hệ thống"
date: 2025-02-15
tags: ["system-design", "trade-offs", "consistency", "performance"]
description: "Hướng dẫn toàn diện về các trade-off trong thiết kế hệ thống bao gồm tính nhất quán, hiệu suất, và các quyết định kiến trúc."
author: "Eric Nguyen"
layout: "post"
---

# Các Trade-off trong Thiết kế Hệ thống

## Tại sao Các Trade-off Quan trọng?

Trong thiết kế hệ thống, không có giải pháp hoàn hảo nào tồn tại. Mọi quyết định đều liên quan đến các trade-off giữa các yêu cầu cạnh tranh nhau. Hiểu các trade-off này là rất quan trọng để thiết kế các hệ thống hiệu quả.

---

## 1. Tính nhất quán Mạnh vs Cuối cùng

### Tính nhất quán Mạnh

**Định nghĩa:** Tất cả các lần đọc trả về ghi gần nhất hoặc một lỗi.

**Đặc điểm:**

- Người đọc luôn thấy dữ liệu mới nhất
  | Độ trễ cao hơn (yêu cầu phối hợp)
  | Tính sẵn sàng thấp hơn (các ghi có thể bị chặn)

**Các Trường hợp Sử dụng:**

- Các hệ thống ngân hàng (không thể hiển thị số dư sai)
  | Quản lý tồn kho (không thể bán quá mức)
  | Xử lý thanh toán

**Triển khai:**

- Two-Phase Commit (2PC)
  | Thuật toán đồng thuận Raft
  | Master-Slave với replication đồng bộ

**Ví dụ:**

```sql
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;  -- Cả hai thành công hoặc cả hai thất bại
```

### Tính nhất quán Cuối cùng

**Định nghĩa:** Hệ thống đảm bảo rằng nếu không có cập nhật mới nào được thực hiện, cuối cùng tất cả các lần truy cập sẽ trả về giá trị cập nhật cuối cùng.

**Đặc điểm:**

- Người đọc có thể thấy dữ liệu cũ
  | Độ trễ thấp hơn (không cần phối hợp)
  | Tính sẵn sàng cao hơn

**Các Trường hợp Sử dụng:**

- Các feed mạng xã hội (thấy các bài viết cũ hơn là OK)
  | Giỏ hàng mua sắm (sự không nhất quán tạm thời chấp nhận được)
  | Các hệ thống phân tích

**Triển khai:**

- Replication bất đồng bộ
  | Các kiểu dữ liệu nhân bản miễn xung đột (CRDTs)
  | Các vector phiên bản

**Ví dụ:**

```
Người dùng đăng bài trên Facebook
├── DB Bờ Đông: Đã cập nhật (10ms)
├── DB Bờ Tây: Đã cập nhật (100ms)
└── Người dùng ở Bờ Tây: Thấy bài viết sau 100ms
```

### Tóm tắt Trade-off

| Khía cạnh            | Tính nhất quán Mạnh | Tính nhất quán Cuối cùng |
| -------------------- | ------------------- | ------------------------ |
| Độ Chính xác Dữ liệu | Luôn đúng           | Có thể cũ                |
| Độ trễ               | Cao                 | Thấp                     |
| Tính sẵn sàng        | Thấp                | Cao                      |
| Độ phức tạp          | Cao                 | Thấp                     |

---

## 2. Độ trễ vs Thông lượng

### Độ trễ

**Định nghĩa:** Thời gian để hoàn thành một thao tác duy nhất.

**Đo lường:**

- Độ trễ trung bình
  | Các phần trăm P50, P95, P99
  | Độ trễ tối đa

**Ví dụ:**

```
Thời gian phản hồi API:
- P50: 50ms (50% các yêu cầu dưới 50ms)
- P95: 200ms (95% các yêu cầu dưới 200ms)
- P99: 500ms (99% các yêu cầu dưới 500ms)
```

### Thông lượng

**Định nghĩa:** Số lượng các thao tác hoàn thành mỗi đơn vị thời gian.

**Đo lường:**

- Các yêu cầu mỗi giây (RPS)
  | Các giao dịch mỗi giây (TPS)
  | Các thao tác mỗi giây (OPS)

**Ví dụ:**

```
Dung lượng hệ thống:
- 10,000 yêu cầu/giây
- 100,000 yêu cầu/phút
- 144 triệu yêu cầu/ngày
```

### Trade-off

**Tối ưu hóa cho Độ trễ:**

- Giảm xử lý mỗi yêu cầu
  | Sử dụng caching
  | Pre-compute kết quả
  | **Hậu quả:** Có thể giảm thông lượng (chi phí cao hơn cho mỗi yêu cầu)

**Tối ưu hóa cho Thông lượng:**

- Các thao tác batch
  | Xử lý bất đồng bộ
  | Giảm chi phí mỗi yêu cầu
  | **Hậu quả:** Có thể tăng độ trễ (hàng đợi, batching)

---

## 3. Thuộc tính ACID vs BASE

### ACID (Tính nhất quán Mạnh)

**A - Atomicity:** Tất cả hoặc không

- Các giao dịch hoàn thành hoàn toàn hoặc không hoàn toàn

**C - Consistency:** Database chuyển từ một trạng thái hợp lệ sang một trạng thái khác

- Các ràng buộc luôn được thỏa mãn

**I - Isolation:** Các giao dịch đồng thời không can thiệp

- Serializable, Repeatable Read, v.v.

**D - Durability:** Các giao dịch đã commit tồn tại qua các thất bại

- Dữ liệu được persist vào stable storage

### BASE (Tính nhất quán Cuối cùng)

**B - Basically Available:** Hệ thống luôn phản hồi

- Ngay cả nếu phản hồi cũ

**A - Soft State:** Hệ thống có thể trong trạng thái không nhất quán

- Các cập nhật propagate bất đồng bộ

**E - Eventual Consistency:** Hệ thống trở nên nhất quán cuối cùng

- Nếu không có cập nhật mới, tất cả các node hội tụ

---

## 4. Read Through vs Write Through Caching

### Read Through (Lazy Loading)

- Cache được điền theo yêu cầu
  | Logic cache đơn giản hơn trong ứng dụng
  | Người dùng đầu tiên trải nghiệm cache miss

**Các Trường hợp Sử dụng:**

- Các khối lượng đọc lớn
  | Các pattern truy cập có thể dự đoán

### Write Through

- Cache luôn được cập nhật với các ghi
  | Cache và database nhất quán
  | Ghi chậm hơn (hai thao tác)

**Các Trường hợp Sử dụng:**

- Dữ liệu quan trọng phải mới
  | Các yêu cầu tính nhất quán cao

### Trade-offs

| Khía cạnh      | Read Through            | Write Through         |
| -------------- | ----------------------- | --------------------- |
| Độ trễ Ghi     | Nhanh                   | Chậm hơn (hai ghi)    |
| Độ trễ Đọc     | Biến thiên (cache miss) | Nhất quán (cache hit) |
| Tính nhất quán | Cuối cùng               | Mạnh                  |
| Độ phức tạp    | Thấp                    | Trung bình            |

---

## 5. Xử lý Batch vs Xử lý Stream

### Xử lý Batch

- Xử lý dữ liệu trong các batch/các giai đoạn
  | Độ trễ cao hơn (chờ batch)
  | Thông lượng cao hơn (xử lý nhiều cùng lúc)
  | Chi phí thấp hơn (tận dụng tài nguyên tốt hơn)

**Các Trường hợp Sử dụng:**

- Các báo cáo hàng ngày
  | Các tính toán thanh toán
  | Data warehousing
  | Các hoạt động sao lưu

### Xử lý Stream

- Xử lý từng sự kiện khi nó đến
  | Độ trễ thấp hơn (thời gian thực)
  | Độ phức tạp cao hơn (quản lý trạng thái)
  | Chi phí cao hơn (luôn chạy)

**Các Trường hợp Sử dụng:**

- Phân tích thời gian thực
  | Phát hiện gian lận
  | Giám sát trực tiếp
  | Các đề xuất thời gian thực

### Trade-offs

| Khía cạnh          | Xử lý Batch        | Xử lý Stream             |
| ------------------ | ------------------ | ------------------------ |
| Độ trễ             | Cao (giờ)          | Thấp (mili giây)         |
| Thông lượng        | Rất Cao            | Trung bình               |
| Độ phức tạp        | Thấp               | Cao                      |
| Chi phí            | Thấp hơn           | Cao hơn                  |
| Trường hợp Sử dụng | Phân tích, Báo cáo | Thời gian thực, Giám sát |

---

## 6. Load Balancer vs API Gateway

### Load Balancer

**Tập trung:** Phân phối lưu lượng qua các server

**Các Trách nhiệm:**

- Phân phối lưu lượng (Round Robin, Least Connections, v.v.)
  | Health checks
  | SSL termination
  | L4 vs L7

**Ưu điểm:**

- Đơn giản, nhanh
  | Agnostic về giao thức
  | Phân phối lưu lượng hiệu quả

**Nhược điểm:**

- Tính thông minh routing hạn chế
  | Không có các tính năng cấp ứng dụng

### API Gateway

**Tập trung:** Quản lý API và các mối quan tâm cross-cutting

**Các Trách nhiệm:**

- Routing (dựa trên path, dựa trên phiên bản)
  | Xác thực & Ủy quyền
  | Rate Limiting
  | Chuyển đổi Yêu cầu/Phản hồi
  | SSL termination
  | Logging & Giám sát

**Ưu điểm:**

- Tập trung các mối quan tâm cross-cutting
  | Tập tính năng phong phú
  | Versioning API
  | Chuyển đổi giao thức

**Nhược điểm:**

- Phức tạp hơn
  | Có thể là nút thắt
  | Độ trễ cao hơn

---

## Các Liên kết

- [Tổng quan Phỏng vấn Thiết kế Hệ thống](overview.md)
- [Hệ thống Phân tán](distributed-systems.md)
- [Các Pattern trong Hệ thống Phân tán](design-patterns.md)
