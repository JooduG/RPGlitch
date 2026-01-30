# 🧩 Gamemaster: AI & Prompt Engineering (The Cortex)

This protocol governs how RPGlitch interfaces with intelligence models and how agents acquire new technical knowledge.

## 1. Local Agent Intelligence (The Meta-Layer)

These specifications are for the **Agentic Development Environment** (Antigravity OS) and do not describe the in-game runtime logic.

- **Gemini 1.5 Pro:** The Reasoning Engine (Cortex). Used for architectural planning and code refactoring.
- **Gemini 1.5 Flash:** The Utility Engine (Reflex). Used for high-frequency documentation and small fix tasks.
- **Context Management:** Leverage the 2M+ token window. Prefer full-context analysis over aggressive RAG chunking when possible.

## 2. Prompting Patterns (The Ink)

### ⛓️ Chain-of-Thought (CoT)

Force linear logic in complex tasks.
`Step 1: Analyze -> Step 2: Dependencies -> Step 3: Plan -> Step 4: Execute.`

### 🎭 Meta-Prompting

Use models to write prompts for other personas (e.g., generating v5.3 of the Blacktide prompt).

### 🧱 Few-Shot Architecture

Anchor model outputs (JSON/Markdown) by providing 3 distinct `Input -> Output` examples.

### 🔍 Intelligence Safeguards

These constraints are promoted to formal repository rules (See [Intelligence Protocol](../rules/07-intelligence.md)).

- **Rule:** "Answer ONLY from provided context. If unknown, state 'I do not know'."

## 3. The Research Router (Knowledge Acquisition)

When the internal knowledge base (this Nexus) is insufficient, use the following routing logic:

| Query Type                | Tool                                                                    | Rationale                                                |
| :------------------------ | :---------------------------------------------------------------------- | :------------------------------------------------------- |
| **Svelte 5 / Vite**       | `mcp_svelte_list-sections` -> `mcp_svelte_get-documentation`            | **Primary Authority.** Ensures Svelte 5 Rune compliance. |
| **GitHub Repo Specifics** | `mcp_deepwiki_read_wiki_structure` -> `mcp_deepwiki_read_wiki_contents` | Best for Wikis and READMEs of specific repositories.     |
| **General Libraries**     | `mcp_context7_resolve-library-id` -> `mcp_context7_query-docs`          | Professional docs for libraries (Dexie, Prisma, Zod).    |
| **Code Patterns**         | `mcp_github_search_code`                                                | Finding real-world usage patterns for specific symbols.  |

## 4. Engineering Best Practices

1. **Deterministic Outputs:** Request structured JSON schemas for machine-readable tasks.
2. **Error Handling:** Build retry logic and validation gates (Warden checks).
3. **Observability:** In debug mode, log raw input prompts to trace "bad logic" days.
