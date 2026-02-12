---
description: The "Spaghetti Cleanup" Protocol. Systematically refactors components to align with Svelte 5 and Design System standards.
skill: scribe
context:
    - "Refactor component"
    - "Clean this usage"
    - "Fix spaghetti"
    - "Modernize code"
---

# 🍝 Spaghetti Cleanup Protocol

> **Goal:** Transform legacy/messy code into pristine, Meridian-compliant structures.

## 1. Discovery (The Audit)

Before changing anything, identify the mess.

1.  **Scan for Violations**: Use **[audit-core](../skills/audit-core/SKILL.md)** to find:
    - `export let` / `$:` (Legacy Svelte)
    - `style="..."` (Inline Styles)
    - `#123456` (Hardcoded Hex Codes)
    - `createEventDispatcher`
    - `any` types

## 2. Logic Extraction (De-Spaghettification)

Isolate the logic from the view.

1.  **Move State to Runes**:
    - Convert `let x` to `let x = $state()`.
    - Convert `$:` to `$derived()` or `$effect()`.
2.  **Extract Complex Logic**:
    - If a component has > 50 lines of script, move business logic to a `*.svelte.ts` store in `src/state/`.
    - Refer to **[svelte](../skills/svelte/SKILL.md)** for Store templates.

## 3. Visual Alignment (The Paint Job)

Align with the Design System.

1.  **Tokenize**: Replace all hardcoded values with **[Design Tokens](../skills/scss/templates/TOKENS.scss)**.
    - `#ef4444` → `var(--color-danger)`
    - `8px` → `var(--radius-md)`
    - `z-index: 999` → `var(--layer-overlay)`
2.  **Semantic Classes**:
    - Replace Utility Classes (e.g., `flex justify-center`) with semantic SCSS (e.g., `.card-header { @include flex-center; }`).

## 4. Validation (Quality Gate)

Ensure no new monsters were created.

1.  **Re-Run Audit**: Ensure **[audit-core](../skills/audit-core/SKILL.md)** returns 0 critical errors.
2.  **Anti-Pattern Check**: Verify against **[.agent/rules/anti-patterns.md](../rules/anti-patterns.md)**.
3.  **Manual Test**: Verify the component still renders and behaves as expected.
