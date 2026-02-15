---
title: "PostgreSQL Advanced Concepts"
date: 2025-02-15
tags: ["postgresql", "database", "sql", "advanced"]
description: "Advanced PostgreSQL topics including CTEs, window functions, stored procedures, triggers, and performance optimization."
author: "Eric Nguyen"
layout: "post"
---

# PostgreSQL Advanced Concepts

## Common Table Expressions (CTEs)

CTEs provide a way to write auxiliary statements for use in a larger query.

### Basic CTE

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

### Multiple CTEs

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

### CTE for Data Modification

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

Window functions perform calculations across a set of rows related to the current row.

### ROW_NUMBER()

```sql
SELECT
    username,
    score,
    ROW_NUMBER() OVER (ORDER BY score DESC) as rank
FROM game_scores;
```

### RANK() and DENSE_RANK()

```sql
SELECT
    username,
    score,
    RANK() OVER (ORDER BY score DESC) as rank,
    DENSE_RANK() OVER (ORDER BY score DESC) as dense_rank
FROM game_scores;
```

### LAG() and LEAD()

```sql
SELECT
    username,
    created_at,
    amount,
    LAG(amount) OVER (PARTITION BY username ORDER BY created_at) as prev_amount,
    LEAD(amount) OVER (PARTITION BY username ORDER BY created_at) as next_amount
FROM transactions;
```

### SUM() OVER with PARTITION BY

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
ROWS BETWEEN 3 PRECEDING AND CURRENT ROW   -- Last 4 rows including current
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW  -- All rows up to current
RANGE BETWEEN INTERVAL '7 DAYS' PRECEDING AND CURRENT ROW  -- Time-based
```

---

## Views

### Create View

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

-- Refresh concurrently (allows queries during refresh)
REFRESH MATERIALIZED VIEW CONCURRENTLY post_stats;
```

### Drop View

```sql
DROP VIEW user_posts;
DROP MATERIALIZED VIEW post_stats;
```

---

## Stored Procedures and Functions

### Create Function

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

### Call Function

```sql
SELECT * FROM get_user_stats(1);
```

### Function with OUT Parameters

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

### Create Trigger

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

## JSON and JSONB

### JSONB Data Type

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
-- Access JSON field
SELECT name, metadata->>'brand' as brand
FROM products;

-- Access nested field
SELECT name, metadata#>'{specs,ram}' as ram
FROM products;

-- Check if key exists
SELECT * FROM products WHERE metadata ? 'specs';

-- Query by value
SELECT * FROM products
WHERE (metadata->>'price')::NUMERIC > 500;
```

### JSONB Operators

```sql
->   -- Get JSON object field as JSON
->>  -- Get JSON object field as text
#>   -- Get JSON object at specified path
#>>  -- Get JSON object at specified path as text
?    -- Check if key exists
@>   -- Check if JSON contains another JSON
||   -- Concatenate JSON
```

### JSONB Indexes

```sql
-- GIN index for JSONB
CREATE INDEX idx_products_metadata ON products USING GIN (metadata);

-- Index for specific JSON field
CREATE INDEX idx_products_price ON products ((metadata->>'price'));
```

---

## Arrays

### Array Data Type

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
-- Contains element
SELECT * FROM posts WHERE tags @> ARRAY['sql'];

-- Overlaps with array
SELECT * FROM posts WHERE tags && ARRAY['sql', 'database'];

-- Array length
SELECT title, array_length(tags, 1) as tag_count FROM posts;

-- Unnest array
SELECT unnest(tags) as tag FROM posts;
```

---

## Full-Text Search

### tsvector and tsquery

```sql
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title TEXT,
    content TEXT,
    search_vector TSVECTOR
);

-- Create search vector
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
-- Search with tsquery
SELECT title, content
FROM articles
WHERE search_vector @@ to_tsquery('english', 'postgres & database');

-- Search with plainto_tsquery (simple parsing)
SELECT title, content
FROM articles
WHERE search_vector @@ plainto_tsquery('english', 'postgres database');

-- Ranking results
SELECT
    title,
    ts_rank(search_vector, to_tsquery('english', 'postgres')) as rank
FROM articles
WHERE search_vector @@ to_tsquery('english', 'postgres')
ORDER BY rank DESC;
```

### GIN Index for Full-Text Search

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

-- Commit if successful
COMMIT;

-- Or rollback if error occurs
ROLLBACK;
```

### Savepoints

```sql
BEGIN;

INSERT INTO orders (user_id, amount) VALUES (1, 100);
SAVEPOINT order_created;

UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 1;

-- Rollback to savepoint
ROLLBACK TO order_created;

COMMIT;
```

### Isolation Levels

```sql
-- Read Committed (default)
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

-- Create partitions
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

## Performance Optimization

### EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE
SELECT * FROM users JOIN posts ON users.id = posts.user_id
WHERE posts.status = 'published';
```

### Index Usage Analysis

```sql
-- Check index usage
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
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = '1s';

-- Reload configuration
SELECT pg_reload_conf();
```

### VACUUM and ANALYZE

```sql
-- Vacuum a table
VACUUM VERBOSE users;

-- Analyze for query planner
ANALYZE users;

-- Vacuum and analyze together
VACUUM ANALYZE users;

-- Autovacuum is enabled by default
-- Tune autovacuum settings
ALTER TABLE users SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);
```

---

## Connection Pooling with PgBouncer

### Installation

```bash
# Ubuntu/Debian
sudo apt install pgbouncer

# macOS
brew install pgbouncer
```

### Configuration (pgbouncer.ini)

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

### Start PgBouncer

```bash
pgbouncer -d pgbouncer.ini

# Connect to PgBouncer instead of Postgres
psql -h localhost -p 6432 -U postgres -d myapp
```

---

## Replication

### Set Up Master

```sql
-- Create replication user
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'password';

-- Grant replication
ALTER ROLE replicator WITH REPLICATION;
```

### Configure Master (postgresql.conf)

```
wal_level = replica
max_wal_senders = 3
max_replication_slots = 3
synchronous_commit = on
```

### Configure pg_hba.conf

```
host    replication     replicator      192.168.1.100/32   md5
```

### Set Up Slave

```
# recovery.conf (PostgreSQL 11 and earlier)
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

### 1. Use Parameterized Queries

```sql
-- Good (parameterized)
PREPARE get_user(INT) AS SELECT * FROM users WHERE id = $1;
EXECUTE get_user(1);

-- Avoid SQL injection
-- Bad: "SELECT * FROM users WHERE id = " + user_input
```

### 2. Use Connection Pooling

- Reduce connection overhead
- Use PgBouncer or application-side pooling

### 3. Monitor Performance

- Regularly check slow queries
- Analyze query plans with EXPLAIN ANALYZE
- Monitor index usage

### 4. Regular Maintenance

- Schedule regular VACUUM and ANALYZE
- Monitor disk space
- Backup regularly

### 5. Use Appropriate Data Types

```sql
-- Good
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## Links

- [PostgreSQL Basics](postgresql-basics.md)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PgBouncer Documentation](https://www.pgbouncer.org/)
