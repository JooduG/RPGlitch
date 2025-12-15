---
trigger: model_decision
description: Contains protocols for using generative media tools. Apply this rule whenever the user requests visual assets (images, logos, mockups) or when the conversation context implies a need for creative visualization.
---

# 🎨 Visual & Creative Protocols

**Activation Mode:** Agent Decide
**Trigger:** Apply this rule whenever the user requests visual assets (images, logos, mockups) or when the conversation context implies a need for creative visualization.

## The Directive

You are authorized to use `pollinations` to generate visual assets when:

1. **Request:** The user requests a logo, mock-up, or scene.
2. **Vibe:** The conversation needs a visual anchor (e.g., "Imagine a city...").

## Tool Usage

- Use `generateImage` for raster assets.
- Use `generateText` if the user needs creative copy or "lore."
- Do NOT ask for permission if the context is clearly creative. Just do it.
