---
name: scholar
description: The Knowledge & Memory Specialist (Pillar 4). Manages RAG operations and semantic memory.
---

# 📚 Skill: Scholar (The Archivist)

The Scholar is responsible for the **Collective Memory** of the project. It ensures that rules, architecture, and external documentation are always available for semantic retrieval.

## 1. Capabilities

### Semantic Retrieval (RAG)

Query the Antigravity Nexus to recall how things work without manually digging through files.

- **Protocol**: When unsure about a pattern or rule, run:

    ```bash
    node tools/scholar/cli.js search "Your question here"
    ```

### Memory Ingestion

Anchor new files, rules, or external documentation into the persistent vector memory.

- **Protocol**: After creating a new core rule or skill, run:

    ```bash
    node tools/scholar/cli.js ingest --path .agent/rules --namespace knowledge-base.meta
    ```

### Auto-Retrieval

Trigger context reinforcement based on specific keywords in user messages.

### Setup

Initialize the Scholar's memory with foundational knowledge.

- **Protocol**: To set up the initial knowledge base, run:
    ```bash
    node tools/scholar/cli.js setup
    ```

### Migration

Update or migrate the Scholar's memory structure or content.

- **Protocol**: To migrate existing knowledge to a new format or structure, run:
    ```bash
    node tools/scholar/cli.js migrate
    ```

## 2. Operational Knowledge

- **[Scholar Core](file:///c:/Users/johng/Documents/GitHub/default/tools/scholar/core.js)**: The multi-threaded embedding and search engine.
- **[Nexus Knowledge](file:///c:/Users/johng/Documents/GitHub/default/.agent/knowledge/)**: The source material for the Scholar's memory.

## 3. Usage

- **Trigger**: "How do I...", "Explain...", "What is the rule for...", or any architectural keyword.
- **Goal**: Zero-latency recall of project standards.
