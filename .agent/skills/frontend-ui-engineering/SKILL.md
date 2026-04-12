---
name: frontend-ui-engineering
description: Builds production-quality UIs using Svelte 5 and the Nordic Aesthetic. Use when building or modifying user-facing interfaces, managing state with Runes, or implementing kinetic interactions.
---

# Frontend UI Engineering

> "I build accessible, performant, and structurally sound interfaces using Svelte 5. I ensure that the code is as clean as the design is beautiful."

## Overview

The `frontend-ui-engineering` skill translates design intent from the Chalk Regime and Nordic Collection into functional code. It leverages Svelte 5's reactivity model (Runes) to create fluid, local-first simulation interfaces. The goal is to produce interfaces that feel premium and tactile, with zero technical slop or "AI-isms".

### Strategic Context

- **Atomic Design**: Structure components into `atoms`, `molecules`, `organisms`, and `layouts`.
- **Svelte 5 Sovereignty**: Use `$state`, `$derived`, and `$props` exclusively. No Svelte 4 legacy patterns.
- **Accessibility First**: Target WCAG 2.1 AA compliance for all interactive elements.

## When to Use

- **Positive Triggers**: Building new UI components, modifying existing layouts, or implementing reactive behavioral logic.
- **System Shifts**: Migrating components from Svelte 4 stores to Svelte 5 Runes (Rule 03).
- **EXCLUSIONS**: Do not use for high-level creative direction; delegate to `designer`. Do not use for core engine logic without UI impact; use `javascript`.

## How It Works

1. **Structural Scaffolding**: Determine atomic placement and draft semantic HTML (Rule 06).
2. **Behavioral Implementation**: Use `$state` for local reactivity and `$props` for component boundaries.
3. **Audit & Polish**: Apply elevation glass tokens (`var(--glass-l)`) and sensory interaction filters.
4. **Verification**: Confirm keyboard accessibility, focus restoration, and responsive performance in the Perchance viewport.

### Svelte 5 Patterns

Prefer **Snippets** (`{@render children?.()}`) for composition over complex property flags. Pass state by reference for bidirectional updates where necessary, but maintain clear component contracts.

### Design System Adherence

Never use raw hex or pixel values. All spacing, colors, and border-radii must be strictly mapped to `DESIGN.md` tokens.

### Accessibility

Ensure every interactive element has an `aria-label` or visible label and is fully navigable via keyboard Tab order.

## Usage

```bash
# Verify component against Rule 03 (Infrastructure) safety gates
npm run verify

# Audit accessibility and console performance in the browser
mcp_chrome-devtools_list_console_messages
```

## Present Results

Present the built or modified UI component.

- **Evidence**: Component code snippet (Svelte 5) and a browser screenshot of the rendered output.
- **Validation**: Demonstrate accessibility by showing the Tab focus sequence and keyboard interaction success.

## Common Rationalizations

| Agent Excuse                                      | The Reality                                                                |
| :------------------------------------------------ | :------------------------------------------------------------------------- |
| "I'll use `export let` for speed."                | Violates Rule 03. Use `$props()` to maintain engine structural safety.     |
| "It's just a div; it doesn't need an ARIA label." | Every interactive element must be accessible. Immersion includes everyone. |
| "I'll hardcode the padding just this once."       | Breaks the design system. Use `var(--spacing-*)` tokens exclusively.       |

## Red Flags

- **Flat/Bouncy UI**: Using instant transitions or vertical hover transforms (violates the Grounded Policy).
- **State Leakage**: Exposing raw reactive state globally instead of through a clean module interface.
- **DOM Reading**: Attempting to read value state from HTML elements instead of using Svelte 5 Runes as the source of truth.

## Troubleshooting

- **Focus Loss**: Use `$effect` to restore focus to trigger elements when modals or pop-ups close.
- **Hydration Flash**: Ensure theme tokens are loaded at the root to prevent SSR layout shifts (CLS).

## Verification

- [ ] Component renders without console errors or linter warnings.
- [ ] Interactive elements are keyboard accessible (Tab check).
- [ ] Responsive behavior verified in Perchance-like viewport widths.
- [ ] **Hard Evidence Recorded**: A screenshot comparison showing the component in both Default and Active states.
