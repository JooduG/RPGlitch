---
trigger: always_on
description: Contains mandatory coding standards, tech stack constraints (Node 22, Pico.css, Dexie.js), and monorepo architecture rules. Apply this rule whenever writing, refactoring, or reviewing code.
---

# 🛠️ The Tech Stack (Svelte 5 Native)

> **Directive:** Modern Standards Only. No Legacy Debt. Maximum Integrity.

## 1. Core Framework

- **Engine:** **Svelte 5 (Runes)**.
- **Paradigm:** Reactivity via `$state`, `$derived`, `$effect`.
- **Constraint:** `writable()` and `readable()` stores are **DEPRECATED** for internal logic. Use `.svelte.js` modules for global state.

## 2. Build & Runtime

- **Bundler:** **Vite 6+** (Replaces esbuild).
- **Target:** **Single HTML Monolith** (The "Artifact").
  - CSS, JS, and Assets must be **inlined**.
  - No external HTTP requests for core functionality (Offline First).
- **Environment:** Node.js 22.x (Build Time).
- **Legacy Ban:** No CommonJS (`require`). No Polyfills for dead browsers.

## 3. Data & Persistence

- **Database:** **Dexie.js** (IndexedDB Wrapper).
- **Pattern:** The "Echo" Repository Pattern (`src/scholar/library/echo.js`).
- **Constraint:** **NEVER** access `localStorage` directly in UI components. All persistence goes through the Scholar API.
- **Protocol:** `db.version(n)` must be strictly sequential.

## 4. Styling (The Artificer)

- **Framework:** **Pico.css** (Semantic HTML) - _Abstracts Only_.
- **Preprocessor:** **SCSS** (Sass).
- **Architecture:** 7-1 Pattern (Abstracts, Base, Components, Layouts).
- **Icons:** **Inline SVG** Only.
  - ❌ No FontAwesome / External Icon Fonts.
  - ✅ `<svg class="icon">...</svg>` (Use `currentColor`).
- **Variables:** Use `--app-*` exclusively. ❌ Ban `--pico-*`.

## 5. Security & Integrity

- **Sanitization:** **DOMPurify**.
- **Rule:** `innerHTML` is toxic. If you must use it (`@html`), the content **MUST** be passed through `DOMPurify.sanitize()`.
- **Network:** Default is Offline. Explicit user action required for Fetch (e.g., AI Gen).

## 6. Testing & Quality

- **Unit Test:** **Vitest** (Native ESM).
- **Component Test:** **Vitest / Testing Library**.
- **Linting:** ESLint + Prettier + MarkdownLint.

## 7. The Perchance Bridge

- **Context:** The app runs inside a strictly sandboxed `<iframe>` on `perchance.org`.
- **Communication:** `window.parent.postMessage` (The only way out).
- **Variables:** `window.ai` and `window.rpgLists` are injected globals.
