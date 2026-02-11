---
name: tech-svelte
description: Strict technical manual for Svelte 5 Runes syntax and constraints.
---

# Svelte 5 Technical Manual

## Core Framework: Svelte 5 (Runes Mode)

**STRICT ENFORCEMENT:** You are operating in a Svelte 5 Runes-only environment. Svelte 4 legacy syntax is strictly prohibited.

### ✅ APPROVED PATTERNS (Runes)

- **State:** Use `$state(val)` for all reactive variables.
- **Computed:** Use `$derived(expr)` for values dependent on state.
- **Side Effects:** Use `$effect(() => {})` for logic that runs on state change.
- **Props:** Use `let { propName }: Props = $props()` for component inputs.
- **Binding:** Use `$bindable()` for two-way data flow.
- **Snippets:** Use `{#snippet name()}` for reusable UI blocks instead of slots.
- **Events:** Use standard HTML attributes (e.g., `onclick`) or callback props. I.e. `onclick={() => propName()}`

### ❌ NEGATIVE CONSTRAINTS (BANNED PATTERNS)

**CRITICAL VIOLATIONS - DO NOT USE:**

1.  **`export let`**:
    - **Detection**: `export let` at the top level.
    - **Reason**: Deprecated in favor of `$props()`.
    - **Fix**: Convert to `let { ... } = $props()`.

2.  **`$:` (Reactive Declarations)**:
    - **Detection**: `$:` label.
    - **Reason**: Deprecated in favor of `$derived()` or `$effect()`.
    - **Fix**: Use `$derived` for values, `$effect` for side effects.

3.  **`createEventDispatcher`**:
    - **Detection**: `import { createEventDispatcher } ...`
    - **Reason**: Deprecated.
    - **Fix**: Use callback props (e.g., `let { onSave } = $props(); onSave(data);`).

4.  **`<slot>`**:
    - **Detection**: `<slot>` tag.
    - **Reason**: Deprecated in favor of Snippets.
    - **Fix**: Use `{#snippet children()}` or named snippets.

5.  **`$$props` / `$$restProps`**:
    - **Detection**: Usage of `$$props` or `$$restProps`.
    - **Reason**: Deprecated.
    - **Fix**: Use `let { ...rest } = $props()`.

## Styling Standards (SCSS)

- **Scoping**: All component styles must be scoped or use global utility classes carefully.
- **Variables**: Use SCSS variables for colors, spacing, and fonts from the global theme.
- **Architecture**: "Church & State" - Semantic HTML in `.svelte`, logic in `<script>`, styling in `<style lang="scss">` or separate `.scss` files. Zero inline styles.
