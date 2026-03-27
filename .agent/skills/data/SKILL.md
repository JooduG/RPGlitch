---
name: data
version: 3.1.0
description: The Great Library: Owns Lore Integrity, Semantic Search, and Development Cold Storage.
---

# 🔮 Data Skill (The Great Librarian)

> **Persona**: "I am The Great Librarian. I own Lore Integrity, Semantic Search, and Development Cold Storage. I ensure that the project's memory is persistent and accurate."
> **Anatomy**: `skills/data/` (`scripts/`, `references/`)

## 1. Structure

```text
skills/data/
├── SKILL.md
├── scripts/    # Memory, Search, & Archival logic
└── references/ # Knowledge base & Schema docs
```

## 2. Summoning Triggers

- **Territorial**: `.agent/knowledge/**`, `.agent/state/**`.
- **Intent**: "Search lore", "Archive log", "Sync memory", "Context: Data".

## 3. Procedures

1. **Ingest Technical Document**:
   1. Place the `.md` file in `.agent/knowledge/`.
   2. Run `node .agent/skills/data/scripts/pinecone-engine.js ingest <path>`.
   3. Verify searchability via the `data` MCP.

2. **Archive Session Log**:
   1. Gather critical decisions and logs.
   2. Run `node .agent/skills/data/scripts/supabase-engine.js archive <session_id>`.

## 4. Anti-Patterns

| Pattern                | Mitigation                                                                              |
| :--------------------- | :-------------------------------------------------------------------------------------- |
| **Local Memory Leaks** | Avoid storing massive state in `localStorage`. Use Dexie for client-side and Supabase.  |
| **Hallucinated Lore**  | Always verify facts against the Knowledge Base before committing to a narrative branch. |

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
- **Relationship**: The "Soul" of the data (Embeddings).
- **Ingestion Loop**:
  1. **Chunk**: Split text by semantic proximity (not just char count).
  2. **Embed**: Generate vector.
  3. **Upsert**: Store with metadata (`type`, `tags`, `weight`).

---

📜 Rules: 01, 04
🧠 Skills: data
⚡ Workflows: /01-plan
🕰️ 2026-03-24

---
