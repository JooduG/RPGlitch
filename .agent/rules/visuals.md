---
trigger: model_decision
description: Protocols for generative media and UI assets.
---

# 🎨 Visual & Creative Protocols

**Trigger:** User asks for "images", "logos", "assets", or "visual vibes".

## 1. Native Generation (Priority: High)

Antigravity has superior, context-aware generation.

- **Action:** Use the **Native Asset Generator** (Nano Banana).
- **Context:** Feed the current `_variables.scss` palette into the generation prompt to ensure color matching.
- **Output:** Save as `.webp` or `.png` in the project assets folder.

## 2. Pollinations (Priority: Fallback)

Use `pollinations` MCP **only if**:

- Native generation fails.
- The user explicitly asks for a URL-based asset.
- **Method:** `pollinations.generateImage` -> Inline Base64 (preferred) or URL.
