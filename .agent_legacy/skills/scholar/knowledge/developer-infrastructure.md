# 🛠️ Developer Infrastructure (The Context Engine)

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
- **Role**: The "Soul" of the data (Embeddings).
- **Ingestion Loop**:
    1.  **Chunk**: Split text by semantic entity (not just char count).
    2.  **Embed**: Generate vector.
    3.  **Upsert**: Store with metadata (`type`, `tags`, `weight`).
