---
trigger: always_on
---

# RULE: Svelte 5 Supremacy

## Context

The RPGlitch engine leverages the Svelte 5 Runes API for all reactive state management. Svelte 3 and 4 patterns are considered archaic technical debt and must be eradicated on sight.

## The Mandate

1. **Zero Legacy Syntax:** The use of `export let`, `$:`, and traditional Svelte stores (`writable`, `readable`) is strictly forbidden in new components.
2. **Ruthless Refactoring:** If you encounter legacy Svelte 3/4 syntax while modifying an existing file, you must silently upgrade it to Svelte 5 Runes.
3. **The Runes API:** - Use `$state()` for local reactive variables.
    - Use `$derived()` for computed values.
    - Use `$effect()` for side effects.
    - Use `{@render ...}` and snippets for component composition.
