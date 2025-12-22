---
trigger: always_on
description: Contains mandatory coding standards, tech stack constraints (Node 22, Pico.css, Dexie.js), and monorepo architecture rules. Apply this rule whenever writing, refactoring, or reviewing code.
---

# System Constraints: Technology Stack

## 1. Core Runtime

- **Node:** 22.x
- **Output Target:** Single HTML File (Inline CSS/JS)

## 2. Database (Dexie.js)

- **Mandate:** Single Source of Truth.
- **Versioning:** `db.version(n)` must be strictly sequential. Never modify existing versions.
- **Sync:** Unidirectional Data Flow (DB Write -> Live Query -> Reactivity).

## 3. UI Framework (Pico.css)

- **Mandate:** Semantic HTML first.
- **Constraint:** Minimize custom classes. Use variables for theming.
- **Icons:** SVG Only (Inline). No Font Awesome or external icon fonts.

## 4. Javascript (Vanilla ESM)

- **Format:** Standard ES Modules.
- **Forbidden:** `require()`, `var`, `function` (prefer arrow functions where this context allows).
- **Security:** `innerHTML` assignments MUST be sanitized via `DOMPurify.sanitize()`.

## 5. Build Pipeline

- **Components:** `esbuild`, `sass`, `postcss`.
- **Asset Handling:** Inlined. No external file references in final build.
