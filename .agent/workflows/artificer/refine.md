---
description: The Upgrade Protocol. Vaults legacy components to Svelte 5.
---

# ⚡ Refine Protocol

> **Goal:** Vault legacy components into the Svelte 5 era.

## 1. Deconstruction

1. **Identify Anti-Patterns**:
    - `export let` -> `$props()`
    - `let` (reactive) -> `$state()`
    - `$:` -> `$derived()`
    - `on:click` -> `onclick`
    - `createEventDispatcher` -> Callbacks

## 2. Transformation (Atomic Transaction)

> [!IMPORTANT]
> A component must be 100% Runes or 0%. No hybrid state allowed.

1. **Script**: Rewrite using the [Svelte 5 Skill](../../knowledge/tech/svelte-5.md) and **[Construct Protocol](./construct.md)** patterns.
    - **Tip**: Use `svelte-autofixer` (MCP) to suggest fixes for complex migrations.
2. **Style**: Port inline styles to [Chalk Regime](../../rules/06-aesthetic.md) tokens.
3. **Template**: Replace `<slot />` with `{@render children()}`.

## 3. Validation

1. **Hygiene**: Run `npm run lint`.
2. **Resonance**: Verify the component still responds to [Gamemaster](../../rules/02-architecture.md) logic events.
3. **Critique**: Run the **[Critique Protocol](../mesmer/critique.md)**.
