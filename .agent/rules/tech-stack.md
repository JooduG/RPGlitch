---
trigger: always_on
---

# Tech Stack & Antigravity Ecosystem

> **Context:** This document outlines the mandatory engineering constraints (Rules) and the operational strategy for the Agentic Ecosystem.
> **Directive:** Modern Standards Only. No Legacy Debt. Maximum Integrity.

## 1. Core Framework (Svelte 5 Native)

- **Engine:** **Svelte 5 (Runes)**.
- **Paradigm:** Reactivity via `$state`, `$derived`, `$effect`, `$props`.
- **Constraint:** `writable()` and `readable()` stores are **DEPRECATED** for internal logic. Use `.svelte.js` modules for global state.
- **Legacy Ban:** `export let` (Legacy Props).

## 2. Build & Runtime

- **Bundler:** **Vite 6+** (Replaces esbuild).
- **Target:** **Single HTML Monolith** (The "Artifact").
    - All CSS, JS, and Assets must be **inlined**.
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
- **Zero-Trust:** No API keys in client-side code.

## 6. The Perchance Bridge

- **Context:** The app runs inside a strictly sandboxed `<iframe>` on `perchance.org`.
- **Communication:** `window.parent.postMessage` (The only way out).
- **Variables:** `window.ai` and `window.rpgLists` are injected globals.

## 7. The Antigravity Agent Model

> **Philosophy:** Agents are "Managers," not just "Typists."

### 7.1 Model Layers

- **Tier 1 (Cortex):** Gemini 3.0 Pro / Claude 3.5 Sonnet. Used for Planning, complex refactors, and logic.
- **Tier 2 (Reflex):** Gemini 2.x Flash. Used for "Fast Mode" tasks like CSS tweaks, docs, and tests.

### 7.2 Security Architecture (Prompt Injection Defense)

- **File Deny List:** Strict block on SSH keys, `.env`, and secret credentials.
- **Network Allow List:** Restricted to verified domains (`github.com`, `perchance.org`).
- **Zero-Trust Sanitization:** All AI-injected content passes through `DOMPurify`.

## 8. Standards & Protocols

- **JavaScript:** See [javascript skill](../skills/javascript/SKILL.md)
- **Style (SCSS):** See [style skill](../skills/style/SKILL.md)
- **HTML & A11y:** See [html skill](../skills/html/SKILL.md)
- **Brand Identity:** See [design resources](../knowledge/design/)

## 9. Implementation Guidelines (Brand Specific)

### 9.1 SCSS Usage

- Use CSS Variables defined in [./style.md](./style.md).
- **Dark Mode:** Support dark mode using standard media queries or class-based toggles.

### 9.2 Component Patterns

- **Buttons:** Primary actions must use the solid Primary color.
- **Forms:** Labels must always be placed _above_ input fields.
- **Layout:** Use CSS Grid (10-column system) and Flexbox.

### 9.3 Forbidden Patterns

- Do NOT use jQuery.
- Do NOT use Bootstrap classes.
- Do NOT use Tailwind classes.
- **Icons:** Inline SVG (Lucide compatible preferred)
