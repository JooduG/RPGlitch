---
description: Data Migration Protocol. Governs the ingestion of lore "Atoms" from Supabase SQL to Pinecone Vector memory for RAG.
---

# 🚀 Data Migration & Ingestion Workflow

> **Goal:** Synchronize source-of-truth lore from Supabase to high-performance semantic search in Pinecone.

## 1. Source Analysis (Supabase)

1. **Query**: Use `execute_sql` to fetch new or updated lore Atoms.
    - **Optimization**: Use **Keyset Pagination** (seek method) to iterate through records. Avoid expensive `OFFSET` queries.
2. **Schema Validation**: Ensure each record has a `uid`, `unique_key`, `content`, and standardized `metadata`.

## 2. Transformation (Embedding)

1. **Chunking**: Split text into semantically cohesive chunks (approx. 500-1000 tokens) with 10-20% overlap.
2. **Vector Generation**:
    - **Dense**: Generate embeddings using the designated model (e.g., `text-embedding-3-small` or `multilingual-e5-large`).
    - **Sparse** (Optional): If using hybrid search, generate sparse vectors (e.g., BM25) for keyword matching.

## 3. Ingestion (Pinecone)

1. **Upsert**: Use the `upsert-records` tool.
    - **Batching**: CRITICAL. Batch records in groups of 100-300 to prevent timeouts and rate limiting.
2. **Metadata Mapping**:
    - `id`: Must match the Supabase `unique_key`.
    - `metadata`: Include `type`, `campaign_id`, `tags`, and `created_at` for filtering.
3. **Verification**: Execute a sample `search-records` (optionally with `rerank`) to confirm retrieval quality.

## 4. Maintenance

1. **Pruning (Anti-Entropy)**:
    - Periodically query Supabase for all active IDs.
    - Compare with Pinecone vector IDs.
    - Delete orphaned vectors (Present in Pinecone, absent in Supabase).
2. **Re-indexing**: Trigger a full sync if the embedding model version changes.
