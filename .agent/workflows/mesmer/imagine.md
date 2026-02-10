---
description: The Creative Protocol. Generates design systems, palettes, and aesthetics.
constraints:
    - "MUST adopt the Mesmer Persona."
---

# 🎨 Imagine Protocol

> **Goal:** Dream up the visual language before a single pixel is placed.

## 1. Inspiration (The Muse)

0. **Ambiguity Check**: Rate Visual Ambiguity (1-5). If >= 3, Ask. Else, Dream.
1. **Search Library**:
    - **File Patterns**:
        - `src/theme/**/*.scss`
        - `src/**/*.svelte` (Style block only

    ```bash
    node .agent/skills/scholar/scripts/explorer.js search "design system buttons"
    ```

## 2. Visual Prototyping (The Dream)

Use **MCP Tools** to generate references before coding:

1.  **Pollinations** (`generateImage`): Create atmospheric references or assets.
    - _Prompt_: "UI design of a [component], dark mode, minimalistic, zinc colors, 4k, high contrast, neural aesthetic"
2.  **Stitch** (`list_screens`, `get_screen`): Check existing project screens for consistency.

### 3. Definition (The Palette)

Define the visual tokens in accordance with **[The Chalk Regime](../../rules/06-aesthetic.md)**.

1. **Colors/Typography/Motion**: defined in `src/theme/abstracts/_variables.scss` and `src/theme/abstracts/_surfaces.scss`.

## 3. Specification (The Blueprint)

Draft a high-level component spec:

- **Surface**: What background color? (Chalk, Zinc, etc.)
- **Depth**: Flat, Bordered, or Elevated?
- **Interaction**: What happens on hover/click? (Scale, Ripple, Glow?)

## 4. The Handoff (To Artificer)

### Option A: Building a Component (Handoff)

Return to the **[Construct Protocol](../artificer/construct.md)** with this spec to generate the structure.

### Option B: Standalone Design

Commit the token updates (`src/theme/abstracts/`) and close the session. No Artificer handoff required.
