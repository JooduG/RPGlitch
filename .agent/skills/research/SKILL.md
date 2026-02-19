---
name: research
version: 1.0.0
description: >
    The Deep Search Interface. Orchestrates active investigation via Local Files, 
    Specialized MCPs, and Web Search.
    Triggers:
    - "Research [Topic]"
    - "Find documentation"
    - "Search the web"
    - "Locate file"
    - "Check source code"
    - "Context: [Research]"
---

# 🔎 Research

## 1. Governance Rules

### 📉 Tiered Sourcing

When gathering info, follow this strict order to ensure quality:

1.  **Tier 1 (Local):** Is it in the `src/` files? -> Use `File Fetcher`.
2.  **Tier 2 (Specialized):** Is it a known domain? -> Use `svelte`, `context7`, `deepwiki`, or `firecrawl`.
3.  **Tier 3 (Scientific):** Is it a complex bug? -> Use `waldzell-scientific-method`.
4.  **Tier 4 (Collaborative):** Need expert perspectives? -> Use `waldzell-collaborative-reasoning`.
5.  **Tier 5 (General):** Is it unknown? -> Use `Google Search`.

### 🧩 Context Assembly

- **Synthesize, Don't Dump:** Do not paste raw JSON or HTML. Read the source, extract the answer, and explain it.
- **Cite Sources:** "According to Svelte docs..." or "Found in `src/main.js`..."

## 2. Capabilities

### 📂 Internal Discovery (Files)

- **Tool:** `File Fetcher`
- **Priority:** HIGHEST. Always check local files first.
- **Usage:** Before answering a code question, always fetch the relevant files to ensure your answer is grounded in the actual codebase.

### 🧠 The Research Router (MCP Dispatch)

When the task requires external knowledge, route to the correct MCP tool chain:

| Query Type                | Tool Chain                                                             | Rationale                                                |
| :------------------------ | :--------------------------------------------------------------------- | :------------------------------------------------------- |
| **Svelte 5 / SvelteKit**  | `mcp_svelte_list-sections` → `mcp_svelte_get-documentation`            | **Primary Authority.** Ensures Svelte 5 Rune compliance. |
| **GitHub Repo Specifics** | `mcp_deepwiki_read_wiki_structure` → `mcp_deepwiki_read_wiki_contents` | Best for Wikis and READMEs of specific repositories.     |
| **General Libraries**     | `mcp_context7_resolve-library-id` → `mcp_context7_query-docs`          | Professional docs for libraries (Dexie, Prisma, Zod).    |
| **Scientific Inquiry**    | `waldzell-scientific-method`                                           | Deep debugging, hypothesis testing, and causal analysis. |
| **Expert Simulation**     | `waldzell-collaborative-reasoning`                                     | Multi-persona architectural reviews and debates.         |
| **Web Pages / URLs**      | `mcp_firecrawl-mcp_firecrawl_scrape`                                   | Read specific URLs or documentation pages.               |
| **General Search**        | `mcp_firecrawl-mcp_firecrawl_search`                                   | Broad web search as last resort.                         |

### 🌐 External Discovery (Web)

- **Tool:** `Google Search`
- **Priority:** FALLBACK.
- **Usage:** Use when specialized tools return nothing or for very recent events/errors.

## 3. Anti-Patterns

| Pattern                            | Mitigation                                                               |
| :--------------------------------- | :----------------------------------------------------------------------- |
| **Web search before local lookup** | **Forbidden**. Always follow Tiered Sourcing: Local → Specialized → Web. |
| **Dumping raw JSON/HTML**          | **Forbidden**. Synthesize and cite; never paste unprocessed tool output. |
| **Guessing API signatures**        | **Forbidden**. Verify against live docs via the Research Router.         |
