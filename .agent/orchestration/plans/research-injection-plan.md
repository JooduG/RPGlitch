# Plan: Documentation Research & Ingestion Pipeline (Expanded)

## Objective

Establish a high-fidelity "Living Memory" in Pinecone by integrating internal repository intelligence, official Svelte 5 technical specifications, and community-proven patterns. This resolves the "Knowledge Deficit" identified in `GEMINI.md`.

## Key Files & Context

- **Target Index**: `knowledge-library` (Pinecone)
- **Target Namespace**: `knowledge-base.external` (Official/Community) and `knowledge-base.meta` (Internal Architecture)
- **Primary Source**: `svelte` MCP (Official Docs)
- **Intelligence Source**: `deepwiki` (Internal Architecture Mapping)
- **Research Source**: `context7` (Library Patterns & Best Practices)

## Implementation Steps

### Phase 1: Internal Intelligence & Gap Analysis

1.  **Architecture Mapping (via `deepwiki`)**:
    - Query `deepwiki` to generate a comprehensive overview of the current RPGlitch architecture.
    - Identify key modules (Core Engine, UI components, Data layer) and their current implementation patterns.
    - Locate areas where the current code diverges from Svelte 5 best practices.
2.  **Gap Identification**:
    - Compare `deepwiki` findings with `svelte` list-sections to prioritize documentation ingestion.

### Phase 2: External Research & Community Patterns

1.  **Library Deep-Dive (via `context7`)**:
    - Query `context7` for the latest documentation on used libraries: `Bits UI`, `Melt UI`, `Dexie.js`, `Zod`, `Valibot`.
    - Fetch specific "Svelte 5 Rune Migration" patterns for these libraries.
2.  **Aesthetic & Logic Research**:
    - Query `context7` for community-vetted patterns for "Kinetic Interactions" and "Audio/SFX Management" in Svelte 5.

### Phase 3: Staged Ingestion Pipeline

1.  **Official Technical Specs**:
    - Fetch and stage all high-priority Svelte 5 documentation sections.
2.  **Pattern & Library Ingestion**:
    - Stage the library documentation and community patterns fetched from `context7`.
3.  **Internal Blueprint Ingestion**:
    - Stage the architecture insights from `deepwiki` into a `project-blueprint.md` file.
4.  **Pinecone Sync**:
    - Call `mcp_data_write_knowledge_base` to ingest all staged files into their respective namespaces.

### Phase 4: Validation & Living Memory Test

1.  **Semantic Synthesis Test**:
    - Query Pinecone: "Propose a refactor for our current `src/data/db.js` using Svelte 5 runes and community patterns for Dexie from context7."
    - Verify the response is grounded in all three sources.

## Verification & Testing

- **Namespace Coverage**: Verify `knowledge-base.external` and `knowledge-base.meta` are populated.
- **Query Grounding**: Ensure AI responses include citations to both official docs and specific project files.
