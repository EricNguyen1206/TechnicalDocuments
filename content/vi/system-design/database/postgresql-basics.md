---
title: "PostgreSQL Cơ bản"
date: 2025-02-15
tags: ["postgresql", "database", "sql", "relational-db"]
description: "Giới thiệu về PostgreSQL cơ bản bao gồm cài đặt, các lệnh SQL cơ bản, kiểu dữ liệu và các thao tác thường dùng."
author: "Eric Nguyen"
layout: "post"
---

# PostgreSQL Cơ bản

## PostgreSQL là gì?

PostgreSQL (thường gọi là Postgres) là hệ thống cơ sở dữ liệu object-relational mã nguồn mở, mạnh mẽ. Nó nổi tiếng với:

- **Độ tin cậy**: Tuân thủ ACID và khả năng khôi phục sau sự cố
- **Hiệu suất**: Được tối ưu hóa cho các query phức tạp
- **Khả năng mở rộng**: Các kiểu dữ liệu, hàm và toán tử tùy chỉnh
- **Tuân thủ chuẩn**: Hỗ trợ tiêu chuẩn SQL
- **Mã nguồn mở**: Miễn phí và do cộng đồng phát triển

---

## Cài đặt

### macOS

```bash
# Sử dụng Homebrew
brew install postgresql@15
brew services start postgresql@15

# Kiểm tra cài đặt
psql --version
```

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows

Tải bộ cài đặt từ: https://www.postgresql.org/download/windows/

---

## Bắt đầu

### Kết nối đến PostgreSQL

```bash
# Kết nối với user mặc định
psql

# Kết nối đến database cụ thể
psql -d mydb

# Kết nối với user cụ thể
psql -U postgres -d mydb

# Kết nối với host và port
psql -h localhost -p 5432 -U postgres -d mydb
```

### Các lệnh cơ bản

```sql
-- Liệt kê tất cả databases
\l

-- Kết nối đến database
\c mydb

-- Liệt kê tất cả tables
\dt

-- Mô tả table
\d table_name

-- Liệt kê tất cả schemas
\dn

-- Hiển thị user hiện tại
\conninfo

-- Thoát
\q
```

---

## Tạo Databases và Tables

### Tạo Database

```sql
CREATE DATABASE myapp;

-- Kết nối đến database
\c myapp

-- Xóa database
DROP DATABASE myapp;
```

### Tạo Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tạo Table với Constraints

```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Các Kiểu Dữ liệu

### Numeric Types

```sql
-- Integer types
SMALLINT    -- 2 bytes, -32,768 đến +32,767
INTEGER      -- 4 bytes, -2.1 tỷ đến +2.1 tỷ
BIGINT       -- 8 bytes, phạm vi rất lớn

-- Decimal types
DECIMAL(10,2)  -- 10 chữ số tổng, 2 sau dấu thập phân
NUMERIC          -- Tương tự DECIMAL
REAL             -- 4 bytes, độ chính xác đơn
DOUBLE PRECISION  -- 8 bytes, độ chính xác đôi

-- Serial (tự tăng)
SMALLSERIAL
SERIAL
BIGSERIAL
```

### String Types

```sql
CHAR(10)       -- Độ dài cố định, điền khoảng trắng
VARCHAR(255)    -- Độ dài biến đổi có giới hạn
TEXT            -- Độ dài biến đổi, không giới hạn
```

### Date/Time Types

```sql
TIMESTAMP       -- Date và time với time zone
DATE           -- Chỉ date
TIME            -- Chỉ time
INTERVAL        -- Khoảng thời gian
```

### Boolean Type

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    is_paid BOOLEAN DEFAULT FALSE
);
```

---

## Các thao tác CRUD

### Create (INSERT)

```sql
-- Insert một row
INSERT INTO users (username, email, password_hash)
VALUES ('john_doe', 'john@example.com', 'hashed_password');

-- Insert nhiều rows
INSERT INTO users (username, email, password_hash)
VALUES
    ('alice', 'alice@example.com', 'hash1'),
    ('bob', 'bob@example.com', 'hash2');

-- Insert và trả về kết quả
INSERT INTO users (username, email, password_hash)
VALUES ('charlie', 'charlie@example.com', 'hash3')
RETURNING id, username;
```

### Read (SELECT)

```sql
-- Select tất cả columns
SELECT * FROM users;

-- Select các columns cụ thể
SELECT id, username, email FROM users;

-- Lọc với WHERE
SELECT * FROM users WHERE id = 1;
SELECT * FROM users WHERE email LIKE '%@example.com';
SELECT * FROM users WHERE created_at > '2025-01-01';

-- Sắp xếp kết quả
SELECT * FROM users ORDER BY created_at DESC;
SELECT * FROM users ORDER BY username ASC;

-- Giới hạn kết quả
SELECT * FROM users LIMIT 10;
SELECT * FROM users LIMIT 10 OFFSET 20;  -- Phân trang
```

### Update (UPDATE)

```sql
-- Update một column
UPDATE users
SET email = 'newemail@example.com'
WHERE id = 1;

-- Update nhiều columns
UPDATE users
SET username = 'johnny', email = 'johnny@example.com'
WHERE id = 1;

-- Update với biểu thức
UPDATE posts
SET status = 'published', updated_at = CURRENT_TIMESTAMP
WHERE id = 5;

-- Update tất cả rows (cẩn thận khi dùng)
UPDATE users
SET last_login = CURRENT_TIMESTAMP;
```

### Delete (DELETE)

```sql
-- Xóa các rows cụ thể
DELETE FROM users WHERE id = 1;

-- Xóa với điều kiện
DELETE FROM posts WHERE created_at < '2024-01-01';

-- Xóa tất cả rows
DELETE FROM users;

-- Xóa và trả về kết quả
DELETE FROM posts WHERE id = 5 RETURNING *;
```

---

## Các Mệnh đề Query

### WHERE Clause

```sql
-- Toán tử so sánh
SELECT * FROM users WHERE age > 18;
SELECT * FROM users WHERE email = 'test@example.com';
SELECT * FROM users WHERE status IN ('active', 'pending');
SELECT * FROM users WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31';

-- Toán tử logic
SELECT * FROM users WHERE age > 18 AND email IS NOT NULL;
SELECT * FROM users WHERE status = 'active' OR status = 'pending';
SELECT * FROM users WHERE NOT (status = 'deleted');
```

### LIKE và ILIKE

```sql
-- LIKE (phân biệt hoa thường)
SELECT * FROM users WHERE username LIKE 'john%';
SELECT * FROM users WHERE email LIKE '%@gmail.com';

-- ILIKE (không phân biệt hoa thường)
SELECT * FROM users WHERE username ILIKE 'john%';
```

### GROUP BY

```sql
-- Đếm users theo status
SELECT status, COUNT(*) as user_count
FROM users
GROUP BY status;

-- Tuổi trung bình theo phòng ban
SELECT department, AVG(age) as avg_age
FROM employees
GROUP BY department;
```

### HAVING

```sql
-- Nhóm có count > 5
SELECT status, COUNT(*) as count
FROM users
GROUP BY status
HAVING COUNT(*) > 5;
```

---

## Joins

### INNER JOIN

```sql
SELECT users.username, posts.title
FROM users
INNER JOIN posts ON users.id = posts.user_id;
```

### LEFT JOIN

```sql
SELECT users.username, posts.title
FROM users
LEFT JOIN posts ON users.id = posts.user_id;
```

### RIGHT JOIN

```sql
SELECT users.username, posts.title
FROM users
RIGHT JOIN posts ON users.id = posts.user_id;
```

### FULL OUTER JOIN

```sql
SELECT users.username, posts.title
FROM users
FULL OUTER JOIN posts ON users.id = posts.user_id;
```

---

## Các hàm Aggregation

```sql
-- COUNT
SELECT COUNT(*) FROM users;
SELECT COUNT(email) FROM users;  -- Các email không null

-- SUM
SELECT SUM(amount) FROM orders;

-- AVG
SELECT AVG(age) FROM users;

-- MIN/MAX
SELECT MIN(created_at), MAX(created_at) FROM users;
```

---

## Thay đổi Tables

```sql
-- Thêm column
ALTER TABLE users ADD COLUMN age INTEGER;

-- Xóa column
ALTER TABLE users DROP COLUMN age;

-- Thay đổi loại column
ALTER TABLE users ALTER COLUMN username TYPE VARCHAR(100);

-- Đổi tên column
ALTER TABLE users RENAME COLUMN username TO user_name;

-- Thêm constraint
ALTER TABLE users ADD CONSTRAINT unique_username UNIQUE (username);
```

---

## Indexing

```sql
-- Tạo index
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_status ON posts(status);

-- Tạo unique index
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- Composite index
CREATE INDEX idx_posts_user_status ON posts(user_id, status);

-- Xóa index
DROP INDEX idx_users_email;
```

---

## Quản lý User

```sql
-- Tạo user
CREATE USER myuser WITH PASSWORD 'secure_password';

-- Cấp quyền
GRANT ALL PRIVILEGES ON DATABASE myapp TO myuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO myuser;

-- Tạo superuser
CREATE USER admin WITH PASSWORD 'admin_pass' SUPERUSER;

-- Xóa user
DROP USER myuser;
```

---

## Backup và Restore

### Backup

```bash
# Backup một database
pg_dump mydb > backup.sql

# Backup với custom format
pg_dump -Fc mydb > backup.dump

# Backup tất cả databases
pg_dumpall > all_databases.sql

# Backup table cụ thể
pg_dump -t users mydb > users_backup.sql
```

### Restore

```bash
-- Restore từ file SQL
psql mydb < backup.sql

-- Restore từ custom format
pg_restore -d mydb backup.dump
```

---

## Các Query Thường dùng

### Kiểm tra kích thước table

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Tìm các bản ghi trùng lặp

```sql
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
```

---

## Liên kết

- [PostgreSQL Nâng cao](postgresql-advanced.md)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
