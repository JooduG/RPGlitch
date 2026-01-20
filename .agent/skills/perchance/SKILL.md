---
name: perchance
description: Triggers on src/gamemaster/llm.js, src/RPGlitch-left-panel.txt, or where otherwise relevant. Governs integration with the Perchance platform and AI plugin management.
---

# Perchance: Platform & Plugin Skill

## When to use this skill

- Designing randomized lists or dynamic text generators.
- Integrating with `ai-text-plugin` or `text-to-image-plugin`.
- Implementing persistence via `kv-plugin` or `remember-plugin`.

## Workflow

1.  **List Definition**: Structure data in the Lists Panel using Perchance indentation rules.
2.  **Logic Mapping**: Implement Inline Selection (`{}`) or Identifier Assignment (`[id = list]`).
3.  **UI Integration**: Re-evaluate outputs via the global `update()` function.
4.  **Plugin Import**: Use `{import:plugin-name}` for official extensions.

## Instructions

- **Sanitization**: All dynamic content MUST pass through `DOMPurify.sanitize()` before rendering.
- **Resolution**: Adhere to `768x512` (Landscape) for AI image generation.
- **Context**: Consolidate AI instructions into a single context window to prevent reliability drop.

## Resources

- [Perchance Guide](../../knowledge/perchance-guide.md) (Internal Reference)
- [Official Perchance Tutorial](https://perchance.org/tutorial)
