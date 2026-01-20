---
name: scholar
description: Triggers on all files in src/scholar/ or where otherwise relevant. Governs long-term memory management, Pinecone MCP integration, and semantic search.
---

# Scholar: Vector Memory Skill

## When to use this skill

- Performing semantic searches via Pinecone.
- Ingesting lore Atoms from Supabase to Vector memory.
- Implementing RAG (Retrieval Augmented Generation) pipelines.

## Workflow

1.  **Ingestion**: Read source text -> Chunk by entity -> Embed -> Upsert to Pinecone.
2.  **Search**: Generate a semantic query -> Apply metadata filters -> Execute via MCP.
3.  **Synthesis**: Integrate retrieved results into the LLM context window.

## Instructions

- **Tool Usage**: Use `search-records` and `upsert-records` MCP tools; NEVER raw HTTP calls.
- **Metadata**: Only store `type`, `campaign_id`, `tags`, and `priority` in Pinecone. Do not duplicate full text.
- **Consistency**: Use the same `uid` for both Supabase and Pinecone records.

## Resources

- **Pinecone MCP Docs**: [Internal Reference]
- **Data Schema**: Supabase = "Body" (Full text); Pinecone = "Soul" (Vectors + Meta).