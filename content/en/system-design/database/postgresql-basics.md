---
title: "PostgreSQL Basics"
date: 2025-02-15
tags: ["postgresql", "database", "sql", "relational-db"]
description: "Introduction to PostgreSQL fundamentals including installation, basic SQL commands, data types, and common operations."
author: "Eric Nguyen"
layout: "post"
---

# PostgreSQL Basics

## What is PostgreSQL?

PostgreSQL (often called Postgres) is a powerful, open-source object-relational database system. It's known for:

- **Reliability**: ACID compliance and crash recovery
- **Performance**: Optimized for complex queries
- **Extensibility**: Custom data types, functions, and operators
- **Standards Compliance**: SQL standard support
- **Open Source**: Free and community-driven

---

## Installation

### macOS

```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Verify installation
psql --version
```

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows

Download installer from: https://www.postgresql.org/download/windows/

---

## Getting Started

### Connect to PostgreSQL

```bash
# Connect as default user
psql

# Connect to specific database
psql -d mydb

# Connect as specific user
psql -U postgres -d mydb

# Connect with host and port
psql -h localhost -p 5432 -U postgres -d mydb
```

### Basic Commands

```sql
-- List all databases
\l

-- Connect to database
\c mydb

-- List all tables
\dt

-- Describe table
\d table_name

-- List all schemas
\dn

-- Show current user
\conninfo

-- Quit
\q
```

---

## Creating Databases and Tables

### Create Database

```sql
CREATE DATABASE myapp;

-- Connect to database
\c myapp

-- Drop database
DROP DATABASE myapp;
```

### Create Table

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

### Create Table with Constraints

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

## Data Types

### Numeric Types

```sql
-- Integer types
SMALLINT    -- 2 bytes, -32,768 to +32,767
INTEGER      -- 4 bytes, -2.1 billion to +2.1 billion
BIGINT       -- 8 bytes, huge range

-- Decimal types
DECIMAL(10,2)  -- 10 total digits, 2 after decimal
NUMERIC          -- Same as DECIMAL
REAL             -- 4 bytes, single precision
DOUBLE PRECISION  -- 8 bytes, double precision

-- Serial (auto-increment)
SMALLSERIAL
SERIAL
BIGSERIAL
```

### String Types

```sql
CHAR(10)       -- Fixed-length, space-padded
VARCHAR(255)    -- Variable-length with limit
TEXT            -- Variable-length, no limit
```

### Date/Time Types

```sql
TIMESTAMP       -- Date and time with time zone
DATE           -- Date only
TIME            -- Time only
INTERVAL        -- Time interval
```

### Boolean Type

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    is_paid BOOLEAN DEFAULT FALSE
);
```

---

## CRUD Operations

### Create (INSERT)

```sql
-- Insert single row
INSERT INTO users (username, email, password_hash)
VALUES ('john_doe', 'john@example.com', 'hashed_password');

-- Insert multiple rows
INSERT INTO users (username, email, password_hash)
VALUES
    ('alice', 'alice@example.com', 'hash1'),
    ('bob', 'bob@example.com', 'hash2');

-- Insert and return
INSERT INTO users (username, email, password_hash)
VALUES ('charlie', 'charlie@example.com', 'hash3')
RETURNING id, username;
```

### Read (SELECT)

```sql
-- Select all columns
SELECT * FROM users;

-- Select specific columns
SELECT id, username, email FROM users;

-- Filter with WHERE
SELECT * FROM users WHERE id = 1;
SELECT * FROM users WHERE email LIKE '%@example.com';
SELECT * FROM users WHERE created_at > '2025-01-01';

-- Order results
SELECT * FROM users ORDER BY created_at DESC;
SELECT * FROM users ORDER BY username ASC;

-- Limit results
SELECT * FROM users LIMIT 10;
SELECT * FROM users LIMIT 10 OFFSET 20;  -- Pagination
```

### Update (UPDATE)

```sql
-- Update single column
UPDATE users
SET email = 'newemail@example.com'
WHERE id = 1;

-- Update multiple columns
UPDATE users
SET username = 'johnny', email = 'johnny@example.com'
WHERE id = 1;

-- Update with expression
UPDATE posts
SET status = 'published', updated_at = CURRENT_TIMESTAMP
WHERE id = 5;

-- Update all rows (use with caution)
UPDATE users
SET last_login = CURRENT_TIMESTAMP;
```

### Delete (DELETE)

```sql
-- Delete specific rows
DELETE FROM users WHERE id = 1;

-- Delete with condition
DELETE FROM posts WHERE created_at < '2024-01-01';

-- Delete all rows
DELETE FROM users;

-- Delete and return
DELETE FROM posts WHERE id = 5 RETURNING *;
```

---

## Query Clauses

### WHERE Clause

```sql
-- Comparison operators
SELECT * FROM users WHERE age > 18;
SELECT * FROM users WHERE email = 'test@example.com';
SELECT * FROM users WHERE status IN ('active', 'pending');
SELECT * FROM users WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31';

-- Logical operators
SELECT * FROM users WHERE age > 18 AND email IS NOT NULL;
SELECT * FROM users WHERE status = 'active' OR status = 'pending';
SELECT * FROM users WHERE NOT (status = 'deleted');
```

### LIKE and ILIKE

```sql
-- LIKE (case-sensitive)
SELECT * FROM users WHERE username LIKE 'john%';
SELECT * FROM users WHERE email LIKE '%@gmail.com';

-- ILIKE (case-insensitive)
SELECT * FROM users WHERE username ILIKE 'john%';
```

### GROUP BY

```sql
-- Count users per status
SELECT status, COUNT(*) as user_count
FROM users
GROUP BY status;

-- Average age per department
SELECT department, AVG(age) as avg_age
FROM employees
GROUP BY department;
```

### HAVING

```sql
-- Groups with count > 5
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

## Aggregation Functions

```sql
-- COUNT
SELECT COUNT(*) FROM users;
SELECT COUNT(email) FROM users;  -- Non-null emails

-- SUM
SELECT SUM(amount) FROM orders;

-- AVG
SELECT AVG(age) FROM users;

-- MIN/MAX
SELECT MIN(created_at), MAX(created_at) FROM users;
```

---

## Altering Tables

```sql
-- Add column
ALTER TABLE users ADD COLUMN age INTEGER;

-- Drop column
ALTER TABLE users DROP COLUMN age;

-- Modify column type
ALTER TABLE users ALTER COLUMN username TYPE VARCHAR(100);

-- Rename column
ALTER TABLE users RENAME COLUMN username TO user_name;

-- Add constraint
ALTER TABLE users ADD CONSTRAINT unique_username UNIQUE (username);
```

---

## Indexing

```sql
-- Create index
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_status ON posts(status);

-- Create unique index
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- Composite index
CREATE INDEX idx_posts_user_status ON posts(user_id, status);

-- Drop index
DROP INDEX idx_users_email;
```

---

## User Management

```sql
-- Create user
CREATE USER myuser WITH PASSWORD 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE myapp TO myuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO myuser;

-- Create superuser
CREATE USER admin WITH PASSWORD 'admin_pass' SUPERUSER;

-- Drop user
DROP USER myuser;
```

---

## Backup and Restore

### Backup

```bash
# Backup single database
pg_dump mydb > backup.sql

# Backup with custom format
pg_dump -Fc mydb > backup.dump

# Backup all databases
pg_dumpall > all_databases.sql

# Backup specific table
pg_dump -t users mydb > users_backup.sql
```

### Restore

```bash
# Restore from SQL file
psql mydb < backup.sql

# Restore from custom format
pg_restore -d mydb backup.dump
```

---

## Common Queries

### Check table size

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Find duplicate records

```sql
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
```

---

## Links

- [PostgreSQL Advanced](postgresql-advanced.md)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
