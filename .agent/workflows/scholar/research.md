---
description: Unified Ingestion Loop. Absorbing new knowledge into the library.
---

# 📖 Study Protocol

> **Goal:** Standardize the transformation of static text into the **Vector Library** (Our semantic memory in Pinecone) with zero manual friction.

## 1. Namespace Identification

Before ingesting, identify the target **Namespace**. Deciding the namespace is straightforward: it depends on the _source_ of the information.

Before ingesting, you must identify the correct **Namespace**. This is critical because it tells the AI how to prioritize information during a search (e.g., Rules are always more important than raw Code).

- **`knowledge-base.meta`**: The Constitution. Rules, Pillars, and Core Philosophy. (Highest priority).
- **`knowledge-base.external`**: The Library. Documentation for external frameworks (Svelte, Dexie, etc.).
- **`knowledge-base.logic`**: The Blueprints. Source code patterns and architectural logic.

## 2. Preparation (The Scholar's Desk)

Before ingesting new knowledge, ensure the existing library is organized.

- **Command**: `node .agent/skills/scholar/scripts/organize-library.js --scope scholar`

## 3. Execution (CLI)

// turbo

1. **Path-Specific Ingestion**:

    ```bash
    node .agent/skills/scholar/scripts/cli.js ingest --path [dir/file] --namespace [ns]
    ```

2. **System Refresh** (Syncs core `.agent` config):

    ```bash
    node .agent/skills/scholar/scripts/cli.js ingest
    ```

## 3. Verification

Always verify retrieval quality after ingestion.

1. **Search Test**:

    ```bash
    node .agent/skills/scholar/scripts/cli.js search "keyword from ingested docs"
    ```

2. **Clarity Audit**: If search results are fragmented, re-structure the source markdown with more descriptive headers.

---

> [!IMPORTANT]
> Ensure `.gitignore` is properly configured. Never ingest `node_modules` or `.env` files.
