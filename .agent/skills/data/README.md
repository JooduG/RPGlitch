# 📚 Skill: Data (The Great Library)

> **Sovereignty**: `data`
> **Role**: The Librarian
> **Objective**: Manage the project's "Living Memory" (RAG) and "Permanent Record" (Cold Storage).

## 🧠 Memory Architecture

The Data skill operates a dual-layer memory system to ensure the Agent is both technically sharp and historically aware.

### 1. 🔥 Working Memory (Pinecone)
*   **Purpose**: Active context grounding.
*   **Content**: Current Rules, Skills, Workflows, and Core Logic patterns.
*   **Logic**: Semantic search (RAG) ensures the agent uses project-specific standards instead of generic training.
*   **Namespaces**: 
    *   `knowledge-base.meta`: The Constitution (Rules/Skills).
    *   `knowledge-base.src`: High-fidelity code patterns.

### 2. ❄️ Cold Storage (Supabase)
*   **Purpose**: Historical decision tracking.
*   **Content**: Archived task plans, research logs, and architectural post-mortems.
*   **Logic**: Immutable logs accessible via the `query_cold_storage` tool.
*   **Usage**: Conflict resolution and understanding the "Why" behind past shifts.

---

## 🛠️ Common Operations

### For Humans (How to ask the Agent)
*   **Recall History**: *"Look up the decision trail for the [topic] refactor."*
*   **Verify Rules**: *"Check the working memory for our latest Svelte 5 state patterns."*
*   **Archive State**: *"Move this mission's logs to cold storage."*

### For Agents (Standard Tools)
*   `read_knowledge_base`: Concept-based retrieval from Pinecone.
*   `write_knowledge_base`: Ingesting new files into Pinecone.
*   `archive_log_entry`: Shipping a new record to Supabase.
*   `query_cold_storage`: Pulling historical logs from Supabase.

---

## 🛡️ Governance
1.  **Observability**: All memory updates must be logged in `.agent/orchestration/operation-logs.md`.
2.  **Pruning**: Working memory should be audited monthly to flush redundant "Ghost Vectors".
3.  **Integrity**: Never log credentials or secrets to either layer.
