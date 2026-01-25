---
name: tech-research
description: Orchestrates documentation retrieval via Context7, DeepWiki, GitHub, and Svelte tools.
---

# 🔎 Skill: Tech Research

> **The Librarian:** A unified interface for verifying technical information against ground-truth sources.

## 1. When to Use

- **Trigger:** When you are unsure about syntax, API changes, or library features.
- **Protocol Trigger:** Activated by `reasoning-protocol` (L3.5 Discovery) or `decision-framework` (Verification).
- **Goal:** Retrieve authoritative, up-to-date documentation to prevent hallucinations.

## 2. The Research Router

Select the correct tool based on your query type:

| Query Type                | Tool                                                                    | Rationale                                                                                              |
| :------------------------ | :---------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Svelte 5 / SvelteKit**  | `mcp_svelte_list_sections` -> `mcp_svelte_get_documentation`            | **Primary Authority.** Always use this for Svelte/Kit queries to ensure Svelte 5 compliance.           |
| **GitHub Repo Specifics** | `mcp_deepwiki_read_wiki_structure` -> `mcp_deepwiki_read_wiki_contents` | Best for reading Wikis, READMEs, and structure of specific repos (e.g., "How does `shadcn-ui` work?"). |
| **General Libraries**     | `mcp_context7_resolve_library_id` -> `mcp_context7_query_docs`          | Best for general frameworks (React, Next.js, Prisma, Zod) where verified docs are needed.              |
| **Code Examples**         | `mcp_github_search_code`                                                | Best for seeing _how_ a library is used in the wild (finding patterns).                                |

## 3. The Protocol

### Step 1: Identify the Information Gap

- What exactly is unknown? (e.g., "Syntax for Svelte 5 effect", "Next.js 14 server action pattern")

### Step 2: Select the Source

- Use the table above to pick the _single best tool_ for the job.
- **Constraint:** Do not spam multiple tools. Start with the most specific one.

### Step 3: Execute & Synthesize

1. **Call Tool**: Execute the query.
2. **Verify**: Does this match your internal knowledge? if NO, updated your mental model.
3. **Report**: Summarize the findings in your implementation plan or conversation.

## 4. Troubleshooting

- **Context7:** If `resolve_library_id` fails, fallback to `mcp_github_search_repositories` to find the repo, then use `DeepWiki`.
- **Svelte:** If `get_documentation` is too large, use `list_sections` to narrow down the scope first.
