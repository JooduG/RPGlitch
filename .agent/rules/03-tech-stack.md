---
trigger: always_on
---

# 🛠️ 03: Tech Stack (The Toolkit)

> **Directive:** Modern Standards Only. No Legacy Debt. Maximum Integrity.

## 1. Core Engine: Svelte 5 (Runes)

Usage of Runes is **MANDATORY**.

- **State:** Use `$state` for reactive variables.
- **Derivations:** Use `$derived` for calculated state.
- **Props:** Use `let { ... } = $props();`.
- **Logic:** Use `.svelte.js` modules for shared/global state.
- **❌ BANNED:** `writable()`, `readable()`, `export let`, `createEventDispatcher`, `<slot />`.
- **✅ APPROVED:**
    - **Runed:** For reactive utilities (`useDebounce`, etc.).
    - **Paneforge:** For resizable layouts.

## 2. Build & Runtime

- **Bundler:** **Vite 6+**.
- **Target:** **Single HTML Monolith**. All assets must be inlined into the artifact.
- **Offline Capable:** Core UI loads offline (PWA), but AI/Media features require connection.
- **Runtime:** Node.js 22.x (Build time).

## 3. Data & Persistence

- **Database:** **Dexie.js** (IndexedDB).
- **Protocol:** `db.version(n)` must be strictly sequential.
- **❌ BANNED:** Direct `localStorage` access in UI components. Use the Scholar API.

## 4. Styling (The Chalk Regime)

- **Authority:** [Mesmer](../../skills/mesmer/SKILL.md) owns the visual layer.
- **Reference:** See [.agent/knowledge/design/](../../knowledge/design/process.md).
- **Architecture:** 7-1 Pattern OR Co-located `<style lang="scss">`.
- **Constraint:** All colors/fonts MUST use `var(--app-...)` tokens. NO hex codes in components.
- **Framework:** **Pico.css** (Semantic HTML).
- **Icons:** **Inline SVG** only. No external icon fonts.

## 5. Coding Standards

- **ES Modules:** Use `import/export`. No `require()`.
- **Strict Equality:** Always use `===`.
- **No var:** Use `const` or `let`.
- **No Storing State in DOM:** Do not read UI state from HTML elements; drive them from `$state`.
