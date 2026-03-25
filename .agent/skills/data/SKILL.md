---
name: data
version: 3.1.0
description: The Great Library: Owns Lore Integrity, Semantic Search, and Development Cold Storage.
---

# 🔮 Data Skill

## 1. Memory

The **Data** skill is the sovereign keeper of the project's semantic memory and cold storage.

## 📜 Core Mandate

The Great Library is the sovereign keeper of lore, technical standards, and persistent development history.

### 1. Semantic Memory (Pinecone)

- **Read**: Semantic search across system rules and project architecture.
- **Write**: Ingest technical documents and session progress.

### 2. Cold Storage (Supabase)

- **Archive**: Persistent storage for session logs and critical development decisions.
- **Query**: Retrieve historical context for long-running tracks.

## 🛠️ Operational Tools

File: `.agent/skills/data/scripts/index.js`

```javascript
// MCP Server entry
```

File: `.agent/skills/data/scripts/pinecone-engine.js`

```javascript
// Vector I/O
```

File: `.agent/skills/data/scripts/supabase-engine.js`

```javascript
// Relational archiving
```

## 🛠️ Developer Infrastructure (The Context Engine)

> **Scope**: EXCLUSIVELY for the Development Environment (VS Code / Agent).
> **Note**: These tools (Supabase, Pinecone) are **NOT** present in the runtime application.

## 1. 🟢 Local Memory (The Repository)

> **Scope**: The entire Git Repository is the Agent's brain.

- **The Source (Source Code)**: `src/` - The living reality of the application.
- **The Protocol (Operating System)**: `.agent/` (`config`, `rules`, `workflows`) - How the agent thinks.
- **The Library (Distilled Knowledge)**: `.agent/knowledge/` - Structured research, patterns, and archives.

## 2. 🔵 Cold Storage (Supabase) — _Deferred_

- **Role**: Large-scale archival of development logs and decisions.
- **Status**: Scaffolded but not yet active. No data currently flows here.

## 3. 🟣 Semantic Search (Pinecone) — _Active_

- **Role**: Retrieval Augmented Generation (RAG) for the Agent.
- **Function**: Allows the agent to query past technical decisions and architecture patterns.

- **Tech**: Pinecone.
- \*\*Ro**: Th\_**Soul" of the data (Embeddings).
- **Ingestion Loop**:
  1 **Chunk**: Split text by semantic ity (not just char count). 2. **Embed**: Generate vector. 3. **Upsert**: Store with metadata (`type`, `tags`, `weight`).

## 7. Anti-Patterns

| Pattern                | Mitigation                                                                              |
| :--------------------- | :-------------------------------------------------------------------------------------- |
| **Local Memory Leaks** | Avoid storing massive state in `localStorage`. Use Dexie for client-side and Supabase.  |
| **Hallucinated Lore**  | Always verify facts against the Knowledge Base before committing to a narrative branch. |

---

📜 Rules: [01, 04]
🧠 Skills: [data]
⚡ Workflows: [/01-blueprint]
🕰️ 2026-03-24

---
