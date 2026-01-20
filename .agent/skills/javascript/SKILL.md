---
name: javascript
description: Triggers on all .js and .svelte.js files or where otherwise relevant. Governs logic module creation, Google style standards, and application state management.
---

# JavaScript: Logic & State Skill

## When to use this skill

- Writing logic in `src/gamemaster/` or other core pillars.
- Creating reactive state modules (`.svelte.js`).
- Implementing utility functions or event bus logic.

## Workflow

1.  **Module Creation**: Place logic in `.js` (pure) or `.svelte.js` (reactive) files.
2.  **Coding Implementation**: Follow Google style (2-space indent, mandatory semicolons).
3.  **Error Handling**: Use `try/catch` with `async/await`.
4.  **Sanitization**: Wrap any dynamic `innerHTML` in `DOMPurify.sanitize()`.

## Instructions

- **Reactivity**: Use Svelte 5 Runes exclusively. No legacy stores (`writable`).
- **Variables**: `const` by default; `var` is strictly forbidden.
- **Naming**: `camelCase` for functions/methods; `PascalCase` for classes.
- **Architecture**: UI components are "dumb" consumers of state defined in logic modules.

## Resources

- **Core Patterns**: Use `init()` functions called by `src/gamemaster/bootstrap.js`.
- **Security**: Never use `alert()` or `confirm()`; use the `Modal` system.
- **Storage**: Use the **Scholar** (Dexie.js) abstraction instead of raw `localStorage`.
