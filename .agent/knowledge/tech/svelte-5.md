# 🏗️ Artificer: Svelte 5 Runes (The State Engine)

RPGlitch is built on the Svelte 5 reactive core. The usage of **Runes** is mandatory to ensure architectural integrity and performance.

## 🌀 1. The Reactive Primitives

| Rune             | Purpose            | Usage                                     |
| :--------------- | :----------------- | :---------------------------------------- |
| **`$state()`**   | Reactive variable. | `let value = $state(0);`                  |
| **`$derived()`** | Calculated state.  | `let double = $derived(value * 2);`       |
| **`$effect()`**  | Side effects.      | `$effect(() => { console.log(value); });` |
| **`$props()`**   | Component inputs.  | `let { name } = $props();`                |

## 🏗️ 2. Architectural Patterns

### Logic Modules (`.svelte.js` / `.svelte.ts`)

Logic must be separated from markup. Global state (e.g., the 5 Pillars) should reside in `.svelte.js` modules using classes or closure-based state.

```javascript
export class SharedState {
    count = $state(0)
    double = $derived(this.count * 2)
    increment() {
        this.count++
    }
}
```

### Component Structure

- **Props:** Use destructured `$props()`. Use `$bindable()` for two-way bindings.
- **Fragments:** Use Snippets (`{#snippet ...}`) instead of legacy slots.
- **Events:** Use callback props (e.g., `onclick={() => ...}`) instead of `createEventDispatcher`.

## 🧪 3. Testing Strategy

### Unit & Integration (Vitest)

- Use `.svelte.test.js` to enable runes in test files.
- Use `flushSync()` from `svelte` to force effect execution in sync tests.
- Wrap tests using `$effect` in `$effect.root(() => { ... })`.

### E2E Testing (Playwright)

- Focus on user flows and high-level causality checks.
- Configuration: `playwright.config.js`.

## 🤖 4. Automated Hygiene (Svelte MCP)

Use the Svelte MCP tools via `npx` for automated validation and documentation lookup:

- **Autofix:** `npx @sveltejs/mcp svelte-autofixer <path>` (Run before finalizing components).
- **Docs:** `npx @sveltejs/mcp list-sections` and `get-documentation`.
- **Note:** Escape `$` as `\$` when passing code strings in terminal.

## 🛠️ 5. Approved Eco-System

- **Runed:** For reactive utilities (e.g., `useDebounce`, `useStorage`).
- **Paneforge:** For resizable, professional dashboard layouts.

## ❌ 6. Banned Patterns

- No `writable()`/`readable()` stores.
- No `export let`.
- No `createEventDispatcher`.
- No `<slot />`.
- No direct DOM manipulation (unless via `use:action` and unavoidable).
