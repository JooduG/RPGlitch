---
trigger: glob
globs: **/*.svelte, **/*.svelte.js
---

# ⚡ The Svelte 5 Protocol (Runes Update)

> **Directive:** PURE Svelte 5. No Legacy Syntax. No "Hybrid" Code.
> **Architecture:** Vite 6 + Single File Monolith.

## 1. The Reactivity Law (Runes)

We use **Runes** for all reactivity. The old `$` syntax is dead.

### 💎 State (`$state`)

The source of truth. Deeply reactive by default.

- **Proxy:** Objects and arrays are deeply reactive proxies.
- **Usage:**

  ```javascript
  let count = $state(0);
  let user = $state({ name: "John", age: 25 });
  ```

### 🧮 Derived (`$derived`)

Computed state. Glitch-free & Memoized.

- **Syntax:** `let double = $derived(count * 2);`
- **Complex:** Use `$derived.by()` for blocks.

  ```javascript
  let total = $derived.by(() => {
    let sum = 0;
    for (const item of items) sum += item.value;
    return sum;
  });
  ```

### 💥 Effects (`$effect`)

Side effects (DOM, IO). Use sparingly.

- **Syntax:**

  ```javascript
  $effect(() => {
    console.log(count);
    return () => {
      /* cleanup */
    };
  });
  ```

- **Pre-update:** Use `$effect.pre` for DOM measurements before paint.
- **Untrack:** Use `untrack(() => ...)` to read a signal without subscribing.

## 2. Component API

### 📦 Props (`$props`)

- **Syntax:** `let { key = "default" } = $props();`
- **Rest:** `let { a, ...rest } = $props();`

### 🔗 Two-Way Binding (`$bindable`)

- **Syntax:** `let { value = $bindable() } = $props();`

### 🧩 Snippets (`#snippet`)

Replaces `<slot>`.

```svelte
{#snippet figure(src, caption)}
  <figure>
    <img {src} alt={caption} />
    <figcaption>{caption}</figcaption>
  </figure>
{/snippet}

{@render figure(url, "Caption")}
```

## 3. Events (`onclick`)

- **Standard:** Use standard HTML attributes (lowercase).
  - ✅ `<button onclick={handleClick}>`
  - ❌ `<button on:click={handleClick}>`
  - ❌ `<button on:keydown={...}>` -> ✅ `<button onkeydown={...}>`

## 4. The Agentic Protocol (MCP Tools)

**You MUST use the Svelte MCP Toolbelt for complex UI tasks.**

### Phase 1: Discovery

- **Tool:** Use the Svelte MCP to **Search** documentation (`search_documentation`).
- **Query:** Look for "runes", "snippets", or "reactivity" to ensure you are using v5 patterns.

### Phase 2: Acquisition

- **Tool:** Fetch the specific documentation page.
- **Goal:** Get the strict syntax. **DO NOT GUESS.**

### Phase 3: Construction (Manual Strictness)

- **Action:** Since an auto-fixer is not available, you must **Lint** your own code against the "Runes Bible" before outputting.
- **Strictness:** Do not ship legacy `export let` or `writable` stores.

### Phase 4: Delivery

- **Constraint:** NEVER output code if it hasn't been mentally validated against the Svelte 5 rules.

## 5. Coding Standards

### 📂 File Structure

- **Components:** `src/artificer/folder/Component.svelte` (PascalCase)
- **Logic:** `src/gamemaster/logic.svelte.js` (State Machines)

### 🧠 Universal Reactivity

- Move complex logic out of `.svelte` files into `.svelte.js` classes.
- UI components should be "dumb" consumers of global state.

### 🎨 Styling

- Use `<style lang="scss">`.
- **NO** Tailwind.
- **NO** External CSS files (Encapsulation is key).
- Follow the **Style Protocol** in `.agent/rules/style.md`.

## 6. Advanced Templating

### 🧹 Lifecycle

- **Mounting:** `onMount` is still valid for one-time setup (e.g., Canvas init).
- **Updates:** Use `$effect` for reaction to state changes.

## 7. Migration Strategy (Bottom-Up)

- Migrate leaf components first.
- Use `.svelte.js` for shared state stores.
- Do not mix legacy `export let` with Runes.
