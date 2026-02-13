# 🧠 AI Engineering & Prompting (The Cortex)

> **Skill:** memory
> **Red Thread:** Structured intelligence acquisition and reliable prompting patterns.

## 1. Local Agent Intelligence

specifications for the **Agentic Development Environment** (Antigravity OS).

- **Context Management:** Leverage the 2M+ token window. Prefer full-context analysis over aggressive RAG chunking.

## 2. Prompting Patterns

- **⛓️ Chain-of-Thought (CoT):** Force linear logic: `Analyze -> Dependencies -> Plan -> Execute`.
- **🎭 Meta-Prompting:** Use models to generate specialized prompts for other personas.
- **🧱 Few-Shot Architecture:** Anchor outputs (JSON/Markdown) with 3 distinct examples.
- **🔍 Safeguards:** Answer ONLY from provided context. State "I do not know" for unknown info.

## 3. The Research Router

Tiered sourcing for knowledge acquisition:

| Query Type          | Tool                          | Rationale                               |
| :------------------ | :---------------------------- | :-------------------------------------- |
| **Svelte 5 / Vite** | `svelte` skill tools          | **Primary Authority.** Rune compliance. |
| **Repo Specifics**  | `research` skill / `deepwiki` | Best for Wikis and READMEs.             |
| **Libraries**       | `context7`                    | Professional docs (Dexie, Zod).         |
| **Code Patterns**   | `github` search               | Real-world usage patterns.              |

## 4. Engineering Best Practices

1. **Deterministic Outputs:** Use structured JSON schemas.
2. **Error Handling:** Build retry logic and validation gates.
3. **Observability:** Log raw input prompts in debug mode to trace logic failures.
