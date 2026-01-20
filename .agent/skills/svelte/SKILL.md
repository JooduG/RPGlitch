---
name: svelte
description: Triggers on all .svelte and .svelte.js files or where otherwise relevant. Implements the Svelte 5 Protocol using Runes and Vite 6.
---

# Svelte: The Runes Protocol

## When to use this skill

- Creating or modifying UI components in `src/artificer/`.
- Managing reactivity via `$state`, `$derived`, and `$effect`.
- Upgrading existing Svelte 4 or earlier code.

## Mandatory Upgrade Notice

> **CRITICAL**: Any existing Svelte 4 or earlier code (e.g., `export let`, `writable` stores, `$:`) MUST be updated to Svelte 5 Runes immediately. No hybrid code is permitted.

## Workflow

1.  **State Definition**: Identify dependencies and use `$state()` or `$state.raw()`.
2.  **Prop Passing**: Destructure `$props()` immediately in the script tag.
3.  **Derived Logic**: Compute values using `$derived()` or `$derived.by()`.
4.  **Templating**: Replaces `<slot>` with `{#snippet}` and `{@render}`.

## Instructions

- **No Legacy**: ❌ `export let` -> ✅ `$props()`; ❌ `writable()` -> ✅ `$state()`.
- **Events**: Use lowercase HTML attributes (e.g., `onclick={fn}`).
- **Debugging**: Use `$inspect(var)` for reactive variable tracking.
- **Architecture**: Move complex logic into `.svelte.js` classes; UI components are consumers.

## Resources

- [Svelte 5 Runes Documentation](https://svelte.dev/docs/runes)
- [Antigravity Svelte Cheat Sheet]