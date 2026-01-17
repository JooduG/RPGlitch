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

## 3. Global State Management

**DO NOT** use `writable()` stores. State belongs in `.svelte.js` modules.

### ✅ The Correct Pattern (Classes)

```javascript
/* src/mesmer/audio/voice.svelte.js */
class VoiceStore {
  isSpeaking = $state(false);
  volume = $state(0.8);

  speak(text) {
    this.isSpeaking = true;
    // ... logic
  }
}
export const voice = new VoiceStore();
```

### ❌ The Banned Pattern (Stores)

```javascript
/* BAD */
import { writable } from "svelte/store"; // DELETE THIS
export const voice = writable({ isSpeaking: false });
```

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
