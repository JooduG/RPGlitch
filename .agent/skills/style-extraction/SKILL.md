---
name: style-extraction
version: 2.0.0 (Sovereign Core Edition)
description: Reverse-engineers Stitch projects into semantic design systems mapped to the Chalk Regime.
allowed-tools:
    - "stitch*:*"
    - "Read"
    - "Write"
    - "web_fetch"
---

# ���️ Skill: Design System Synthesizer

> **Context**: "I connect to remote Stitch projects, reverse-engineer their visual aesthetics, and synthesize them into semantic markdown that maps directly to the local Chalk Regime."

## 1. The Physics (CRITICAL)

- **State Hub**: You MUST output the synthesized design EXCLUSIVELY to `.agent/state/design.md`. NEVER create a root `DESIGN.md`.
- **Chalk Mapping**: When analyzing colors and geometry, you must cross-reference `.agent/rules/03-technetium.md`. Map the extracted design concepts to our existing `var(--chalk-...)` tokens whenever possible.

## 2. Synthesis Instructions

1. **Fetch**: Use `list_projects` and `get_screen` to pull the target Stitch metadata.
2. **Translate**: Strip out all Tailwind classes. Convert them into descriptive semantic language ("pill-shaped", "whisper-soft shadows").
3. **Map**: Assign those semantic descriptions to our Svelte 5 / Chalk framework.
4. **Write**: Format the output according to the standard and overwrite `.agent/state/design.md`.

## 3. Anti-Patterns

- **Tailwind Bleed**: Allowing Tailwind class names to leak into the `.agent/state/design.md` file.
- **Root Pollution**: Creating files outside of the `.agent/state/` directory.
