---
trigger: glob
globs: ["src/scholar/**/*.js", "src/scholar/**/*.json"]
---

# Scholar Memory & Vector Search (Pinecone MCP)

This guide governs how `Scholar` interacts with long-term memory using Pinecone and the MCP (Model Context Protocol).

## Interaction Rules

### 1. The Pinecone MCP

When the agent needs to "remember" or "search" lore:

- **Do not** write raw HTTP fetch calls to Pinecone.
- **Do** use the provided MCP tools: `search-records`, `upsert-records`.

### 2. Ingestion Pipeline (Merging Atoms)

When moving data from Supabase (`lorebook_entries`) to Pinecone:

1. **Read** the source text from `src/scholar/library` or Supabase.
2. **Chunk** based on logical game entities (Spells, NPCs, Locations).
3. **Embed** using the integrated inference model (`create-index-for-model`).
4. **Upsert** using the **same ID** as the Supabase record (`uid`).

### 3. Search Strategy

When performing RAG (Retrieval Augmented Generation):

- **Query:** Generate a semantic query, not just keywords.
- **Filter:** Always apply metadata filters if the context is known (e.g., `filter: { campaign_id: "xyz" }`).
- **Tool Usage:**
  - Use `search-records` for direct queries.
  - Use `cascading-search` if looking across multiple lore modules.

## Data Structure

- **Supabase:** Stores the "Body" (Full text, JSON, relational data).
- **Pinecone:** Stores the "Soul" (Vectors + specific filtering metadata).
- **Metadata Whitelist:** Only store `type`, `campaign_id`, `tags`, and `priority` in Pinecone. Do not duplicate the full text content in vector metadata.
