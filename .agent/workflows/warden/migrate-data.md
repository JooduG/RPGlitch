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

## 3. Ingestion (Scholar CLI)

1. **Upsert**: Use the high-performance unified ingestion engine.
    - **Command**:

        ```bash
        node tools/scholar/cli.js ingest --path .agent/rules --namespace knowledge-base.meta
        ```

    - **Batching**: Handled automatically by the Scholar Core in groups of 50.

2. **Verification**: Confirm retrieval quality.
    - **Command**:

        ```bash
        node tools/scholar/cli.js search "Verify recently ingested content"
        ```

## 4. Maintenance

1. **Pruning (Anti-Entropy)**:
    - Periodically query Supabase for all active IDs.
    - Compare with Pinecone vector IDs.
    - Delete orphaned vectors (Present in Pinecone, absent in Supabase).
2. **Re-indexing**: Trigger a full sync if the embedding model version changes.
