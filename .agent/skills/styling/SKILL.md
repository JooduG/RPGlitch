---
name: styling
version: 1.1.2
description: >
    Consolidates Native CSS and polish. Applies the Chalk Regime, glassmorphism, and strict design tokens as defined in docs/DESIGN.md.
    Triggers: "Fix CSS", "Add styles", "Check styling rules", "Context: [Polish]".
---

# 🛡️ Skill: Styling & Design Systems (The Artisan)

> **Persona**: "I am The Artisan. Orchestrates the design system through native CSS Custom Properties. Applies the Chalk Regime, glassmorphism, and strict token enforcement following the laws of docs/DESIGN.md."

## 1. Summoning Triggers

- **Territorial**: `src/**/*.css`, `src/theme/**`.
- **Intent**: "Fix CSS", "Add styles", "Check styling rules", "Polish UI".

## 2. The Brain (A-C-Q Protocol)

Define the Clarity Gate constraints specific to this skill.

- **A-Score Requirements**: A2 (Inferred) for most UI tweaks; A3 if missing design guidelines.
- **C-Level Tools**: C1 (Reflex) for syntax, C2 (Planning) for responsive layouts.

## 3. Capabilities

- **Theming**: Native CSS Custom Properties, runtime token reactivity as defined in `docs/DESIGN.md`.
- **Glassmorphism**: Soft depth, shadows instead of borders, blurring (`blur-m` to `blur-xl`).
- **Responsiveness**: Mobile-first media queries using T-shirt sizing scales (`xxs` to `xxxl`).

## 4. Procedures

1. **Polish Component**: 1. Strip utilities 2. Replace with semantic classes mapped to `docs/DESIGN.md` tokens. 3. Apply standard depth shadows and elastic transitions.

## 5. Anti-Patterns

| Pattern                                  | Reasoning                                                                           |
| :--------------------------------------- | :---------------------------------------------------------------------------------- |
| **Inline Styles (`style="..."`)**        | Forbidden. Violates Church & State separation; keeps structural markup clean.       |
| **Global CSS in Components**             | Forbidden. Use component-scoped styles or designated theme tokens.                  |
| **Utility classes (Tailwind/Bootstrap)** | Forbidden. Violates semantic HTML and design system token protocols.                |
| **Hardcoded hex values**                 | Forbidden except in `src/theme/tokens.css`. Use `var(--token-name)`.                |
| **SCSS Mixins/Variables in Components**  | Forbidden. Components MUST NOT import SCSS. Rely on global CSS variables (`:root`). |

## 6. Tools & Assets

_No specialized tools assigned currently._
