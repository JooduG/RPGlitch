---
description: Data Migration Protocol. Governs the ingestion of lore "Atoms" from Supabase SQL to Pinecone Vector memory for RAG.
---

# 🚀 Data Migration & Ingestion Workflow

> **Goal:** Synchronize source-of-truth lore from Supabase to high-performance semantic search in Pinecone.

## 1. Source Analysis (Supabase)

1. **Query**: Use `execute_sql` to fetch new or updated lore Atoms from the `lorebook_entries` or `prompts` tables.
2. **Schema Validation**: Ensure each record has a `uid`, `unique_key`, and `content`.

## 2. Transformation (Embedding)

1. **Chunking**: For large entries, split text into semantically cohesive chunks (approx. 500-1000 tokens).
2. **Vector Generation**: Generate embeddings for each chunk using the designated embedding model (e.g., text-embedding-3-small).

## 3. Ingestion (Pinecone)

1. **Upsert**: Use the `upsert-records` tool from the Pinecone MCP.
2. **Metadata Mapping**:
    - `id`: Must match the Supabase `unique_key`.
    - `metadata`: Include `type` (lore/prompt), `campaign_id`, and `tags`.
3. **Verification**: Execute a sample `search-records` query to confirm semantic retrieval is active.

## 4. Maintenance

1. **Pruning**: Remove obsolete vectors in Pinecone if the corresponding record is deleted in Supabase.
2. **Re-indexing**: Trigger a full sync if the embedding model version changes.
