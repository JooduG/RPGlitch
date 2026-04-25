---
name: css
description: Triggered by any task involving styling, layout, or design token implementations in .css files or Svelte <style> blocks (Nordic Collection).
---

# CSS Specialist

> "I am the Stylist. I own the Chalk Regime, the Antigravity weightlessness, and the visual soul of the RPGlitch Engine."

## Overview

The `css` skill is the authoritative workflow for styling and layout within the RPGlitch Engine. It enforces the Nordic Collection's visual language, utilizing native CSS Custom Properties, glassmorphism, and high-performance compositor animations.

### Strategic Context

- **Token Sovereignty**: Map semantic classes to `var(--token)` values. No hardcoded hex allowed.
- **Component Sovereignty**: Kinetic logic (hover/active reflexes) MUST be scoped within atomic components. Avoid global interaction overrides for formal components.
- **Antigravity Vibe**: Use diffused shadows, Z-axis layering, and 3D transforms for depth.
- **Performance First**: Animate ONLY compositor properties (`transform`, `opacity`) to maintain 60fps+.

---

## When to Use

- **Positive Triggers**: Implementing new UI designs, adjusting layout tokens, building the **Universal Field Chassis**, or crafting "Design Spells".
- **Visual Maintenance**: Auditing for hardcoded values, fixing corner-radius mathematical bleeds, or refactoring legacy CSS.
- **EXCLUSIONS**: Do not use for core engine logic; use `javascript` or `simulation` instead.

## How It Works

1. **Token Synchronization**: Identify the correct Nordic Collection tokens for the task.
2. **Layering & Depth**: Apply Antigravity shadow tokens and glassmorphic blur effects.
3. **Execution of Spells**: Build smooth micro-interactions using physics-based transitions.
4. **Audit**: Ensure zero hardcoded hex codes and verify 60fps performance.

### Technical Constraints

- **Compositor Only**: Never animate layout properties (width, height, margin) that trigger reflow.
- **Precision Math**: Use `calc()` and precise border-radius matching (e.g., `radius - 1px`) to prevent background bleed at corners.
- **Modern Notation**: Use modern `rgb(r g b / alpha)` notation for all transparent colors.
- **Accessibility**: Support `safe-area-inset` and provide clear focus indicators.

## Usage

```bash
# Check for hardcoded hex colors and token violations
npm run audit:css

# Lint CSS files for style consistency
npm run lint:css
```

## Present Results

Present the updated visual changes and performance metrics.

- **Evidence**: Screenshots of the UI and performance profiles showing steady 60fps+.
- **Validation**: Prove that all styles are derived from the approved design tokens in `tokens.css`.

## Common Rationalizations

| Agent Excuse                  | The Reality                                                                 |
| :---------------------------- | :-------------------------------------------------------------------------- |
| "Hex is easier for testing."  | Hex is technical debt. Use Nordic Collection tokens from the start.         |
| "Animating height is easier." | Performance is priority. Use scale transforms instead of height animations. |
| "This is a one-off style."    | Every style must be part of the unified design system.                      |

## Red Flags

- **Hardcoded Hex**: Forbidden except within the central `tokens.css` file.
- **Layout Thrashing**: Animating properties that force browser paint/layout recalculations.
- **Inline Styles**: Forbidden. Markup should remain structural and semantic.

## Troubleshooting

- **Style Specificity**: If tokens aren't applying, check for specificity conflicts or global overrides.
- **Janky Animations**: Use the browser Performance tab to identify long tasks or frame drops.

## Verification

- [ ] All hardcoded hex codes removed (except in `tokens.css`).
- [ ] Transitions use only `transform` and `opacity`.
- [ ] Baseline UI constraints (e.g., `h-dvh`) respected.
- [ ] **Hard Evidence Recorded**: Performance audit showing zero layout shifts (CLS < 0.1).
