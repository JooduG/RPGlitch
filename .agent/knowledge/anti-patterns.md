# ⛔ Anti-Patterns & Forbidden Practices

This document explicitly lists patterns that are **strictly forbidden** or **highly discouraged** in the JooduG monorepo.
Agents should check this list before proposing changes.

## 1. JavaScript / Logic

- ❌ **`var` keyword:** Never use `var`. Use `const` by default, or `let` if mutation is required.
- ❌ **`alert()`, `prompt()`, `confirm()`:** Blocking UI threads is forbidden. use custom UI modals.
- ❌ **`require()`:** The build system uses ES Modules (`import`).
- ❌ **Implicit Type Coercion:** Avoid `==`. Always use `===`.

## 2. DOM & State

- ❌ **Storing State in DOM:** Do not read values from HTML elements to determine app state. Use `Dexie.js` as the source of truth.
- ❌ **Unsanitized `innerHTML`:** Never assign dynamic content to `innerHTML` without `DOMPurify.sanitize()`.
- ❌ **`localStorage` (Raw):** Do not use `localStorage` directly (violates Freedom Protocol layer). Use the wrapper or Dexie.

## 3. Operations

- ❌ **`cd` in Scripts:** Never rely on changing directories in scripts. Use absolute paths or project-root relative paths.
- ❌ **Editing Build Artifacts:** Never edit files in `build/output/` or `dist/`. Edit the `apps/*/` source files instead.
- ❌ **Hardcoded Secrets:** Never put API keys or passwords in the code.

## 4. UI/UX

- ❌ **Icon-Only Buttons:** Buttons must have text labels (see `style.md`).
- ❌ **Fixed Widths (px):** Avoid fixed pixel widths for main layout containers; use `%`, `fr`, or `vw` to support the "Universal Stage".
