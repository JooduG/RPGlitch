---
name: research
description: >
    The Deep Search Interface. Orchestrates active investigation via Local Files, 
    Specialized MCPs, and Web Search.
    Triggers:
    - "Research [Topic]"
    - "Find documentation"
    - "Search the web"
    - "Locate file"
    - "Check source code"
---

# 🔎 Research

## 1. Governance Rules

### 📉 Tiered Sourcing

When gathering info, follow this strict order to ensure quality:

1.  **Tier 1 (Local):** Is it in the `src/` files? -> Use `File Fetcher`.
2.  **Tier 2 (Specialized):** Is it a known domain? -> Use `svelte`, `context7`, `deepwiki`, or `firecrawl`.
3.  **Tier 3 (General):** Is it unknown? -> Use `Google Search`.

### 🧩 Context Assembly

- **Synthesize, Don't Dump:** Do not paste raw JSON or HTML. Read the source, extract the answer, and explain it.
- **Cite Sources:** "According to Svelte docs..." or "Found in `src/main.js`..."

## 2. Capabilities

### 📂 Internal Discovery (Files)

- **Tool:** `File Fetcher`
- **Priority:** HIGHEST. Always check local files first.
- **Usage:** Before answering a code question, always fetch the relevant files to ensure your answer is grounded in the actual codebase.

### 🧠 Specialized Intelligence (MCPs)

- **`svelte`**: Official documentation for Svelte/SvelteKit. Use for _syntax_ and _framework_ questions.
- **`context7`**: Component & Library search. Use when looking for _packages_ or _design patterns_.
- **`deepwiki`**: Deep conceptual research. Use for _philosophy_, _complex architecture_, or _history_.
- **`firecrawl`**: Documentation scraper. Use to read a specific URL.

### 🌐 External Discovery (Web)

- **Tool:** `Google Search`
- **Priority:** FALLBACK.
- **Usage:** Use when specialized tools return nothing or for very recent events/errors.
