---
trigger: glob
globs: **/*.js, **/*.svelte, **/*.svelte.js
---

# JavaScript & Logic Standard (Project Specific)

> **Directive:** Modern ES2024+, Functional Core, Reactive Shell.
> **Scope:** `src/**/*.js` and `src/**/*.svelte`.

## 1. Core Principles

- **No Classes for UI:** Use Svelte components.
- **Classes for Logic:** Use classes for complex state machines (GameMaster, Scholar).
- **Functional:** Prefer pure functions for utilities.

## 2. Modern Syntax (ES2024)

- **Variables:** `const` by default, `let` if mutable. ❌ `var` is BANNED.
- **Async/Await:** Preferred over `.then()`.
- **Modules:** ESM (`import` / `export`) only. No CommonJS (`require`).

## 3. Svelte 5 Integration

- **Extension:** Logic files with state should use `.svelte.js` extension.
- **State:** Use `$state` for reactive properties in classes.
- **Derived:** Use `$derived` for computed values.

## 4. Documentation

- **JSDoc:** Mandatory for all exported functions and classes.

  ```javascript
  /**
   * Calculates the entropy of a system.
   * @param {number} input - Raw value
   * @returns {number} Normalized entropy
   */
  export function calculateEntropy(input) { ... }
  ```

## 5. Error Handling

- **Try/Catch:** Use blocks for unstable ops (Network, Parsing).
- **Validation:** Validate all external inputs (Zod or manual checks) before processing.
