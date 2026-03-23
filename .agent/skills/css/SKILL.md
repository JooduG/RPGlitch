---
name: css
version: 1.0.0
description: >
  Consolidates Native CSS and polish. Applies the Chalk Regime, glassmorphism, and strict design tokens as defined in .agent/rules/03-specification.md.
  Triggers: "Fix CSS", "Add styles", "Check styling rules", "Context: [Polish]".
---

# Skill: Styling & Design Systems (The Artisan)

> **Persona**: "I am The Artisan. Orchestrates the design system through native CSS Custom Properties. Applies the Chalk Regime, glassmorphism, and strict token enforcement following the absolute laws of `.agent/rules/03-specification.md`."

## 1. Summoning Triggers

- **Territorial**: `src/**/*.css`, `src/theme/**`.
- **Intent**: "Fix CSS", "Add styles", "Check styling rules", "Polish UI".

## 2. The Brain (A-C-Q Protocol)

Define the Clarity Gate constraints specific to this skill.

- **A-Score Requirements**: A2 (Inferred) for most UI tweaks; A3 if missing design guidelines.
- **C-Level Tools**: C1 (Reflex) for syntax, C2 (Planning) for responsive layouts.

## 3. Capabilities & Mandates

- **The Mandate**: Visual consistency is absolute. The Antigravity Engine operates strictly under the "Chalk Regime". You are forbidden from using generic hex codes or external UI library default colors.
- **Theming**: Native CSS Custom Properties ONLY. Runtime token reactivity as defined in `.agent/rules/03-technetium.md`.
- **Glassmorphism**: Soft depth, shadows instead of borders, blurring (`blur-m` to `blur-xl`).
- **Responsiveness**: Mobile-first media queries using T-shirt sizing scales (`xxs` to `xxxl`).

## 4. Procedures

1. **Polish Component**:
   1. Strip utility classes (Tailwind, Bootstrap).
   2. Replace with semantic classes mapped strictly to `.agent/rules/03-technetium.md` tokens (e.g., `var(--color-chalk)`).
   3. Apply standard depth shadows and elastic transitions.

## 5. Anti-Patterns

| Pattern                                  | Mitigation                                                                                                     |
| :--------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| **Inline Styles (`style="..."`)**        | Forbidden. Violates Church & State separation; keeps structural markup clean.                                  |
| **Global CSS in Components**             | Forbidden. Use component-scoped styles or designated theme tokens.                                             |
| **Utility classes (Tailwind/Bootstrap)** | Forbidden. Violates semantic HTML and design system token protocols.                                           |
| **Hardcoded hex values**                 | Forbidden except in `src/theme/tokens.css`. Use `var(--token-name)`. Never write raw hex, `rgb()`, or `hsl()`. |
| **SCSS Mixins/Variables in Components**  | Forbidden. Components MUST NOT import SCSS. Rely on global CSS variables (`:root`).                            |
| **Perchance Incompatibility**            | Forbidden. Ensure all CSS variables are accessible within the Perchance HTML panel environment.                |

## 6. Tools & Assets

_No specialized tools assigned currently. Relies entirely on local rule definitions._
