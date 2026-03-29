---
name: svelte
version: 1.0.0
description: Consolidates svelte_architecture, svelte_best_practice, and svelte_code_writer.
allowed-tools: ["Read", "Write", "mcp_svelte_get-documentation", "svelte-autofixer"]
effort: high
risk: safe
---

# 🛠️ svelte

> **Persona**: **Skill Executor**: "I am The Constructor. I consolidate Svelte Architecture, Best Practices, and Code Writing. I synthesize Component Specifications into Reactive Reality via Svelte 5 Runes, Headless UI, and Tokenized Styling."

## 🔬 Anatomy

```text
skills/svelte/           # Logical Sovereign
├── SKILL.md                     # The Directive
├── scripts/                     # Operational (The How)
└── references/                  # Historical (The Why)
```

## 🎯 Strategic Context

- **High-Fidelity Implementation**: Svelte 5 Runes only ($state, $derived, $effect).
- **Architectural Integrity**: Strict separation of design logic from component structure.
- **Sensory Excellence**: Styling components exclusively via native CSS Custom Properties (`var(--token)`).

## 📋 Procedure

### Component Scaffolding

1. **Atoms & Molecules**:
   - Source headless logic from Bits UI.
   - Describe props via Runes.
   - Write Semantic HTML with Bits UI wrappers (`{#snippet child()}`).

2. **Styling & Testing**:
   - Apply native `var(--token)` references in the component's `<style>` block.
   - Audit with `svelte-autofixer` for compliance.

### Component Auditing

- **Definition of Done**: Modern syntax verified; SCSS removed; hex values eradicated; a11y standards met.
- **Expected Output**: Performance-optimized, a11y-compliant Svelte 5 components.

## 📋 Technical constraints

- **Forbidden Syntax**: `export let`, `$:`, `writable()`, `readable()`, `<slot />`, `createEventDispatcher`.
- **Bits UI**: MANDATORY for interactive elements to ensure functional parity and accessibility.
- **Styling**: Component-scoped styles in `<style>` only. No imports of SCSS files.

## 🚫 Anti-Patterns

- **Utility Classes**: Use of Tailwind or Bootstrap.
- **Legacy Reactivity**: Using legacy Svelte 3/4 syntax.
- **Hardcoded Visuals**: Magic numbers or hex colors in the component code.
- **Manual A11y**: Building custom interactive logic instead of using Bits UI.

---

> "Precision is the baseline of sovereignty."
