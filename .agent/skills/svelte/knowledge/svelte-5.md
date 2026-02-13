# 🏗️ Svelte 5 Runes: The State Engine

> **Skill:** svelte
> **Red Thread:** Mandatory usage of Runes for architectural integrity and performance.

## 🌀 1. The Reactive Primitives

| Rune             | Purpose                       | Usage                                      |
| :--------------- | :---------------------------- | :----------------------------------------- |
| **`$state()`**   | Reactive variable.            | `let value = \$state(0);`                  |
| **`$derived()`** | Calculated state.             | `let double = \$derived(value * 2);`       |
| **`$effect()`**  | Side effects (use sparingly). | `\$effect(() => { console.log(value); });` |
| **`$props()`**   | Component inputs.             | `let { name } = \$props();`                |

## 🏗️ 2. Architectural Patterns

### Logic Modules (`.svelte.js` / `.svelte.ts`)

Logic must be separated from markup. Global state should reside in `.svelte.js` modules using classes or closure-based state.

```javascript
export class SharedState {
    count = \$state(0)
    double = \$derived(this.count * 2)
    increment() {
        this.count++
    }
}
```

### Component Structure

- **Props:** Use destructured `$props()`. Use `$bindable()` for two-way bindings.
- **Fragments:** Use Snippets (`{#snippet ...}`) instead of legacy slots.
- **Events:** Use callback props (e.g., `onclick={() => ...}`) instead of `createEventDispatcher`.

## 🤖 3. Tooling & Hygiene

- **Svelte MCP:** Use `svelte-autofixer` before finalizing components.
- **Documentation:** Consult `list-sections` and `get-documentation` for Svelte 5 specifics.
- **Safety:** Always sanitize dynamic HTML content via `DOMPurify`.

## ❌ 4. Banned Patterns

- No `writable()`/`readable()` stores for internal state.
- No `export let` (use `$props()`).
- No `createEventDispatcher` (use callback props).
- No legacy `<slot />` (use snippets).
