---
trigger: always_on
description: The Technical Stack. Modern JS, Svelte 5 Runes, and Platform Constraints.
---

# 💻 Physics (The Stack)

## 1. Modern JavaScript Supported

The project operates in an environment where modern JavaScript is supported via the `esbuild` bundler. Standard JS features are officially ALLOWED.

| Syntax             | Status         | Mandate                          |
| :----------------- | :------------- | :------------------------------- |
| `let` / `const`    | ✅ **ALLOWED** | Standard block-scoping.          |
| `() => {}` (Arrow) | ✅ **ALLOWED** | Modern function syntax.          |
| `` `str ${val}` `` | ✅ **ALLOWED** | Template literals are fine.      |
| `async` / `await`  | ✅ **ALLOWED** | Preferred for asynchronous code. |
| `fetch`            | ✅ **ALLOWED** | Standard network requests.       |

## 2. Svelte 5 Supremacy

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
- **Church (CSS):** Managed by Native CSS Custom Properties and Scoped Styles.

### 🛑 Constraints

1. **No Inline Styles**: `style="..."` is prohibited.
2. **No Global CSS**: Use component-scoped styles or designated theme tokens.
3. **No Tailwind**: Prohibited unless explicitly requested for a specific feature.
4. **Hardcoded Hex**: Permitted ONLY in `src/theme/tokens.css`. Use `var(--token-name)` everywhere else.
5. **No SCSS Mixins/Variables in Components**: Svelte components MUST NOT import SCSS variables or mixins. They must rely on global CSS variables defined in `:root`.

## 3. Platform Constraints (Perchance/Web)

### ⚡ The Monolith Mandate

1. **Single-File Build**: All assets must inline into a single `index.html`.
2. **Storage**: Use `Dexie.js` (IndexedDB). No direct `localStorage`.
3. **DOM Limits**: Keep all structure within `#main-app-container`.

## 4. Jurisdiction Matrix

| Skill            | Territory           | Responsibility          |
| :--------------- | :------------------ | :---------------------- |
| **🕹️ Engine**    | `src/core/engine`   | Logic chain & Timing.   |
| **🛠️ UI**        | `src/ui`            | Structure & Reactivity. |
| **🎭 Polish**    | `src/theme`         | Aesthetics & Audio.     |
| **📚 Data**      | `src/data`          | Persistence & Schemas.  |
| **🛡️ Security**  | `src/core/security` | Integrity & Audits.     |
| **🧠 Cognitive** | `.agent/skills`     | Waldzell Reasoning.     |
| **🕸️ Stitch**    | `src/ui/organisms`  | Generative UI Views.    |
| **🧪 QA**        | `src/**/*.test.js`  | Vitest Unit Coverage.   |
