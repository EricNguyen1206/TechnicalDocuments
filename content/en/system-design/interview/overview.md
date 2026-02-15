---
title: "System Design Interview Overview"
date: 2025-02-15
tags: ["system-design", "interview", "distributed-system"]
description: "Introduction to system design interviews, what they are, and how to approach them effectively."
author: "Eric Nguyen"
layout: "post"
---

# System Design Interview Overview

## What is System Design Interview?

A System Design Interview evaluates your ability to design scalable, fault-tolerant systems and solve complex architectural problems. It's a critical part of the hiring process at tech giants like Google, Facebook, Amazon, and others.

### What Interviewers Look For

- **Scalability**: Can the system handle growth in users/data?
- **Reliability**: Will the system remain available under failures?
- **Performance**: Will the system respond quickly under load?
- **Maintainability**: Can the system evolve with changing requirements?
- **Cost-effectiveness**: Is the design cost-efficient?

---

## System Design vs Object-Oriented Design

### Object-Oriented Design (Low-Level)

- Focus on class design, patterns, and code structure
- Scope: Single application/module
- Example: Design a parking lot, design a URL shortener class

### System Design (High-Level)

- Focus on architecture, scalability, and distributed systems
- Scope: Multiple services, databases, caches
- Example: Design Twitter, design a URL shortener system

---

## 4-Step Approach to System Design Questions

### Step 1: Clarify Requirements

**Functional Requirements**

- What features should the system support?
- What are the main use cases?

**Non-Functional Requirements**

- Scale: How many users? How much data?
- Latency: What are the response time requirements?
- Availability: How much uptime is required?
- Consistency: What consistency model is needed?

**Example Questions:**

- "What should the system do?"
- "How many daily active users?"
- "What's the expected growth rate?"
- "Are there any special requirements (real-time, security)?"

### Step 2: Propose High-Level Design

- **API Design**: Define key endpoints
- **Data Model**: Identify main entities and relationships
- **High-Level Architecture**: Sketch the major components

**Key Components to Consider:**

- Load Balancer
- API Gateway
- Web Servers
- Databases
- Caches
- Message Queues
- CDNs
- Search Services

### Step 3: Deep Dive into Critical Components

Focus on 2-3 most important components:

- **Data Storage**: SQL vs NoSQL, sharding, replication
- **Caching**: Cache strategies, invalidation
- **Load Balancing**: Algorithms, health checks
- **Communication**: Synchronous vs Asynchronous

### Step 4: Bottlenecks & Scalability

- **Identify bottlenecks**: Database queries, network I/O, CPU
- **Propose solutions**: Caching, sharding, replication, CDN
- **Trade-offs**: Discuss pros and cons of each solution

---

## Common System Design Topics

### 1. Scalability

- **Vertical Scaling**: Scale up (add more resources to single machine)
- **Horizontal Scaling**: Scale out (add more machines)

### 2. Load Balancing

- Algorithms: Round Robin, Least Connections, Consistent Hashing
- Types: Layer 4 (Transport) vs Layer 7 (Application)

### 3. Caching

- Client-side caching
- CDN caching
- Server-side caching
- Database caching

### 4. Database Design

- SQL vs NoSQL
- Replication (Master-Slave, Master-Master)
- Sharding (Horizontal Partitioning)
- Consistency Models (Strong vs Eventual)

### 5. Message Queues

- Decoupling services
- Asynchronous processing
- Kafka, RabbitMQ, SQS

### 6. Microservices vs Monolith

- When to use each architecture
- Service discovery
- API Gateway patterns

---

## Tips for Success

### 1. Communicate Constantly

- Think aloud
- Ask clarifying questions
- Explain your reasoning

### 2. Start Simple, Then Scale

- Don't over-engineer initially
- Add complexity as needed

### 3. Draw Diagrams

- High-level architecture first
- Then dive into details

### 4. Estimate Quantities

- Storage requirements
- Bandwidth needs
- Number of servers

### 5. Discuss Trade-offs

- No perfect solution exists
- Explain why you chose certain approaches

### 6. Be Prepared for Follow-ups

- "What if we need real-time updates?"
- "How would you handle failure of X?"
- "What if traffic increases 10x?"

---

## Common Estimation Examples

### URL Shortener (TinyURL)

- Total URLs: 100 million
- Each URL: 500 bytes
- Storage: 50 GB
- Writes: 10M per day
- Reads: 100M per day
- QPS (queries per second): ~1,200

### Chat System

- Total users: 500M
- Daily active users: 100M
- Messages per day: 10B
- Storage per message: 1 KB
- Daily storage: 10 TB
- Read QPS: ~10,000
- Write QPS: ~120,000

---

## Sample Question Flow

**Question**: Design a URL shortener like TinyURL

**Step 1: Clarify**

- Functional: Shorten URLs, redirect, analytics, expiration
- Scale: 100M URLs, 10M daily
- Non-functional: < 100ms latency, 99.9% availability

**Step 2: High-Level Design**

- API: shorten(), redirect(), delete()
- Database: URLs table with hash, long URL, user, timestamp
- Cache: Redis for hot URLs
- Load Balancer: Distribute traffic

**Step 3: Deep Dive**

- Hash generation: Base62 encoding
- Database sharding: By hash prefix
- Caching: LRU for popular URLs

**Step 4: Scalability**

- CDN for static assets
- Async processing for analytics
- Rate limiting for abuse prevention

---

## Links

- [Distributed Systems Fundamentals](distributed-systems.md)
- [Load Balancing](../devops/kubernetes-basics.md)
- [SQL vs NoSQL](sql-vs-nosql.md)
