---
trigger: always_on
description: The Technical Stack. Svelte 5 Runes, SCSS Church & State, and Platform Constraints.
---

# 💻 Physics (The Stack)

## 1. Svelte 5 Supremacy

The project operates in a **Svelte 5 Runes-only** environment.

| Syntax                  | Status           | Mandate                          |
| :---------------------- | :--------------- | :------------------------------- |
| `export let`            | 🚫 **FORBIDDEN** | Use `$props()`.                  |
| `$:`                    | 🚫 **FORBIDDEN** | Use `$derived()` or `$effect()`. |
| `createEventDispatcher` | 🚫 **FORBIDDEN** | Use callback props.              |
| `let x` (Reactive)      | 🚫 **FORBIDDEN** | Use `let x = $state()`.          |
| `<slot />`              | 🚫 **FORBIDDEN** | Use `{@render ...}` snippets.    |

## 2. Church & State (Styling)

- **State (HTML/JS):** Managed by Svelte.
- **Church (CSS):** Managed by SCSS.

### 🛑 Constraints

1. **No Inline Styles**: `style="..."` is prohibited.
2. **No Global CSS**: Use component-scoped SCSS or designated theme tokens.
3. **No Tailwind**: Prohibited unless explicitly requested for a specific feature.
4. **No Hardcoded Hex**: Use `var(--app-token)` variables.

## 3. Platform Constraints (Perchance/Web)

### ⚡ The Monolith Mandate

1. **Single-File Build**: All assets must inline into a single `index.html`.
2. **Performance**: Target bundle size < 350KB for optimal reactivity.
3. **Storage**: Use `Dexie.js` (IndexedDB). No direct `localStorage`.
4. **DOM Limits**: Keep all structure within `#main-app-container`.

## 4. Jurisdiction Matrix

| Skill           | Territory              | Responsibility          |
| :-------------- | :--------------------- | :---------------------- |
| **🕹️ Engine**   | `src/core/**`          | Logic chain & Timing.   |
| **🛠️ UI**       | `src/ui/**`            | Structure & Reactivity. |
| **🎭 Polish**   | `src/theme/**`         | Aesthetics & Audio.     |
| **📚 Data**     | `src/data/**`          | Persistence & Schemas.  |
| **🛡️ Security** | `src/core/security/**` | Integrity & Audits.     |
