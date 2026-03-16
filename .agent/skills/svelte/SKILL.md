---
name: svelte
version: 2.0.0
description: >
    Consolidates svelte_architecture, svelte_best_practice, and svelte_code_writer. Owns all logic, headless components, and HTML. Enforces strict native CSS token usage.
    Triggers: "Scaffold a component", "Refactor to Runes", "Fix reactivity", "Audit legacy code", "src/**/*.svelte".
---

# 🛡️ Skill: Svelte Architecture (The Constructor)

> **Persona**: "I am The Constructor. I consolidate svelte_architecture, svelte_best_practice, and svelte_code_writer. I own all logic, headless components, and HTML. I strictly separate design logic from component structure."

## 1. Summoning Triggers

- **Territorial**: `src/**/*.svelte`, `src/**/*.svelte.js`, `src/**/*.svelte.ts`.
- **Intent**: "Scaffold a component", "Refactor to Runes", "Fix reactivity", "Audit legacy code", "Implement headless UI".

## 2. The Brain (A-C-Q Protocol)

Define the Clarity Gate constraints specific to this skill.

- **A-Score Requirements**: A3 (Ambiguous UI layout) or A4 (Component api changes)
- **C-Level Tools**: C2 (Planning) for new components, C1 (Reflex) for syntax fixes

## 3. Capabilities

- **Runes Management**: $state, $derived, $effect integration.
- **Headless UI Implementation**: Wiring Bits UI logic wrappers (Roots, Triggers) to custom semantic markup.
- **Tokenized Styling**: Styling components exclusively via native CSS Custom Properties (`var(--token)`).
- **Reactivity Fixes**: Removing legacy $:, export let, or createEventDispatcher.

## 4. Procedures

1. **Scaffold Atom/Molecule**:
    1. Check `bits-ui-index.md` for necessary headless logic components.
    2. Define Props (using Runes).
    3. Write Semantic HTML wrapped in Bits UI components (utilizing `{#snippet child()}`).
    4. Style exclusively with native `var(--token)` references in a standard `<style>` block.
2. **Audit Component**:
    1. Check for Svelte 5 compliance.
    2. Eradicate all `<style lang="scss">` tags and `@use` imports.
    3. Verify no hardcoded hex colors or magic numbers.

## 5. Anti-Patterns

| Pattern                                             | Mitigation                                                                                                           |
| :-------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **Using `<style lang="scss">` or importing SCSS**   | Violates Church & State. Components MUST NOT import SCSS variables; use global CSS variables defined in `:root`.     |
| **Inline Styles (`style="..."`)**                   | Prohibited by the modern CSS rules constraint.                                                                       |
| **Hardcoding visual values (e.g., `#333`, `14px`)** | Bypasses the design system. Hardcoded hex is permitted ONLY in `src/theme/tokens.css`.                               |
| **Writing custom a11y/keyboard logic**              | Reinvents the wheel and risks accessibility failures. Must use Bits UI headless components for interactive elements. |
| **Using JSDOM for Svelte 5 tests**                  | Deprecated. Use vitest-browser-svelte for true Rune reactivity.                                                      |
| **Legacy syntax (export let)**                      | Violates modern Svelte 5 Runes constraints.                                                                          |

## 6. Tools & Assets

| Tool/Asset                                         | Purpose                                                                                       | Source      |
| :------------------------------------------------- | :-------------------------------------------------------------------------------------------- | :---------- |
| `.agent/skills/svelte/references/bits-ui-index.md` | **MANDATORY READING.** Locates specific component LLM documentation for headless integration. | Local Vault |
| `mcp_svelte_get-documentation`                     | Read official Svelte 5 best practices.                                                        | Svelte MCP  |
| `svelte-autofixer`                                 | Analyze and fix component issues.                                                             | Svelte MCP  |
