# ⛔ Anti-Patterns & Forbidden Practices

This document explicitly lists patterns that are **strictly forbidden** or **highly discouraged** in the JooduG monorepo.

## 1. Svelte 5 Strictness (Runes Only)

- ❌ **Legacy Props:** `export let data;` is **BANNED**. Use `let { data } = $props();`.
- ❌ **Legacy Reactivity:** `$: count = x * 2;` is **BANNED**. Use `let count = $derived(x * 2);`.
- ❌ **Legacy Events:** `createEventDispatcher` is **BANNED**. Use callback props (`onclick`).
- ❌ **Legacy Stores:** `writable()`, `readable()` are **BANNED**. Use `.svelte.js` classes with `$state`.
- ❌ **Legacy Slots:** `<slot />` is **BANNED**. Use `{#snippet}` and `{@render}`.

## 2. JavaScript / Logic

- ❌ **`var` keyword:** Never use `var`. Use `const` or `let`.
- ❌ **`alert()`, `prompt()`:** Blocking UI threads is forbidden. Use `Modal` components.
- ❌ **`require()`:** The build system uses ES Modules (`import`).
- ❌ **Implicit Coercion:** Avoid `==`. Always use `===`.

## 3. DOM & State

- ❌ **Storing State in DOM:** Do not read values from HTML elements to determine app state. Use `state.svelte.js` or `Dexie`.
- ❌ **Unsanitized `innerHTML`:** Never use `@html` without `DOMPurify.sanitize()`.
- ❌ **Raw `localStorage`:** Do not access `localStorage` directly (violates Freedom Protocol). Use `src/scholar/`.

## 4. UI/UX & Styling

- ❌ **Fixed Widths:** Avoid fixed pixel widths (`px`) for main layout containers. Use the Grid (`fr`).
- ❌ **Utility Soup:** Do not use long Tailwind-style class strings. Use semantic SCSS components.
- ❌ **Legacy Variables:** `var(--pico-*)` usage is **BANNED**. Use `var(--app-*)`.
