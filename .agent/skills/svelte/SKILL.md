---
name: svelte
version: 1.2.0
description: Consolidates Svelte Architecture, Best Practices, and Component Construction.
allowed-tools:
  [
    "Read",
    "Write",
    "mcp_svelte_get-documentation",
    "svelte-autofixer",
    "mcp_svelte_playground-link",
    "read_url_content"
  ]
effort: high
risk: safe
---

# 🛠️ Svelte: The Constructor

> "I am the Constructor. I synthesize Component Specifications into Reactive Reality using Svelte 5 Runes, Headless UI, and Tokenized Styling. I do not guess the physics; I verify them against the living documentation."

## 🔬 Anatomy

```text
skills/svelte/
├── SKILL.md
├── scripts/
├── references/
└── templates/
```

## 🎯 Strategic Context

- **High-Fidelity Implementation**: Svelte 5 Runes only ($state, $derived, $effect).
- **Architectural Integrity**: Absolute separation of headless logic from sensory expression.
- **Sensory Excellence**: Component styles strictly utilize the **Nordic Collection** tokens.

## 📋 Procedure: The Sovereign Scaffolding Loop

### Phase 1: Research (The Anchor)

1. **Primitive Discovery**: Search `references/bits-ui-index.md` for the relevant interactive pattern (e.g., Dialog, Accordion).
2. **Document Retrieval**: Invoke `read_url_content` on the Bits UI `.txt` documentation endpoint. **Do not hallucinate the Bits UI API.**

### Phase 2: Logic (The Rune)

1. **State Anchor**: Use `$props()` for inputs and `$state()` for internal reactive data.
2. **Delegation**: Leverage `{#snippet child({ props })}` as defined in `references/runes-and-patterns.md`.

### Phase 3: Visuals (The Application)

1. **Token Application**: Apply native CSS variables (`var(--token)`) within the `<style>` block.
2. **Boundary Enforcement**: You MUST only apply existing tokens. If a new visual standard is required, fallback to the **[Designer](../designer/)** skill for token definition.

### Phase 4: Synthesis (The Gate)

1. **Syntax Purity**: Run `svelte-autofixer` to certify Svelte 5 compliance.
2. **Playground Verification**: For complex interactive components, invoke `mcp_svelte_playground-link` to provide a shareable preview link for validation.

## 📋 Technical Constraints

- **Forbidden Syntax**: `export let`, `$:`, `writable()`, `readable()`, `<slot />`, `createEventDispatcher`.
- **Bits UI**: MANDATORY for interactive elements to ensure functional parity and accessibility.
- **Styling**: Component-scoped styles in `<style>` only. No imports of SCSS files.
- **Token Sovereignty**: Svelte components apply tokens; only the Designer skill defines them.

## 🚫 Anti-Patterns

- **Utility Classes**: Use of Tailwind or Bootstrap.
- **Vibe Coding**: Guessing Bits UI or Svelte 5 syntax without consulting the references.
- **Implicit Overlays**: Creating custom accessible primitives instead of using Bits UI.
- **Logic Leaks**: Managing design tokens within the Svelte logic rather than the CSS layer.

---

> "Precision is the baseline of sovereignty."
