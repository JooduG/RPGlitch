---
description: Unified Ingestion Loop. Absorbing new knowledge into the library.
constraints:
    - "MUST execute Rule 07: Clarity Gate before any file generation."
    - "MUST adopt the Scholar Persona."
---

# 📖 Study Protocol

> **Goal:** Standardize the transformation of static text into the **Vector Library** (Our semantic memory in Pinecone) with zero manual friction.

## 1. Namespace Identification

Before ingesting, identify the target **Namespace**. Deciding the namespace is straightforward: it depends on the _source_ of the information.

- **`knowledge-base.meta`**: The Constitution. Rules, Pillars, and Core Philosophy. (Highest priority).
- **`knowledge-base.external`**: The Library. Documentation for external frameworks (Svelte, Dexie, etc.).
- **`knowledge-base.logic`**: The Blueprints. Source code patterns and architectural logic.

## 2. Preparation (The Scholar's Desk)

Before ingesting new knowledge, ensure the existing library is organized.

- **Command**: `node .agent/skills/scholar/scripts/organize_library.js --scope scholar`

## 3. Execution (CLI)

// turbo

1.  **Path-Specific Ingestion**:

    ```bash
    # Standard Ingestion
    node .agent/skills/scholar/scripts/scholar.js write --path [dir/file] --namespace [ns]
    ```

2.  **System Refresh** (Syncs core `.agent` config):

    ```bash
    # (Optional) Verify core integrity
    node .agent/skills/gamemaster/scripts/gamemaster.js sync all
    ```

3.  **Maintenance Check**:
    > "Do you want to run a cleanup to remove stale vectors?"
    > _Note: Prune-on-Write handles this automatically now._

## 4. Verification

Always verify retrieval quality after ingestion.

1.  **Search Test (Vector Memory)**:

    ```bash
    # Test recall quality
    node .agent/skills/scholar/scripts/scholar.js read "keyword from ingested docs"
    ```

2.  **Robot Mode**: Append `--json` to `read` or `write` for machine-readable status.

3.  **Clarity Audit**: If search results are fragmented, re-structure the source markdown with more descriptive headers.

---

> [!IMPORTANT]
> Ensure `.gitignore` is properly configured. Never ingest `node_modules` or `.env` files.
