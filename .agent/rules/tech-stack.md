---
trigger: always_on
description: Contains mandatory coding standards, tech stack constraints (Node 22, Pico.css, Dexie.js), and monorepo architecture rules. Apply this rule whenever writing, refactoring, or reviewing code.
---

# 🛠️ Technology Stack & Constraints

Defines the hard technical constraints and tooling choices for the project.

> **Core Principle:** Vanilla at the core, clean dependencies, maximum integrity.

---

## 1. Runtime Environment

### 🟢 Node.js (Build Time)

- **Version:** 22.x
- **Role:** Build pipeline, linting, testing.
- **Constraint:** No server-side runtime logic (Client-only app).

### 🌐 Browser (Runtime)

- **Target:** Modern ES Modules (ESM).
- **Format:** **Single HTML File** (The "Monolith").
  - CSS, JS, and Assets must be inlined for distribution.
  - No external HTTP requests for core functionality.

---

## 2. The Persistence Layer

### 💾 Dexie.js (IndexedDB)

- **Role:** The **Single Source of Truth** for detailed state.
- **Protocol:**
  - **Versioning:** `db.version(n)` must be strictly sequential. **NEVER** modify a shipped version.
  - **Flow:** Unidirectional (UI writes to DB -> DB updates triggering Reactivity -> UI updates).
- **Safety:** Use transactions for multi-table updates.

### 🔒 LocalStorage

- **Role:** Critical session/settings persistence.
- **Constraint:** Protected by the **Freedom Protocol** (Overridden getters/setters in `index.js`). **DO NOT** remove these overrides.

---

## 3. Frontend Architecture

### ⚡ JavaScript (Core)

- **Flavor:** Vanilla ES Modules.
- **Role:** Business logic, game engines, workers.
- **Forbidden:** `require()`, `var`.

### 🧩 UI Engine (Svelte 5)

- **Framework:** Svelte 5 (Runes).
- **Tooling:** `esbuild-svelte` (Required in build pipeline).
- **Mandate:** All new UI components must be Svelte.
- **Legacy:** Existing Vanilla UI is permitted but deprecated.

### 🎨 CSS & Styling

- **Engine:** SCSS (Sass) -> PostCSS -> CSS.
- **Framework:** **Pico.css** (Semantic HTML base).
- **Icons:** **Inline SVG** only.
  - ❌ No FontAwesome / External Icon Fonts.
  - ✅ `<svg class="icon">...</svg>`

---

## 4. Build Pipeline (The Forge)

### 🔨 Tools

- **Bundler:** `esbuild` (Fast, efficient).
- **Styles:** `sass` (Logic), `postcss` (Compatibility).

### 📦 Asset Strategy

- **Development:** Symlinks/Copies to `dist/` for speed.
- **Production:** **Base64 Inline** (Images) / **Raw Inline** (CSS/JS).
  - The final artifact must be fully offline-capable.

---

## 5. Security Constraints

### 🛡️ Content Integrity

- **Rule:** `innerHTML` is toxic.
- **Mandate:** ALL HTML injection MUST be sanitized via `DOMPurify.sanitize()`.
- **No Exceptions.**

### 📡 Network Policy

- **Default:** Offline / Local-First.
- **Exceptions:** Explicit user-initiated fetch (e.g., AI generation, cloud sync).
