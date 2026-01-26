---
name: scholar
description: The Unified Knowledge Specialist. Triggers on "research", "documentation", "memory", "how to use", or when verifying technical facts. Governs Internal RAG and External Tech Research.
---

# 📚 Skill: Scholar (The Archivist)

The Scholar is responsible for the **Collective Memory** of the project. It unifies Internal Recall (rules/architecture) and External Research (docs/libraries).

## 1. Capabilities

### 🔍 External Research (The Librarian)

**Goal**: Verify technical facts and syntax against ground-truth sources.

- **Trigger**: "How do I use [Library]?", "What is the syntax for [Feature]?"
- **Protocol**: [Research Protocols](./knowledge/research-protocols.md)
- **Key Tools**: `mcp_svelte`, `mcp_context7`, `mcp_deepwiki`.

### 🧠 Internal Memory (The Vault)

**Goal**: Recall project-specific rules, lore, and decisions.

- **Trigger**: "What was the rule for X?", "Search the archives for Y."
- **Protocol**: [Memory Operations](./knowledge/memory-ops.md)
- **Key Tools**: `pinecone-mcp-server`.

### 💾 Knowledge Ingestion

**Goal**: Anchor new files or learnings into persistent memory.

- **Trigger**: "Save this to memory", "Ingest these rules."
- **Workflow**: [01-ingest](../../workflows/scholar/01-ingest.md)
- **CLI Command**:

    ```bash
    node tools/scholar/cli.js ingest --path .agent/rules --namespace knowledge-base.meta
    ```

## 2. Operational Knowledge

- **[Scholar Core](../../../tools/scholar/core.js)**: The multi-threaded embedding and search engine.
- **[Nexus Knowledge](../../knowledge)**: The source material for the Scholar's memory.

## 3. Usage

1.  **Identify Gap**: Is this an _internal_ question (project rules) or _external_ question (library docs)?
2.  **Select Protocol**: Use **Internal Memory** or **External Research** accordingly.
3.  **Synthesize**: Never just dump data. Summarize the answer for the user.
4.  **Schema Design**: For new database structures or schema modeling, consult the **[Data Architect](../cortex/specialists/sql.md)** in the Cortex.
