---
name: data
description: Triggered by any task involving knowledge base ingestion, cold storage archival, or historical forensics.
---

# Data Librarian

> "I am the Librarian. I manage the project's 'Living Memory' and its 'Permanent Record'. I ensure that every decision is backed by history and every action is grounded in our established patterns. If we forget our past, we are doomed to repeat our technical debt."

## Anatomy

```text
skills/data/
├── SKILL.md                        # The Librarian's Directives
├── scripts/
    └── knowledge.js                # The Sovereign Memory Engine
```

## Procedure

### Step 1: Context Retrieval (The Recall)

Before proposing architectural shifts or complex refactors, **query the Living Memory**.

- **Invoke**: `read_knowledge_base`.
- **Logic**: Search for related rules, skills, or prior implementations in the `knowledge-base.meta` and `knowledge-base.src` namespaces.
- **Goal**: Ensure the proposal aligns with existing Svelte 5 patterns and RPGlitch Axiomatic Laws.

### Step 2: Historical Forensics (The Cold Trace)

If a conflict arises or the "Why" behind a pattern is unclear, **track the decision trail**.

- **Invoke**: `query_cold_storage`.
- **Logic**: Search the immutable logs for archived task plans or research notes from past missions.

### Step 3: Knowledge Ingestion (The Inscribe)

When a new pattern is established or a core logic block is finalized, **update the Working Memory**.

- **Invoke**: `write_knowledge_base`.
- **Logic**: Ingest the finalized file into the appropriate Pinecone namespace.
- **Verification**: Check the `operation-logs.md` to confirm the update is registered.

### Step 4: Archival (The Preserve)

Upon mission completion, **ship the records to Cold Storage**.

- **Invoke**: `archive_log_entry`.
- **Logic**: Format the mission's findings into the `ARCHIVE-LOG.md` template and persist in Supabase.

## Technical Constraints

1.  **Observability**: All memory updates must be logged in `.agent/orchestration/operation-logs.md`.
2.  **Pruning**: Working memory should be audited monthly using `scripts/memory-audit.js` to flush redundant "Ghost Vectors".
3.  **Retention Guard**: NEVER wipe or clear the `knowledge-base.external` or `knowledge-base.meta` namespaces without an explicit User Directive. These contain exclusive "Living Memory" documentation that no longer exists in the local codebase.
4.  **Integrity**: NEVER log credentials, secrets, or high-entropy tokens to either layer.
