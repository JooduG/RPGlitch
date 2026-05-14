---
name: source-driven-development
description: Grounds every implementation decision in official documentation and sovereign rules. Use when you want authoritative, source-cited code free from outdated patterns.
---

# Source-Driven Development

> "Ground every decision in official documentation or sovereign rules. Verification is the antidote to hallucination."

## Overview

The `source-driven-development` skill ensures that all code in the RPGlitch Engine adheres to the most recent, authoritative patterns. By prioritizing official Svelte 5 documentation and the project's own Sovereign Rules (01-06) over memory or outdated training data, we guarantee technical precision and forward-compatibility. Every non-trivial implementation is backed by a cited source.

### Strategic Context

- **Authoritative Hierarchy**: 1. Sovereign Rules → 2. Svelte MCP/Official Docs → 3. Library Docs (Dexie, Vite) → 4. Web Standards (MDN).
- **Rune Sovereignty**: Force the use of Svelte 5 Runes by citing the official migration guides.
- **Transparency**: Cite your sources in the code and the final response to build user trust.

## When to Use

- **Positive Triggers**: Implementing Svelte 5 features (`$state`, snippets), building engine boilerplate, or using a library (Dexie.js) for the first time in a new context.
- **Review Triggers**: When existing code appears to use legacy patterns (Svelte 4 stores) and needs a modern refactor (Rule 03).
- **EXCLUSIONS**: Do not use research tools for trivial JS logic (e.g., basic math or string manipulation) that doesn't touch proprietary or framework-specific APIs.

## How It Works

1. **Stack & Rule Detection**: Verify dependency versions from `package.json` and relevant constraints from Rule 03 and Rule 04.
2. **Authoritative Fetch**: Use the Svelte MCP or search tools to retrieve the latest official documentation.
3. **Pattern Implementation**: Align the code with the cited patterns, resolving any conflicts between documentation and existing legacy code in favor of the Sovereign Rules.
4. **Citation (The Echo)**: Explicitly cite the source (e.g., "Source: Svelte 5 Docs - Runes Reference") in comments and summaries.

### Step 1: Detect Stack and Versions

Always check `package.json` first. Do not assume versions from memory. For RPGlitch, Svelte 5 is the mandated standard for all reactive UI logic.

### Step 2: Fetch Official Documentation

Prioritize MCP servers (Svelte, context7) over general web search. For all third-party libraries, frameworks, or APIs, invoke the `find-docs` skill to ensure current patterns. Avoid second-party tutorials or blog posts which may contain unverified patterns or "slop".

### Step 3: Cite Your Sources

Use deep links or Rule references (e.g., "Rule 04 §Interactors"). If you cannot find official documentation for a chosen pattern, state this explicitly and justify the decision as an "Inferred Best Practice".

## Usage

```bash
# Fetch latest Svelte 5 Rune documentation
mcp_svelte_get_documentation section="$state"

# Verify project rules before implementing aesthetics
view_file AbsolutePath="../../../GEMINI.md#🛡️-04-aesthetics"
```

## Present Results

Present the implementation alongside the cited sources.

- **Evidence**: The code block featuring inline Source citations.
- **Validation**: Demonstrate how the solution precisely matches the documented patterns and the Engine's Rules.

## Common Rationalizations

| Agent Excuse                       | The Reality                                                                               |
| :--------------------------------- | :---------------------------------------------------------------------------------------- |
| "I'm confident I know this API."   | Training data is often legacy. Svelte 5 core patterns have fundamentally shifted. Verify. |
| "Fetching docs wastes context."    | Hallucinating an API and having to refactor it later wastes _more_ context and time.      |
| "This task is too simple to cite." | Every interaction must follow Rule 04. Even a "simple" hover must be grounded.            |

## Red Flags

- **Uncited Modernity**: Using Svelte 5 Runes without a verification step (risk of hallucinated syntax).
- **Legacy Carryover**: Copying existing Svelte 4 patterns from the codebase instead of migrating to the Sovereign standard.
- **Vibe-Grounded Implementation**: Defending a decision based on "vibe" instead of an official source or Rule.

## Troubleshooting

- **Conflicting Docs**: When documentation and Engine Rules conflict, the **Sovereign Rules (01-06)** take precedence.
- **404/Missing Docs**: If the official source is offline, use the next level of the authority hierarchy (MDN/Library Docs).

## Verification

- [ ] Framework and library versions were verified against `package.json`.
- [ ] Official documentation was fetched and cited for all framework-specific logic.
- [ ] Logic follows Rule 03 (Infrastructure) and Rule 04 (Aesthetics) explicitly.
- [ ] **Hard Evidence Recorded**: Links to official documentation and Engine Rules used in implementation.
