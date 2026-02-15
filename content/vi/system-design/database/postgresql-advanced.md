---
title: "Các khái niệm nâng cao về PostgreSQL"
date: 2025-02-15
tags: ["postgresql", "database", "sql", "nâng cao"]
description: "Các chủ đề nâng cao về PostgreSQL bao gồm CTEs, window functions, stored procedures, triggers và tối ưu hóa hiệu suất."
author: "Eric Nguyen"
layout: "post"
---

# Các khái niệm nâng cao về PostgreSQL

## Common Table Expressions (CTEs)

CTEs cung cấp cách viết các câu lệnh phụ trợ để sử dụng trong một câu lệnh lớn hơn.

### CTE Cơ bản

```sql
WITH active_users AS (
    SELECT id, username, email
    FROM users
    WHERE last_login > CURRENT_TIMESTAMP - INTERVAL '30 days'
)
SELECT *
FROM active_users
ORDER BY username;
```

### Nhiều CTEs

```sql
WITH
user_stats AS (
    SELECT user_id, COUNT(*) as post_count
    FROM posts
    WHERE status = 'published'
    GROUP BY user_id
),
top_users AS (
    SELECT u.username, us.post_count
    FROM user_stats us
    JOIN users u ON u.id = us.user_id
    ORDER BY us.post_count DESC
    LIMIT 10
)
SELECT * FROM top_users;
```

### Recursive CTE

```sql
WITH RECURSIVE hierarchy AS (
    -- Base case
    SELECT id, name, manager_id, 1 as level
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive case
    SELECT e.id, e.name, e.manager_id, h.level + 1
    FROM employees e
    JOIN hierarchy h ON e.manager_id = h.id
)
SELECT * FROM hierarchy
ORDER BY level, name;
```

### CTE cho Data Modification

```sql
WITH deleted_users AS (
    DELETE FROM users
    WHERE last_login < CURRENT_TIMESTAMP - INTERVAL '1 year'
    RETURNING id, email
)
SELECT * FROM deleted_users;
```

---

## Window Functions

Window functions thực hiện tính toán trên một tập hợp các row liên quan đến row hiện tại.

### ROW_NUMBER()

```sql
SELECT
    username,
    score,
    ROW_NUMBER() OVER (ORDER BY score DESC) as rank
FROM game_scores;
```

### RANK() và DENSE_RANK()

```sql
SELECT
    username,
    score,
    RANK() OVER (ORDER BY score DESC) as rank,
    DENSE_RANK() OVER (ORDER BY score DESC) as dense_rank
FROM game_scores;
```

### LAG() và LEAD()

```sql
SELECT
    username,
    created_at,
    amount,
    LAG(amount) OVER (PARTITION BY username ORDER BY created_at) as prev_amount,
    LEAD(amount) OVER (PARTITION BY username ORDER BY created_at) as next_amount
FROM transactions;
```

### SUM() OVER với PARTITION BY

```sql
SELECT
    department,
    employee_name,
    salary,
    SUM(salary) OVER (PARTITION BY department) as department_total,
    salary * 100.0 / SUM(salary) OVER (PARTITION BY department) as salary_percentage
FROM employees;
```

### Moving Average

```sql
SELECT
    date,
    revenue,
    AVG(revenue) OVER (
        ORDER BY date
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) as moving_avg_3days
FROM daily_revenue;
```

### Window Frames

```sql
ROWS BETWEEN 3 PRECEDING AND CURRENT ROW   -- 4 rows cuối cùng kể cả row hiện tại
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW  -- Tất cả rows đến row hiện tại
RANGE BETWEEN INTERVAL '7 DAYS' PRECEDING AND CURRENT ROW  -- Dựa trên thời gian
```

---

## Views

### Tạo View

```sql
CREATE VIEW user_posts AS
SELECT
    u.id as user_id,
    u.username,
    COUNT(p.id) as post_count,
    MAX(p.created_at) as last_post_date
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.username;
```

### Query View

```sql
SELECT * FROM user_posts WHERE post_count > 0;
```

### Materialized View

```sql
CREATE MATERIALIZED VIEW post_stats AS
SELECT
    DATE(created_at) as post_date,
    COUNT(*) as total_posts,
    COUNT(DISTINCT user_id) as unique_users
FROM posts
WHERE status = 'published'
GROUP BY DATE(created_at);

-- Refresh materialized view
REFRESH MATERIALIZED VIEW post_stats;

-- Refresh concurrently (cho phép query trong quá trình refresh)
REFRESH MATERIALIZED VIEW CONCURRENTLY post_stats;
```

### Xóa View

```sql
DROP VIEW user_posts;
DROP MATERIALIZED VIEW post_stats;
```

---

## Stored Procedures và Functions

### Tạo Function

```sql
CREATE OR REPLACE FUNCTION get_user_stats(user_id INTEGER)
RETURNS TABLE(
    username TEXT,
    post_count BIGINT,
    comment_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.username,
        (SELECT COUNT(*) FROM posts WHERE user_id = $1),
        (SELECT COUNT(*) FROM comments WHERE user_id = $1)
    FROM users u
    WHERE u.id = $1;
END;
$$ LANGUAGE plpgsql;
```

### Gọi Function

```sql
SELECT * FROM get_user_stats(1);
```

### Function với OUT Parameters

```sql
CREATE OR REPLACE FUNCTION calculate_totals(
    IN user_id INTEGER,
    OUT post_count INTEGER,
    OUT like_count INTEGER
) AS $$
BEGIN
    SELECT COUNT(*) INTO post_count FROM posts WHERE user_id = user_id;
    SELECT COUNT(*) INTO like_count FROM likes WHERE user_id = user_id;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM calculate_totals(1);
```

### Trigger Function

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Triggers

### Tạo Trigger

```sql
CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

### Audit Log Trigger

```sql
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name TEXT,
    operation TEXT,
    old_data JSONB,
    new_data JSONB,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, operation, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, operation, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, operation, old_data)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_audit
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_changes();
```

---

## JSON và JSONB

### Kiểu dữ liệu JSONB

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    metadata JSONB
);

INSERT INTO products (name, metadata)
VALUES (
    'Laptop',
    '{"brand": "Dell", "price": 999.99, "specs": {"ram": "16GB", "storage": "512GB"}}'
);
```

### Query JSONB

```sql
-- Truy cập field JSON
SELECT name, metadata->>'brand' as brand
FROM products;

-- Truy cập nested field
SELECT name, metadata#>'{specs,ram}' as ram
FROM products;

-- Kiểm tra nếu key tồn tại
SELECT * FROM products WHERE metadata ? 'specs';

-- Query theo giá trị
SELECT * FROM products
WHERE (metadata->>'price')::NUMERIC > 500;
```

### Các toán tử JSONB

```sql
->   -- Lấy field object JSON dưới dạng JSON
->>  -- Lấy field object JSON dưới dạng text
#>   -- Lấy object JSON tại đường dẫn đã chỉ định
#>>  -- Lấy object JSON tại đường dẫn đã chỉ định dưới dạng text
?    -- Kiểm tra nếu key tồn tại
@>   -- Kiểm tra nếu JSON chứa JSON khác
||   -- Nối JSON
```

### Indexes cho JSONB

```sql
-- GIN index cho JSONB
CREATE INDEX idx_products_metadata ON products USING GIN (metadata);

-- Index cho field JSON cụ thể
CREATE INDEX idx_products_price ON products ((metadata->>'price'));
```

---

## Arrays

### Kiểu dữ liệu Array

```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    tags TEXT[]
);

INSERT INTO posts (title, tags)
VALUES ('PostgreSQL Tips', ARRAY['database', 'sql', 'postgresql']);
```

### Query Arrays

```sql
-- Chứa element
SELECT * FROM posts WHERE tags @> ARRAY['sql'];

-- Overlap với array
SELECT * FROM posts WHERE tags && ARRAY['sql', 'database'];

-- Độ dài array
SELECT title, array_length(tags, 1) as tag_count FROM posts;

-- Unnest array
SELECT unnest(tags) as tag FROM posts;
```

---

## Full-Text Search

### tsvector và tsquery

```sql
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title TEXT,
    content TEXT,
    search_vector TSVECTOR
);

-- Tạo search vector
CREATE OR REPLACE FUNCTION article_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER article_search_update
BEFORE INSERT OR UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION article_search_vector();
```

### Full-Text Search

```sql
-- Tìm kiếm với tsquery
SELECT title, content
FROM articles
WHERE search_vector @@ to_tsquery('english', 'postgres & database');

-- Tìm kiếm với plainto_tsquery (phân tích đơn giản)
SELECT title, content
FROM articles
WHERE search_vector @@ plainto_tsquery('english', 'postgres database');

-- Xếp hạng kết quả
SELECT
    title,
    ts_rank(search_vector, to_tsquery('english', 'postgres')) as rank
FROM articles
WHERE search_vector @@ to_tsquery('english', 'postgres')
ORDER BY rank DESC;
```

### GIN Index cho Full-Text Search

```sql
CREATE INDEX idx_articles_search ON articles USING GIN (search_vector);
```

---

## Transactions

### BEGIN, COMMIT, ROLLBACK

```sql
BEGIN;

INSERT INTO accounts (user_id, balance) VALUES (1, 1000);
UPDATE accounts SET balance = balance - 100 WHERE user_id = 1;

-- Commit nếu thành công
COMMIT;

-- Hoặc rollback nếu có lỗi
ROLLBACK;
```

### Savepoints

```sql
BEGIN;

INSERT INTO orders (user_id, amount) VALUES (1, 100);
SAVEPOINT order_created;

UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 1;

-- Rollback đến savepoint
ROLLBACK TO order_created;

COMMIT;
```

### Các mức độ cô lập

```sql
-- Read Committed (mặc định)
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Repeatable Read
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Serializable
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

---

## Partitioning

### Range Partitioning

```sql
CREATE TABLE orders (
    id SERIAL,
    order_date DATE NOT NULL,
    customer_id INTEGER,
    amount NUMERIC,
    PRIMARY KEY (id, order_date)
) PARTITION BY RANGE (order_date);

-- Tạo partitions
CREATE TABLE orders_2024 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE orders_2025 PARTITION OF orders
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

### List Partitioning

```sql
CREATE TABLE logs (
    id SERIAL,
    log_date DATE,
    level VARCHAR(10),
    message TEXT,
    PRIMARY KEY (id, level)
) PARTITION BY LIST (level);

CREATE TABLE logs_error PARTITION OF logs
    FOR VALUES IN ('error', 'critical');

CREATE TABLE logs_warning PARTITION OF logs
    FOR VALUES IN ('warning');
```

---

## Tối ưu hóa Hiệu suất

### EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE
SELECT * FROM users JOIN posts ON users.id = posts.user_id
WHERE posts.status = 'published';
```

### Phân tích sử dụng Index

```sql
-- Kiểm tra sử dụng index
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Slow Query Log

```sql
-- Bật log slow queries
ALTER SYSTEM SET log_min_duration_statement = '1s';

-- Reload cấu hình
SELECT pg_reload_conf();
```

### VACUUM và ANALYZE

```sql
-- Vacuum một table
VACUUM VERBOSE users;

-- Analyze cho query planner
ANALYZE users;

-- Vacuum và analyze cùng lúc
VACUUM ANALYZE users;

-- Autovacuum được bật mặc định
-- Tùy chỉnh autovacuum settings
ALTER TABLE users SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);
```

---

## Connection Pooling với PgBouncer

### Cài đặt

```bash
# Ubuntu/Debian
sudo apt install pgbouncer

# macOS
brew install pgbouncer
```

### Cấu hình (pgbouncer.ini)

```ini
[databases]
myapp = host=localhost port=5432 dbname=myapp

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = userlist.txt
pool_mode = transaction
max_client_conn = 100
default_pool_size = 25
```

### User List (userlist.txt)

```
"postgres" "md5hashedpassword"
```

### Khởi động PgBouncer

```bash
pgbouncer -d pgbouncer.ini

-- Kết nối đến PgBouncer thay vì Postgres
psql -h localhost -p 6432 -U postgres -d myapp
```

---

## Replication

### Thiết lập Master

```sql
-- Tạo user replication
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'password';

-- Cấp quyền replication
ALTER ROLE replicator WITH REPLICATION;
```

### Cấu hình Master (postgresql.conf)

```
wal_level = replica
max_wal_senders = 3
max_replication_slots = 3
synchronous_commit = on
```

### Cấu hình pg_hba.conf

```
host    replication     replicator      192.168.1.100/32   md5
```

### Thiết lập Slave

```
# recovery.conf (PostgreSQL 11 và cũ hơn)
standby_mode = on
primary_conninfo = 'host=master_ip port=5432 user=replicator password=password'
```

---

## Monitoring Queries

### Active Connections

```sql
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    query
FROM pg_stat_activity
WHERE state != 'idle';
```

### Table Size

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

### Index Size

```sql
SELECT
    indexrelname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 10;
```

---

## Best Practices

### 1. Sử dụng Parameterized Queries

```sql
-- Tốt (parameterized)
PREPARE get_user(INT) AS SELECT * FROM users WHERE id = $1;
EXECUTE get_user(1);

-- Tránh SQL injection
-- Tệ: "SELECT * FROM users WHERE id = " + user_input
```

### 2. Sử dụng Connection Pooling

- Giảm chi phí connection
- Sử dụng PgBouncer hoặc pooling phía ứng dụng

### 3. Monitor Hiệu suất

- Thường xuyên kiểm tra slow queries
- Phân tích query plans với EXPLAIN ANALYZE
- Monitor sử dụng index

### 4. Bảo trì thường xuyên

- Lên lịch VACUUM và ANALYZE thường xuyên
- Monitor dung lượng disk
- Backup thường xuyên

### 5. Sử dụng Kiểu dữ liệu phù hợp

```sql
-- Tốt
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## Liên kết

- [PostgreSQL Cơ bản](postgresql-basics.md)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PgBouncer Documentation](https://www.pgbouncer.org/)
