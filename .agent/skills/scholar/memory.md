# Scholar Skill: Long-Term Memory (Memory-Ops)

> **Context:** RAG, Vector Embeddings, and Pinecone interactions.

## 1. Concept: The Soul

Data in this project behaves like a standard RPG:

- **Body**: The raw text content (stored in Supabase/Postgres).
- **Soul**: The vector embedding + metadata (stored in Pinecone).

## 2. Ingestion Protocol

When anchoring new files, rules, or lore into persistent memory:

1.  **Read Source**: Get the raw text.
2.  **Chunk**: Split by entity or logical section (do not just chunk by arbitrary characters).
3.  **Embed**: Generate vectors.
4.  **Upsert**: Save to Pinecone with the following metadata schema:
    - `type`: (e.g., 'rule', 'lore', 'doc')
    - `campaign_id`: (if applicable)
    - `tags`: (array of strings)
    - `priority`: (number)
    - **Constraint**: Do NOT store the full body text in Pinecone metadata.

## 3. Retrieval Protocol

When recalling information:

1.  **Generate Query**: Create a semantic search string.
2.  **Filter**: Apply metadata filters (e.g., `type: 'rule'`) to narrow the scope.
3.  **Execute**: Use `pinecone-mcp-server` tools.
4.  **Synthesize**: Integrate results into the Context Window.

## 4. Tools

- **Pinecone**: `pinecone-mcp-server`
    - `search-records`: Retrieve relevant Atoms.
    - `upsert-records`: Anchor new Atoms.
- **Supabase**: `supabase-mcp-server`
    - `execute_sql`: Raw queries (Use with caution).
    - `search_docs`: Query project documentation.
