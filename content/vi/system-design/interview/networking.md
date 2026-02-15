---
title: "Cơ bản về Mạng cho Thiết kế Hệ thống"
date: 2025-02-15
tags: ["system-design", "networking", "dns", "websocket"]
description: "Các khái niệm mạng thiết yếu bao gồm DNS, giao thức HTTP, polling, và WebSockets."
author: "Eric Nguyen"
layout: "post"
---

# Cơ bản về Mạng cho Thiết kế Hệ thống

## DNS (Domain Name System)

### DNS Hoạt động Như thế nào

```
Người dùng gõ: www.example.com
    ↓
1. Kiểm tra Cache trình duyệt
    ↓ (không tìm thấy)
2. Kiểm tra Cache OS
    ↓ (không tìm thấy)
3. Truy vấn Recursive Resolver
    ↓
4. Truy vấn Root Server (.)
    ↓ (trả về .com TLD servers)
5. Truy vấn TLD Server (com)
    ↓ (trả về example.com nameservers)
6. Truy vấn Authoritative Server (example.com)
    ↓ (trả về địa chỉ IP)
7. Cache và trả về IP cho người dùng
```

### Các Loại Bản ghi DNS

| Loại  | Mục đích            | Ví dụ               |
| ----- | ------------------- | ------------------- |
| A     | Địa chỉ IPv4        | `192.0.2.1`         |
| AAAA  | Địa chỉ IPv6        | `2001:db8::1`       |
| CNAME | Alias tới tên khác  | `www → example.com` |
| MX    | Mail server         | `mail.example.com`  |
| TXT   | Các bản ghi văn bản | SPF, DKIM           |
| NS    | Nameserver          | `ns1.example.com`   |

### DNS Caching

- **TTL (Time To Live)**: Khoảng thời gian cache
- Cache trình duyệt: ~1-5 phút
- Cache resolver OS: ~30 phút
- Cache ISP: Giờ đến ngày

### Các Xem xét Thiết kế DNS

**High Availability:**

- Nhiều nameservers (bản ghi NS)
- Anycast DNS
- DNS load balancing

**Độ trễ:**

- GeoDNS: Route tới server gần nhất
- Tích hợp CDN: Cache tại edge

---

## HTTP/HTTPS

### HTTP vs HTTPS

| Tính năng | HTTP               | HTTPS             |
| --------- | ------------------ | ----------------- |
| Mã hóa    | Không              | Có (TLS/SSL)      |
| Port      | 80                 | 443               |
| SEO       | Xếp hạng thấp      | Xếp hạng cao      |
| Hiệu suất | Nhanh hơn một chút | Chậm hơn một chút |

### Các Phương thức HTTP

| Phương thức | An toàn | Idempotent | Trường hợp sử dụng                 |
| ----------- | ------- | ---------- | ---------------------------------- |
| GET         | Có      | Có         | Truy xuất dữ liệu                  |
| POST        | Không   | Không      | Tạo resource                       |
| PUT         | Không   | Có         | Cập nhật/Thay thế resource         |
| PATCH       | Không   | Không      | Cập nhật một phần                  |
| DELETE      | Không   | Có         | Xóa resource                       |
| HEAD        | Có      | Có         | Chỉ lấy headers                    |
| OPTIONS     | Có      | Có         | Khám phá các phương thức được phép |

### Các Mã trạng thái HTTP

**2xx Thành công:**

- 200 OK
- 201 Created
- 204 No Content

**3xx Chuyển hướng:**

- 301 Moved Permanently
- 302 Found
- 304 Not Modified

**4xx Lỗi Client:**

- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 429 Too Many Requests

**5xx Lỗi Server:**

- 500 Internal Server Error
- 502 Bad Gateway
- 503 Service Unavailable
- 504 Gateway Timeout

---

## Chiến lược Polling

### Short Polling

```
Client          Server
  |                |
  |----Yêu cầu--->|
  |<--Phản hồi----|
  |   (Dữ liệu/Rỗng)|
  |                |
  |    Chờ 1s      |
  |                |
  |----Yêu cầu--->|
  |<--Phản hồi----|
  |                |
```

**Triển khai:**

```javascript
setInterval(async () => {
  const response = await fetch("/updates")
  if (response.data) {
    displayUpdates(response.data)
  }
}, 1000) // Poll mỗi giây
```

**Ưu điểm:**

- Đơn giản để triển khai
- Hoạt động ở mọi nơi

**Nhược điểm:**

- Lãng phí (nhiều phản hồi rỗng)
- Tải server cao
- Không thời gian thực
- Tiêu tốn pin trên thiết bị di động

### Long Polling

```
Client          Server
  |                |
  |----Yêu cầu--->|
  |   (Giữ)       |
  |                |
  |   (Chờ)       |
  |                |
  |<--Phản hồi----|
  |   (Dữ liệu)   |
  |----Yêu cầu--->|
  |                |
```

**Triển khai:**

```javascript
async function longPoll() {
  while (true) {
    const response = await fetch("/updates", {
      timeout: 30000, // timeout 30 giây
    })
    if (response.data) {
      displayUpdates(response.data)
    }
  }
}
```

**Ưu điểm:**

- Giảm tải server
- Hiệu quả hơn short polling
- Tuổi pin tốt hơn

**Nhược điểm:**

- Chi phí kết nối
- Có thể cần timeout
- Vẫn không thực sự thời gian thực

---

## WebSocket

### WebSocket là gì?

WebSocket cung cấp giao tiếp hai chiều qua một kết nối TCP duy nhất.

```
Client          Server
  |                |
  |---HTTP Nâng cấp->|
  |<--101 Chuyển đổi-|
  |   (WebSocket)  |
  |                |
  |<---Tin nhắn----|
  |---Tin nhắn---->|
  |<---Tin nhắn----|
  |---Tin nhắn---->|
  |   (Thời gian thực)|
```

### Vòng đời WebSocket

1. **Bắt tay**: Yêu cầu nâng cấp HTTP
2. **Kết nối**: Kết nối TCP liên tục
3. **Chuyển dữ liệu**: Tin nhắn hai chiều
4. **Đóng kết nối**: Bất kỳ bên nào có thể đóng

### Triển khai WebSocket

**Client:**

```javascript
const socket = new WebSocket("wss://api.example.com")

socket.onopen = () => {
  console.log("Đã kết nối")
  socket.send(JSON.stringify({ type: "subscribe", channel: "news" }))
}

socket.onmessage = (event) => {
  const data = JSON.parse(event.data)
  updateUI(data)
}

socket.onerror = (error) => {
  console.error("Lỗi WebSocket:", error)
}

socket.onclose = () => {
  console.log("Đã ngắt kết nối")
  // Triển khai logic kết nối lại
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

  // Broadcast tới tất cả client
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ data: "Hello" }))
    }
  })
})
```

### WebSocket vs Polling

| Khía cạnh      | Short Polling | Long Polling | WebSocket |
| -------------- | ------------- | ------------ | --------- |
| Độ trễ         | Cao           | Trung bình   | Thấp      |
| Tải Server     | Cao           | Trung bình   | Thấp      |
| Thời gian thực | Không         | Không        | Có        |
| Băng thông     | Cao           | Trung bình   | Thấp      |
| Độ phức tạp    | Thấp          | Thấp         | Cao       |

---

## Các Tùy chọn Giao tiếp Thời gian thực

### Server-Sent Events (SSE)

```
Client          Server
  |                |
  |---Yêu cầu--->|
  |<---Luồng------|
  |   (Sự kiện)   |
  |<---Sự kiện----|
  |<---Sự kiện----|
  |                |
```

**Đặc điểm:**

- Một chiều (Server → Client)
- Dựa trên HTTP
- Kết nối lại tự động
- Chỉ văn bản

**Trường hợp sử dụng:**

- Chứng khoán
- Bảng tin
  | Kết quả thể thao

### WebSocket

**Đặc điểm:**

- Hai chiều (Cả hai hướng)
  | Hỗ trợ nhị phân và văn bản
- Độ trễ thấp hơn

**Trường hợp sử dụng:**

- Ứng dụng chat
- Trò chơi nhiều người
  | Hợp tác thời gian thực

### WebRTC

**Đặc điểm:**

- Peer-to-peer (P2P)
- Âm thanh/Video
- Kênh dữ liệu

**Trường hợp sử dụng:**

- Cuộc gọi video
  | Chia sẻ màn hình
  | Chuyển tập tin (P2P)

---

## CDN (Content Delivery Network)

### CDN Hoạt động Như thế nào

```
Yêu cầu Người dùng
    ↓
DNS trả về CDN edge gần nhất
    ↓
Server Edge (Cache Hit) → Người dùng
    HOẶC
Server Edge (Cache Miss) → Origin → Edge → Người dùng
```

### Lợi ích CDN

- **Giảm Độ trễ**: Nội dung được phục vụ từ server gần
- **Giảm Băng thông**: Nội dung được cache không hit origin
- **Tính sẵn sàng cao hơn**: Nhiều vị trí edge
- **Bảo vệ DDoS**: Hấp thụ lưu lượng tấn công

### Chiến lược Caching CDN

**Nội dung Tĩnh:**

- HTML, CSS, JS, Hình ảnh
- TTL dài (giờ/ngày)
- Cache tại edge

**Nội dung Động:**

- Phản hồi API
- TTL ngắn (giây/phút)
- Cache tại edge hoặc ứng dụng

---

## Load Balancing

### Layer 4 (Transport Layer)

- Load balancing dựa trên IP/Port
- Nhanh và hiệu quả
- Không kiểm tra nội dung

### Layer 7 (Application Layer)

- Load balancing dựa trên nội dung HTTP
- Có thể route dựa trên URL, headers
- Thông minh hơn nhưng chậm hơn

---

## Các Liên kết

- [Tổng quan Phỏng vấn Thiết kế Hệ thống](overview.md)
- [Hệ thống Phân tán](distributed-systems.md)
- [Load Balancing Deep Dive](../devops/kubernetes-advanced.md)
