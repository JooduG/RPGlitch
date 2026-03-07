---
name: svelte
version: 1.0.0
description: >
  Consolidates svelte_architecture, svelte_best_practice, and svelte_code_writer. Owns all logic, components, and HTML.
  Triggers: "Scaffold a component", "Refactor to Runes", "Fix reactivity", "Audit legacy code", "src/**/*.svelte".
---

# 🛡️ Skill: Svelte Architecture (The Constructor)

> **Persona**: "I am The Constructor. Consolidates svelte_architecture, svelte_best_practice, and svelte_code_writer. Owns all logic, components, and HTML."

## 1. Summoning Triggers

- **Territorial**: `src/**/*.svelte`, `src/**/*.svelte.js`, `src/**/*.svelte.ts`.
- **Intent**: "Scaffold a component", "Refactor to Runes", "Fix reactivity", "Audit legacy code".

## 2. The Brain (A-C-Q Protocol)

Define the Clarity Gate constraints specific to this skill.

- **A-Score Requirements**: A3 (Ambiguous UI layout) or A4 (Component api changes)
- **C-Level Tools**: C2 (Planning) for new components, C1 (Reflex) for syntax fixes

## 3. Capabilities

- **Runes Management**: $state, $derived, $effect integration.
- **Component Scaffolding**: Structured HTML, semantic tags, accessible markup.
- **Reactivity Fixes**: Removing legacy $:, export let, or createEventDispatcher.

## 4. Procedures

1. **Scaffold**: 1. Define Props (Runes) 2. Write Semantic HTML 3. Add SCSS.
2. **Audit**: 1. Check for Svelte 5 compliance 2. Verify no inline styles 3. Test reactivity.

## 5. Anti-Patterns

| Pattern | Reasoning |
| :--- | :--- |
| **Using JSDOM for Svelte 5 tests** | Deprecated. Use vitest-browser-svelte for true Rune reactivity. |
| **Legacy syntax (export let)** | Violates modern Svelte 5 Runes constraints. |

## 6. Tools & Assets

| Tool | Purpose | Source |
| :--- | :--- | :--- |
| `mcp_svelte_get-documentation` | Read official Svelte 5 best practices. | Svelte MCP |
| `svelte-autofixer` | Analyze and fix component issues. | Svelte MCP |
