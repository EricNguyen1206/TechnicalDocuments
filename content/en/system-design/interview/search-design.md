---
title: "Design a Search System"
date: 2025-02-15
tags: ["system-design", "search", "elasticsearch", "indexing"]
description: "Complete system design for a search engine including indexing, ranking, and scaling strategies."
author: "Eric Nguyen"
layout: "post"
---

# Design a Search System

## Problem Statement

Design a search system like Google or Elasticsearch that supports:

- Full-text search across documents
- Relevance ranking
- Faceted search (filters)
- Autocomplete/suggestions
- Search analytics
- Real-time indexing
- Handle billions of documents

---

## Functional Requirements

### Core Features

**Search Capabilities:**

- Full-text search with AND, OR, NOT operators
- Phrase search (exact phrase matching)
- Wildcard search (\*, ?)
- Fuzzy search (typos tolerance)
- Proximity search (words within N words)

**Advanced Features:**

- Faceted search (category, date, price range)
- Highlighting search terms in results
- Sort by relevance, date, popularity
- Pagination
- Search suggestions/autocomplete

**Content Types:**

- Web pages
- Documents (PDF, DOCX, etc.)
- Images
- Videos
- Products

---

## Non-Functional Requirements

### Scale Requirements

**Assumptions:**

- 10 billion documents indexed
- 100 million searches per day
- 1 million new documents per day
- 10:1 read/write ratio

### Performance Requirements

- **Latency:**
  - Simple query: < 100ms
  - Complex query: < 500ms
  - Autocomplete: < 50ms

- **Freshness:**
  - New documents indexed within seconds
  - Search index updated in near real-time

- **Availability:** 99.9%

---

## High-Level Architecture

```
                      ┌───────────┐
                      │   Client   │
                      └─────┬─────┘
                            │
                ┌─────────▼─────────┐
                │   Load Balancer   │
                └─────────┬─────────┘
                          │
          ┌─────────────┼─────────────┐
          │             │             │
    ┌─────▼─────┐ ┌──▼──────┐ ┌──▼──────┐
    │   Search   │ │ Indexer  │ │ Admin  │
    │  Service  │ │ Service  │ │ Service │
    └─────┬─────┘ └──┬───────┘ └──┬──────┘
          │             │             │
          │             │             │
          │    ┌────────┴───────┐     │
          │    │  Message Queue  │     │
          │    │    (Kafka)      │     │
          │    └────────┬─────────┘     │
          │             │               │
    ┌─────▼─────────▼───┐     │         │
    │   Indexing Workers │     │         │
    └─────────┬───────────┘     │         │
              │                   │
    ┌───────────▼──────────┐     │         │
    │  Search Index Cluster │     │         │
    │  (Elasticsearch)      │     │         │
    └───────────┬───────────┘     │         │
                │                   │
    ┌───────────▼───────────┐     │         │
    │  Document Store       │     │         │
    │  (Cassandra)         │     │         │
    └───────────┬───────────┘     │         │
                │                   │
    ┌───────────▼───────────┐     │         │
    │  Object Store (S3)     │     │         │
    └───────────────────────┘     │         │
                                      │
                          ┌─────────▼───────────┐
                          │  Analytics Service  │
                          └───────────────────────┘
```

---

## Search Flow

### Query Processing

```
User Query
    ↓
Load Balancer
    ↓
Search Service
    ├─→ Query Parsing & Analysis
    │   - Tokenization
    │   - Stop words removal
    │   - Stemming/lemmatization
    │   - Synonym expansion
    │
    ├─→ Query Execution
    │   - Query index (Elasticsearch)
    │   - Apply filters
    │   - Sort by relevance
    │
    ├─→ Result Processing
    │   - Highlight terms
    │   - Facet aggregation
    │   - Pagination
    │
    └─→ Fetch Document Data
        - From document store or CDN
```

---

## Indexing Pipeline

### Document Processing Flow

```
Document Source (web crawler, user uploads)
    ↓
Document Fetcher
    ↓
Content Extraction
    ├─→ Text extraction (PDF, DOCX)
    ├─→ Metadata extraction (author, date, etc.)
    └─→ Media analysis (images, videos)
    ↓
Text Processing
    ├─→ Tokenization
    ├─→ Stop words removal
    ├─→ Stemming/lemmatization
    └─→ Entity recognition
    ↓
Index Builder
    ├─→ Build inverted index
    ├─→ Create document vectors (TF-IDF, embeddings)
    └─→ Generate document IDs
    ↓
Message Queue (Kafka)
    ↓
Indexing Workers
    ├─→ Update search index (Elasticsearch)
    ├─→ Store document data (Cassandra, S3)
    └─→ Update analytics
```

---

## Data Models

### Document Store (Cassandra)

```sql
CREATE TABLE documents (
    doc_id UUID PRIMARY KEY,
    title TEXT,
    content TEXT,
    author VARCHAR(100),
    url TEXT,
    domain VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    content_type VARCHAR(20),  # webpage, pdf, video, image
    language VARCHAR(10),
    tags SET<TEXT>,
    metadata MAP<TEXT, TEXT>,
    INDEX idx_domain (domain),
    INDEX idx_created (created_at)
);
```

### Inverted Index (Elasticsearch)

```json
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword",
            "ignore_above": 256
          },
          "ngram": {
            "type": "text",
            "analyzer": "ngram_analyzer"
          }
        }
      },
      "content": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      },
      "author": {
        "type": "keyword"
      },
      "url": {
        "type": "keyword",
        "ignore_above": 2048
      },
      "domain": {
        "type": "keyword"
      },
      "tags": {
        "type": "keyword"
      },
      "created_at": {
        "type": "date"
      },
      "language": {
        "type": "keyword"
      },
      "popularity_score": {
        "type": "float"
      },
      "page_rank": {
        "type": "float"
      }
    }
  }
}
```

---

## Search Indexing

### Inverted Index Structure

```
Term          → Documents
─────────────────────────────
"hello"        → [doc1, doc5, doc10, ...]
"world"        → [doc2, doc5, doc15, ...]
"search"        → [doc3, doc7, doc20, ...]
...

Posting List:
"hello" → [
  {doc_id: doc1, positions: [10, 45], tf: 2},
  {doc_id: doc5, positions: [100, 250], tf: 1},
  ...
]

Document Vector:
doc1 → {hello: 0.5, world: 0.3, search: 0.0}
doc5 → {hello: 0.2, world: 0.1, search: 0.8}
```

### TF-IDF Calculation

```
TF (Term Frequency):
tf(term, doc) = (count of term in doc) / (total words in doc)

IDF (Inverse Document Frequency):
idf(term) = log(total_docs / docs_containing_term)

TF-IDF:
tf_idf(term, doc) = tf(term, doc) * idf(term)
```

### Vector Space Model

```python
import math
from collections import defaultdict

class VectorSpaceModel:
    def __init__(self):
        self.documents = {}  # doc_id -> document
        self.term_freq = defaultdict(lambda: defaultdict(int))
        self.document_freq = defaultdict(int)
        self.total_docs = 0

    def add_document(self, doc_id, text):
        terms = self.tokenize(text)
        self.documents[doc_id] = terms
        self.total_docs += 1

        # Calculate term frequency
        term_set = set(terms)
        for term in term_set:
            self.term_freq[doc_id][term] = terms.count(term)
            self.document_freq[term] += 1

    def calculate_tfidf(self, doc_id, term):
        tf = self.term_freq[doc_id][term] / len(self.documents[doc_id])
        idf = math.log(self.total_docs / (1 + self.document_freq[term]))
        return tf * idf

    def calculate_vector(self, doc_id):
        terms = set(self.documents[doc_id])
        vector = {}
        for term in terms:
            vector[term] = self.calculate_tfidf(doc_id, term)
        return vector

    def cosine_similarity(self, doc1_id, doc2_id):
        vector1 = self.calculate_vector(doc1_id)
        vector2 = self.calculate_vector(doc2_id)

        # Calculate dot product
        dot_product = sum(vector1[t] * vector2[t] for t in vector1)

        # Calculate magnitudes
        magnitude1 = math.sqrt(sum(v**2 for v in vector1.values()))
        magnitude2 = math.sqrt(sum(v**2 for v in vector2.values()))

        # Calculate cosine similarity
        if magnitude1 * magnitude2 == 0:
            return 0
        return dot_product / (magnitude1 * magnitude2)
```

---

## Relevance Ranking

### BM25 Algorithm

```python
import math

class BM25:
    def __init__(self, k1=1.5, b=0.75):
        self.k1 = k1
        self.b = b
        self.documents = {}  # doc_id -> document
        self.doc_lengths = {}  # doc_id -> length
        self.avg_doc_length = 0
        self.document_freq = {}  # term -> document frequency

    def add_document(self, doc_id, text):
        terms = self.tokenize(text)
        self.documents[doc_id] = terms
        self.doc_lengths[doc_id] = len(terms)

        # Update document frequency
        for term in set(terms):
            self.document_freq[term] = self.document_freq.get(term, 0) + 1

        # Update average document length
        self.avg_doc_length = sum(self.doc_lengths.values()) / len(self.doc_lengths)

    def calculate_score(self, doc_id, query_terms):
        score = 0
        doc_length = self.doc_lengths[doc_id]

        for term in query_terms:
            if term not in self.document_freq:
                continue

            # IDF
            idf = math.log((len(self.documents) - self.document_freq[term] + 0.5) / (self.document_freq[term] + 0.5))

            # TF
            term_freq = self.documents[doc_id].count(term)
            tf = (self.k1 + 1) * term_freq / (self.k1 * (1 - self.b + self.b * doc_length / self.avg_doc_length)) + term_freq)

            # BM25 score
            score += idf * tf / (self.k1 + tf)

        return score

    def search(self, query, top_n=10):
        query_terms = self.tokenize(query)

        # Calculate scores for all documents
        scores = []
        for doc_id in self.documents:
            score = self.calculate_score(doc_id, query_terms)
            if score > 0:
                scores.append((doc_id, score))

        # Sort by score (descending)
        scores.sort(key=lambda x: x[1], reverse=True)

        # Return top N
        return scores[:top_n]
```

### Learning to Rank

```python
# Learning to Rank combines multiple features
from sklearn.ensemble import GradientBoostingClassifier
import numpy as np

class LearningToRank:
    def __init__(self):
        self.model = GradientBoostingClassifier()

    def extract_features(self, query, doc, click_data):
        features = {
            'bm25_score': self.calculate_bm25(query, doc),
            'page_rank': doc.page_rank,
            'popularity': doc.popularity_score,
            'freshness': self.calculate_freshness(doc.created_at),
            'title_match': self.title_match(query, doc.title),
            'domain_authority': doc.domain_authority,
            'url_depth': self.calculate_url_depth(doc.url),
            'click_through_rate': click_data.get('ctr', 0),
            'dwell_time': click_data.get('dwell_time', 0),
        }
        return list(features.values())

    def train(self, training_data):
        # training_data: [(query, doc, clicked, features)]
        X = np.array([self.extract_features(q, d, c) for q, d, c, _ in training_data])
        y = np.array([c[2] for q, d, c, _ in training_data])  # clicked labels

        self.model.fit(X, y)

    def rank(self, query, docs):
        features = np.array([self.extract_features(query, doc, {}) for doc in docs])
        scores = self.model.predict_proba(features)[:, 1]  # Probability of being relevant

        # Sort by score
        ranked_docs = sorted(zip(docs, scores), key=lambda x: x[1], reverse=True)
        return [doc for doc, _ in ranked_docs]
```

---

## Autocomplete/Suggestions

### Prefix Trie

```python
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False
        self.suggestions = []

class AutocompleteTrie:
    def __init__(self, max_suggestions=10):
        self.root = TrieNode()
        self.max_suggestions = max_suggestions

    def insert(self, word, suggestion=None):
        node = self.root
        for char in word.lower():
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]

        node.is_end = True
        if suggestion and len(node.suggestions) < self.max_suggestions:
            node.suggestions.append(suggestion)

    def search(self, prefix, max_results=10):
        node = self.root

        # Traverse to prefix
        for char in prefix.lower():
            if char not in node.children:
                return []
            node = node.children[char]

        # Collect all words with prefix
        results = []
        self._collect_words(node, prefix, results, max_results)
        return results

    def _collect_words(self, node, prefix, results, max_results):
        if node.is_end:
            results.extend(node.suggestions[:1])

        if len(results) >= max_results:
            return

        for char, child in node.children.items():
            self._collect_words(child, prefix + char, results, max_results)
```

### Elasticsearch Autocomplete

```json
{
  "mappings": {
    "properties": {
      "title_suggest": {
        "type": "completion",
        "analyzer": "standard",
        "search_analyzer": "standard",
        "max_input_length": 20,
        "preserve_separators": true,
        "preserve_position_increments": true,
        "contexts": [
          {
            "name": "category",
            "type": "category",
            "path": "category"
          }
        ]
      }
    }
  }
}
```

### Suggestion API

```python
from elasticsearch import Elasticsearch

class SuggestionService:
    def __init__(self):
        self.es = Elasticsearch(['localhost:9200'])

    def get_suggestions(self, query, category=None, max_results=10):
        body = {
            "suggest": {
                "title_suggestion": {
                    "prefix": query,
                    "completion": {
                        "field": "title_suggest",
                        "size": max_results
                    }
                }
            }
        }

        if category:
            body["suggest"]["title_suggestion"]["completion"]["context"] = category

        response = self.es.search(index="documents", body=body)
        suggestions = response['suggest']['title_suggestion'][0]['options']

        return [
            {
                "text": suggestion['text'],
                "score": suggestion['score']
            }
            for suggestion in suggestions
        ]
```

---

## API Design

### Search API

```yaml
# Search endpoint
GET /api/v1/search
Query Parameters:
  - q: "search query" (required)
  - page: 1 (default)
  - size: 10 (default, max 100)
  - sort: "relevance" | "date" | "popularity"
  - filters: JSON object
  - highlight: true (default)

Response:
  {
    "total": 1234,
    "took": 45,
    "results": [
      {
        "doc_id": "doc123",
        "title": "Search System Design",
        "url": "https://example.com/search",
        "snippet": "...<em>Search</em>...",
        "score": 2.5,
        "highlights": ["<em>Search</em> System Design"],
        "author": "John Doe",
        "created_at": "2025-02-15T10:00:00Z"
      }
    ],
    "facets": {
      "category": {
        "tech": 456,
        "business": 123,
        "science": 234
      },
      "date_range": {
        "2024": 567,
        "2025": 667
      }
    },
    "pagination": {
      "page": 1,
      "size": 10,
      "total_pages": 124
    }
  }
```

### Autocomplete API

```yaml
GET /api/v1/suggest
Query Parameters:
  - q: "partial query" (required)
  - category: optional
  - max_results: 10 (default)

Response:
  {
    "suggestions": [
      {
        "text": "search system",
        "score": 0.95,
        "category": "tech"
      },
      {
        "text": "search engine",
        "score": 0.90,
        "category": "tech"
      }
    ]
  }
```

---

## Scalability

### Indexing Scalability

**Sharding Strategy:**

```
Document Shards:
- Shard by document ID hash
- 1000 shards per cluster

Time-based Shards:
- Shard by document creation time
- Daily or hourly shards
- Older shards in cheaper storage
```

**Replication:**

```
Primary Shard → 3 Replicas
- Reads can go to any replica
- Writes go to primary
- Replication factor: 3
```

### Query Scalability

**Query Routing:**

```
User Query
    ↓
Query Coordinator
    ├─→ Shard 1
    ├─→ Shard 2
    ├─→ Shard 3
    └─→ Shard N
    ↓
Aggregate Results
    ↓
Merge and Sort
    ↓
Return Top Results
```

**Caching:**

```
Popular Queries Cache (Redis):
├── "system design" → [result1, result2, ...]
├── "machine learning" → [result1, result2, ...]
└── ...

TTL: 1 hour
Cache hit rate: > 80%
```

---

## Monitoring

### Search Metrics

```
Query Metrics:
- Queries per second (QPS)
- Average query latency (P50, P95, P99)
- Query complexity (number of terms, filters)
- Zero-results rate

Indexing Metrics:
- Documents indexed per second
- Index size
- Index lag (documents pending)
- Reindexing rate

Performance Metrics:
- Shard distribution
- Replication lag
- CPU, memory, disk usage
- Cache hit rate

User Metrics:
- Click-through rate (CTR)
- Dwell time on result pages
- Query reformulation rate
- Most popular queries
```

---

## Follow-up Questions

1. **How to handle real-time indexing?**
   - Stream processing with Kafka
   - Incremental index updates
   - Near real-time visibility

2. **How to handle large documents?**
   - Extract text only
   - Store media separately
   - Preview snippets

3. **How to handle multi-language search?**
   - Language detection
   - Language-specific analyzers
   - Language-based ranking

4. **How to handle personalized search?**
   - User search history
   - Click behavior
   - Boost personalized results

5. **How to handle search analytics?**
   - Log all queries
   - Track clicks and dwell time
   - A/B test different ranking models

6. **How to handle synonyms?**
   - Synonym dictionary
   - Expand query terms
   - Weight synonyms appropriately

---

## Links

- [System Design Interview Overview](overview.md)
- [Caching and Message Queues](caching-message-queues.md)
- [Distributed Systems Fundamentals](distributed-systems.md)
