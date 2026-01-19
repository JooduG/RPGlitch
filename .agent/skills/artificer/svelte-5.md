---
trigger: glob
globs: **/*.svelte, **/*.svelte.js
---

# ⚡ The Svelte 5 Protocol (Runes Update v2)

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

### 🚅 Raw State (`$state.raw`)

**New in v2:** Use for performance optimization on large datasets that do not require deep reactivity.

- **Use Case:** Large Lorebooks, 3D Models, Third-party configurations.
- **Behavior:** Shallow reactivity. Only updates when the component reference itself changes.
- **Syntax:**
  ```javascript
  let heavyData = $state.raw(largeJsonBlob);
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

- **Standard:** Runs _after_ DOM updates.

  ```javascript
  $effect(() => {
    // Analytics or external sync
    console.log(count);
    return () => {
      /* cleanup */
    };
  });
  ```

- **Pre-Update (`$effect.pre`):** Runs _before_ DOM updates.
  - **Use Case:** Managing scroll positions/autoscroll before new content pushes layout.
  ```javascript
  $effect.pre(() => {
    const autoScroll = div.scrollHeight - div.scrollTop === div.clientHeight;
  });
  ```
- **Untrack:** Use `untrack(() => ...)` to read a signal without subscribing.

### 🕵️ Inspection (`$inspect`)

**Debugging:** Replaces `console.log` for reactive variables.

- **Syntax:** `$inspect(variable).with(console.trace);`
- **Behavior:** Logs whenever the dependency changes.

## 2. Component API

### 📦 Props (`$props`)

**Mandatory Pattern:** Destructure immediately.

- **Correct:** `let { title, count = 0 } = $props();`
- **Incorrect:** `let props = $props();` (Harder to track dependencies).
- **Rest Props:** `let { a, ...rest } = $props();`

### 🔗 Two-Way Binding (`$bindable`)

- **Syntax:** `let { value = $bindable() } = $props();`
- **Constraint:** Use sparingly. Prefer "Props Down, Events Up" unidirectional flow.

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

## 5. The Anti-Patterns (Strict Ban List)

**Violating these rules breaks the build.**

| Anti-Pattern               | Replacement        | Reason                                                              |
| :------------------------- | :----------------- | :------------------------------------------------------------------ |
| `export let`               | `$props()`         | Legacy syntax confuses the compiler in Runes mode.                  |
| `writable()`, `readable()` | `$state()`         | Svelte 4 Stores are technical debt.                                 |
| `$: variable = ...`        | `$derived()`       | The "labeled statement" syntax is deprecated.                       |
| `console.log($state)`      | `$inspect($state)` | `console.log` runs once; `$inspect` tracks changes.                 |
| `className`                | `class`            | Svelte HTML attributes match the DOM API, but `class` is supported. |

## 6. Coding Standards

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

## 7. Advanced Templating

### 🧹 Lifecycle

- **Mounting:** `onMount` is still valid for one-time setup (e.g., Canvas init).
- **Updates:** Use `$effect` for reaction to state changes.

## 8. Migration Strategy (Bottom-Up)

- **Atomic Migration:** A file must be 100% Runes or 0% Legacy. No hybrids.
- **Top-Down State:** Migrate `.svelte.js` stores first, then components.
