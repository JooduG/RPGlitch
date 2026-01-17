---
trigger: always_on
---

# ⚡ The Svelte 5 Protocol (Runes Edition)

> **Directive:** PURE Svelte 5. No Legacy Syntax. No "Hybrid" Code.
> **Architecture:** Vite 6 + Single File Monolith.

## 1. The Reactivity Law (Runes)

We use **Runes** for all reactivity. The old `$` syntax is dead.

### 💎 State (`$state`)

The source of truth. Deeply reactive by default.

- **Legacy (BANNED):** `let x;` (Top level reactivity)
- **Modern (REQUIRED):**

```javascript
let count = $state(0);
let user = $state({ name: "John", age: 25 });
```

### 🧮 Derived (`$derived`)

Computed state. Glitch-free.

- **Legacy (BANNED):** `$: double = count * 2;`
- **Modern (REQUIRED):**

```javascript
let double = $derived(count * 2);
```

### 💥 Effects (`$effect`)

Side effects (DOM, IO).

- **Legacy (BANNED):** `$: if (x) ...`
- **Modern (REQUIRED):**

```javascript
$effect(() => {
  console.log(count);
  return () => cleanup();
});
```

## 2. Component API

### 📦 Props (`$props`)

- **Legacy (BANNED):** `export let data;`
- **Modern (REQUIRED):**

```javascript
let { name = "Anon", visible = false } = $props();
```

### 🔗 Two-Way Binding (`$bindable`)

- **Modern (REQUIRED):**

```javascript
let { value = $bindable() } = $props();
```

### 🖱️ Events & Attributes

- **Rule:** Use standard HTML attributes.
- ❌ `on:click` -> ✅ `onclick`
- ❌ `class:active={isActive}` -> ✅ `class={isActive ? "active" : ""}` (Standard JS)

## 3. The Agentic Protocol (MCP Tools)

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

## 4. Coding Standards

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

## 5. Advanced Templating

### 🧩 Snippets (`#snippet`)

Replaces complex `<slot>` usage.

```svelte
{#snippet figure(src, caption)}
  <figure>
    <img {src} alt={caption} />
    <figcaption>{caption}</figcaption>
  </figure>
{/snippet}

{@render figure(imageUrl, "A beautiful view")}
```

### 🧹 Lifecycle

- **Mounting:** `onMount` is still valid for one-time setup (e.g., Canvas init).
- **Updates:** Use `$effect` for reaction to state changes.
