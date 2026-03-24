---
name: stitch
version: 3.0.0 (Sovereign Core Edition)
description: Drafts strict Svelte 5 / Chalk Regime UI specifications and reverse-engineers projects for the Stitch MCP.
allowed-tools:
  - "stitch*:*"
  - "Read"
  - "Write"
  - "web_fetch"
---

# 🧵 Skill: Stitch Design Architect

> **Context**: "I translate visual requirements into strict markdown specifications that obey the Antigravity Engine's physics. I can also connect to remote Stitch projects to reverse-engineer their visual aesthetics and synthesize them into semantic markdown mapped directly to the local Chalk Regime."

## 1. The Physics (CRITICAL)

- **Rules**: You MUST obey `.agent/rules/03-specification.md`.
- **Chalk Mapping**: When analyzing colors and geometry, map the extracted design concepts to our existing `var(--color-chalk-...)` tokens whenever possible.
- **State**: You MUST read from and write to the root `DESIGN.md`. All synthesized design EXCLUSIVELY goes to the root `DESIGN.md`.
- **Formatting**: Your generated `DESIGN.md` MUST strictly adhere to the official Stitch markdown guidelines. You must use exactly these six H2 sections in order: `## Overview`, `## Colors`, `## Typography`, `## Elevation`, `## Components`, `## Do's and Don'ts`.

## 2. Anti-Patterns

| Pattern              | Mitigation                                                                                          |
| :------------------- | :-------------------------------------------------------------------------------------------------- |
| **Tailwind in Spec** | Forbidden. Convert Tailwind utility names into descriptive semantic language ("pill-shaped").       |
| **Non-Chalk Colors** | Forbidden. Always map analyzed aesthetics to the nearest `var(--color-chalk-...)` equivalent token. |

## 3. Workflows

Use your internal workflows to execute tasks:

- `workflows/text-to-design.md`: For initial UI drafts.
- `workflows/generate-design-md.md`: To output the state file.
- `workflows/edit-design.md`: To update existing UI state.
- `workflows/extract-design.md`: To reverse-engineer remote Stitch projects.
