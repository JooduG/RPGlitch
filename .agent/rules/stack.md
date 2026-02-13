---
trigger: always_on
description: The Technical Stack. Svelte 5 Runes, SCSS, and Platform Constraints.
Triggers:
    - "Context: [Stack]"
---

# 💻 Stack (The Physics)

## 1. Svelte 5 Supremacy (Iron Dome)

You are operating in a **Svelte 5 Runes-only** environment.

| Syntax                    | Status           | Mandate                               |
| :------------------------ | :--------------- | :------------------------------------ |
| `export let`              | 🚫 **FORBIDDEN** | Use `$props()`.                       |
| `$:`                      | 🚫 **FORBIDDEN** | Use `$derived()` or `$effect()`.      |
| `createEventDispatcher`   | 🚫 **FORBIDDEN** | Use callback props (e.g., `onclick`). |
| `let x` (Reactive)        | 🚫 **FORBIDDEN** | Use `let x = $state()`.               |
| `<slot />`                | 🚫 **FORBIDDEN** | Use `{@render children()}` snippets.  |
| `$$props` / `$$restProps` | 🚫 **FORBIDDEN** | Use `$props()`.                       |
| `any` Type                | 🚫 **FORBIDDEN** | Define specific Interfaces.           |

## 2. The "Church & State" of Styling

- **State (HTML/JS):** Managed by **Svelte/Artificer**.
- **Church (CSS):** Managed by **Scss/Mesmer**.

### 🛑 Constraints

1. **NO Inline Styles**: `style="..."` is strictly prohibited.
2. **NO Global CSS**: All styles must be component-scoped or in `src/ui/theme/`.
3. **NO Tailwind**: Unless explicitly requested by User.
4. **NO Hardcoded Hex**: Use `var(--app-token)` exclusively.

### ✅ Architecture

- **File:** `src/ui/components/[Component]/[Component].scss`
- **Import:** `@use "src/ui/theme/mixins" as *;`

## 3. Platform Constraints (Perchance/Web)

### ⚡ The Iron Constraints

1.  **Single-File Mandate**:
    - All assets must be inlined into a single `index.html`.
    - **NO** external `<link>` or `<script src="...">`.
    - **Vite 6 Monolith**: The build system is configured to produce this single file.
2.  **File Size Ceiling**:
    - Total bundle size limit: **~350KB**.
    - **NO** heavy libraries or high-res base64 images.
3.  **Freedom Protocol (Storage)**:
    - **NO** direct `localStorage` or `sessionStorage` (Perchance intercepts these).
    - **REQUIRED**: Use **Dexie.js** (IndexedDB) via the Data Skill for all persistence.
4.  **DOM Limits**:
    - Keep DOM structure within `#main-app-container`.
    - **NO** dangerous tags (iframe/meta) that get stripped.

### 🏗️ Perchance Architecture

1.  **Two-Panel Mode**:
    - **Left Panel**: Logic only. `*-left-panel.txt`.
    - **Right Panel**: UI/HTML only. The build output.
2.  **Scripting (Headless Control)**:
    - Use **Pattern C** (Director Object) to manage state.
    - Avoid global `oc` checks in the loop.

### 🔌 Allowed Plugins

- `ai-text-plugin` (LLM)
- `text-to-image` (Generative)
- **Do not use** `save-plugin` (Use Scholar/IndexedDB).

## 4. Optimization & Bounds

### 🚀 Benchmarks

1.  **Boot Time**: < 500ms (Interactive).
2.  **State Prop**: < 16ms (60fps reactivity).
3.  **RAG Recovery**: < 200ms.

### ⚡ Isomorphic Transformations

When refactoring, use the **Equivalence Oracle**:

- **State Flattening**: Reduce `$state` nesting.
- **Computed Caching**: Move deep `$derived` chains to event-driven updates.

## 5. Jurisdiction Matrix (Territorial Control)

| Skill                 | Territory                   | Responsibility                            |
| :-------------------- | :-------------------------- | :---------------------------------------- |
| **🕹️ Engine**         | `src/core/**`               | Logic chain, App State, Timing.           |
| **🛠️ UI (Svelte)**    | `src/ui/**`, `**/*.svelte`  | HTML Structure, Svelte Logic, Components. |
| **🎭 Sensory (Scss)** | `src/theme/**`, `**/*.scss` | Visuals, CSS, Audio, Vibe.                |
| **📚 Data**           | `src/data/**`               | Validating Schemas, Dexie Integration.    |
| **🛡️ Security**       | `src/core/security/**`      | Input Validation, Sanitization.           |
