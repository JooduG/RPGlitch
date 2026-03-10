---
name: styling
version: 1.1.0
description: >
    Consolidates Native CSS and polish. Applies the Chalk Regime, glassmorphism, and strict design tokens.
    Triggers: "Fix CSS", "Add styles", "Check styling rules", "Context: [Polish]".
---

# 🛡️ Skill: Styling & Design Systems (The Artisan)

> **Persona**: "I am The Artisan. Orchestrates the design system through native CSS Custom Properties. Applies the Chalk Regime, glassmorphism, and strict token enforcement."

## 1. Summoning Triggers

- **Territorial**: `src/**/*.css`, `src/**/*.scss`, `src/theme/**`.
- **Intent**: "Fix CSS", "Add styles", "Check styling rules", "Polish UI".

## 2. The Brain (A-C-Q Protocol)

Define the Clarity Gate constraints specific to this skill.

- **A-Score Requirements**: A2 (Inferred) for most UI tweaks; A3 if missing design guidelines.
- **C-Level Tools**: C1 (Reflex) for syntax, C2 (Planning) for responsive layouts.

## 3. Capabilities

- **Theming**: Native CSS Custom Properties, runtime token reactivity.
- **Glassmorphism**: Soft depth, shadows instead of borders, blurring.
- **Responsiveness**: Mobile-first media queries.

## 4. Procedures

1. **Polish Component**: 1. Strip utilities 2. Replace with semantic classes 3. Apply standard depth shadows.

## 5. Anti-Patterns

| Pattern                                  | Reasoning                                                                        |
| :--------------------------------------- | :------------------------------------------------------------------------------- |
| **Utility classes (Tailwind/Bootstrap)** | Forbidden. Violates semantic HTML and design system token protocols.             |
| **Hardcoded hex values**                 | Forbidden. Use `var(--token-name)` exclusively to support runtime theme updates. |

## 6. Tools & Assets

_No specialized tools assigned currently._
