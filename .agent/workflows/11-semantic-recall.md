---
description: Actively query the vector database to eliminate AI amnesia and reduce token bloat.
---

# 11-semantic-recall (The Archivist)

> **Goal:** Actively query the vector database to eliminate AI amnesia and reduce token bloat before planning, and archive new knowledge after execution.

## 1. Triggers

- **Planning Phase**: You are formulating a blueprint in `01-plan.md`.
- **Complex Modification**: You are about to modify a core engine system (e.g., `ContextBroker.js` or `NarrativeDirector.js`).
- **Slash Command**: `/11-semantic-recall`

## 2. Brain (Context Injection)

- **The Baton**: `STATE.md` (To ground your queries in the present reality).
- **Vector Database**: Local Pinecone memory accessed via MCP.

## 3. Procedures

### Phase 1: Identify Knowledge Gaps

1. **Pause & Reflect**: Before planning a new mechanic or touching core logic, explicitly identify what you _don't_ know about the codebase's history or previous implementations.

### Phase 2: Query the MCP

1. **Search**: Use the local memory tool to query the Pinecone vector database for highly specific historical context.
    - _Example Action:_ Query for "previous implementations of kinetic state in Svelte."
    - _Example Action:_ Query for "rules regarding NarrativeDirector event routing."

### Phase 3: Inject Context

1. **Synthesize**: Read the retrieved paragraphs and inject them directly into your active working memory.
2. **Execute**: Proceed with your planning or coding task using this newly retrieved context. Do not wait for permission.

### Phase 4: The Final Polish (Archiving)

_This phase triggers at the end of a session, right before clocking out._

1. **Upsert**: If you have just completed a task and are executing `06-continue.md` (The Handoff), you **MUST** use the memory tool to upsert a summary of your new code into the vector database.
2. **Future-Proofing**: Ensure the summary explains _what_ you built and _how_ it integrates with the engine, so future agents can easily recall it.

## 4. Anti-Patterns

- **Blind Execution**: Guessing how a complex system works without checking the vector database first.
- **Token Bloat**: Asking the Director to upload massive architecture files instead of actively searching the MCP for the specific paragraphs you need.
- **Selfish Coding**: Finishing a session without upserting a summary of your work into Pinecone, dooming future agents to amnesia.

## 5. Tools

- `mcp_query_memory` (To search the Pinecone vector DB)
- `mcp_upsert_memory` (To save new context to the vector DB)
