---
title: Phỏng vấn Thiết kế Hệ thống
tags: ["system-design", "interview"]
date: 2025-02-15
---

# Phỏng vấn Thiết kế Hệ thống

## Level 1: Các Chủ đề Cơ bản

- [Tổng quan Phỏng vấn Thiết kế Hệ thống](overview.md) - Giới thiệu về các cuộc phỏng vấn thiết kế hệ thống và cách tiếp cận
- [Cơ bản về Hệ thống Phân tán](distributed-systems.md) - Định lý CAP, tính nhất quán, replication, sharding
- [Cơ bản về Mạng](networking.md) - DNS, HTTP, polling, WebSockets
- [Load Balancing và API Gateway](load-balancing.md) - Các thuật toán load balancing và các pattern API gateway
- [Caching và Message Queues](caching-message-queues.md) - Các chiến lược cache và các pattern message queue
- [Cơ sở dữ liệu SQL vs NoSQL](sql-vs-nosql.md) - So sánh database và các trường hợp sử dụng
- [Thiết kế URL Shortener (TinyURL)](tinyurl-design.md) - Thiết kế hệ thống URL shortener hoàn chỉnh
- [Thiết kế Bộ tạo ID Duy nhất](unique-id-generator.md) - Tạo ID phân tán (Snowflake)

## Level 2: Các Chủ đề Nâng cao

- [Các Trade-off trong Thiết kế Hệ thống](trade-offs.md) - Các trade-off quan trọng bao gồm tính nhất quán, hiệu suất, và các quyết định kiến trúc
- [Các Pattern trong Hệ thống Phân tán](design-patterns.md) - Các pattern thiết kế thiết yếu bao gồm Circuit Breaker, Side-car, Saga, CQRS
- [Thiết kế Hệ thống Uber](uber-design.md) - Thiết kế hệ thống hoàn chỉnh cho dịch vụ gọi xe
- [Thiết kế Hệ thống WhatsApp](whatsapp-design.md) - Thiết kế hệ thống hoàn chỉnh cho ứng dụng nhắn tin
- [Thiết kế Hệ thống Tìm kiếm](search-design.md) - Thiết kế hệ thống hoàn chỉnh cho search engine
- [Thiết kế Distributed Counter](distributed-counter.md) - Thiết kế hệ thống đếm phân tán
- [Bloom Filters](bloom-filters.md) - Các cấu trúc dữ liệu xác suất bao gồm Bloom Filters và HyperLogLog
- [Bầu chọn Leader và Đồng thuận](leader-election-consensus.md) - Các thuật toán bầu chọn leader và đồng thuận (Raft, Paxos)
- [Định lý PACELC](pacelc-theorem.md) - Mở rộng của định lý CAP với độ trễ
- [Di chuyển từ Monolith sang Microservices](monolith-to-microservices.md) - Chiến lược và các pattern di chuyển
