---
name: memory
description: >
    The Core Memory Interface. Governance of Long-Term Semantic Memory (Pinecone) 
    and architectural pattern persistence.
    Triggers:
    - "Recall [Topic]"
    - "What is our pattern for [X]?"
    - "Save this decision"
    - "Ingest [File]"
    - "Consult the archives"
---

# 🧠 Knowledge

## 1. Governance Rules

### 🧠 Semantic Only

- **Tool:** `knowledge` -> `read_knowledge_base`
- **Rule:** Do NOT use this to read code files for editing. Use `research` (File Fetcher) for that. Use this only to recall _concepts_, _past decisions_, or _architectural patterns_.

### 🚫 Zero Hallucination

- **Rule:** If the database returns no matches, state "No long-term memory found for this topic" and fallback to `research`. Do not invent memories.

## 2. Capabilities

### 🔮 Semantic Recall (RAG)

- **Action:** Query this _before_ making architectural decisions to see if a precedent exists.
- **Example:** "How do we handle global state?" (Checks memory for "Svelte Store Patterns").

### 💾 Knowledge Ingestion

- **Tool:** `knowledge` -> `write_knowledge_base`
- **Trigger:** When a major architectural decision is made or a new pattern is established.
- **Action:** Save the relevant files or summary to `knowledge-base.meta` or `knowledge-base.src`.
