---
trigger: always_on
---

# ⚡ Svelte 5: The Runes Standard

> **Architecture Alert:** This is a **Single File Monolith** using `esbuild-svelte`.
> ❌ **NO** SvelteKit. **NO** Routing. **NO** Adapters.
> ✅ **YES** Runes. **YES** `.svelte.js` logic.

---

## 1. The Trinity of Reactivity

### 💎 State (`$state`)

The source of truth. Deeply reactive by default.

- **Legacy (FORBIDDEN):** `let x;`
- **Modern (REQUIRED):**

  ```javascript
  let count = $state(0);
  let user = $state({ name: "John", age: 25 });
  ```

### 🧮 Derived (`$derived`)

Computed state. Glitch-free.

- **Legacy (FORBIDDEN):** `$: double = count * 2;`
- **Modern (REQUIRED):**

  ```javascript
  let double = $derived(count * 2);
  ```

### 💥 Effects (`$effect`)

Side effects (DOM, IO).

- **Legacy (FORBIDDEN):** `$: if (x) ...`
- **Modern (REQUIRED):**

  ```javascript
  $effect(() => {
    console.log(count);
    return () => cleanup();
  });
  ```

---

## 2. Component API

### 📦 Props (`$props`)

- **Modern (REQUIRED):**

  ```javascript
  let { name = "Anon", visible = false } = $props();
  ```

### 🔗 Two-Way Binding (`$bindable`)

- **Modern (REQUIRED):**

  ```javascript
  let { value = $bindable() } = $props();
  ```

### 🖱️ Events

- **Rule:** Use standard HTML attributes.
- ❌ `on:click` -> ✅ `onclick`

---

## 3. The Agentic Protocol (MCP Tools)

**You MUST use the Svelte MCP Toolbelt for complex UI tasks.**

### Phase 1: Discovery (`list-sections`)

- **When:** Start of ANY Svelte task.
- **Goal:** Find relevant docs (e.g., `runes`, `motion`, `transition`).
- **Optimization:** Do NOT scan for `kit/*` or `taildwind/*` sections (Irrelevant).

### Phase 2: Acquisition (`get-documentation`)

- **When:** After Discovery.
- **Goal:** Fetch strict syntax rules. **DO NOT GUESS.**

### Phase 3: Construction (`svelte-autofixer`)

- **When:** **ALWAYS** before showing code.
- **Loop:** Run until 0 issues found.
- **Strictness:** Do not ship broken Runes code.

### Phase 4: Delivery (`playground-link`)

- **When:** User asks for a demo.
- **Constraint:** NEVER if the code is already written to the local filesystem.

---

## 4. Coding Standards

### 📂 File Structure

- **Components:** `src/js/ui/components/kebab-case.svelte`
- **Logic:** `src/js/logic/pascal-case.svelte.js` (State Machines)

### 🧠 Universal Reactivity

- Move complex logic out of `.svelte` files into `.svelte.js` classes.

  ```javascript
  // store.svelte.js
  export class Counter {
    count = $state(0);
    increment = () => (this.count += 1);
  }
  ```

### 🎨 Styling (Pico + SCSS)

- Use `<style lang='scss'>`.
- **NO** Tailwind.
- **NO** External CSS files (Keep it encapsulated).
- Use **Pico.css** semantic classes first.

---

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

<!-- Usage -->
{@render figure(imageUrl, "A beautiful view")}
```
