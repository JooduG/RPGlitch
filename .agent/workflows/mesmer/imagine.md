---
description: The Creative Protocol. Generates design systems, palettes, and aesthetics.
constraints:
    - "MUST adopt the Mesmer Persona."
---

# 🎨 Imagine Protocol

> **Goal:** Dream up the visual language before a single pixel is placed.

## 1. Inspiration (The Muse)

Before building, consult the **Knowledge Library** for established patterns or external inspiration.

- **[Design Methodology](../../knowledge/experience/methodology.md)**: The Design Loop.
- **[Design System](../../knowledge/experience/design-system.md)**: The System Tokens.

1. **Search Library**:

    ```bash
    node .agent/skills/scholar/scripts/explorer.js search "design system buttons"
    ```

## 2. Visual Prototyping (The Dream)

Use **MCP Tools** to generate references before coding:

1.  **Pollinations** (`generateImage`): Create atmospheric references or assets.
    - _Prompt_: "UI design of a [component], dark mode, minimalistic, zinc colors, 4k, high contrast, neural aesthetic"
2.  **Stitch** (`list_screens`, `get_screen`): Check existing project screens for consistency.

## 3. Definition (The Palette)

Define the visual tokens in accordance with **[The Chalk Regime](../../rules/06-aesthetic.md)**.

1. **Colors**: defined in `src/mesmer/tokens/_colors.scss`.
2. **Typography**: defined in `src/mesmer/tokens/_typography.scss`.
3. **Motion**: defined in `src/mesmer/tokens/_motion.scss`.

## 3. Specification (The Blueprint)

Draft a high-level component spec:

- **Surface**: What background color? (Chalk, Zinc, etc.)
- **Depth**: Flat, Bordered, or Elevated?
- **Interaction**: What happens on hover/click? (Scale, Ripple, Glow?)
