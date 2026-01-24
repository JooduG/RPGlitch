---
name: javascript
description: Elite JavaScript & Logic expertise. Governs modern JS standards, async patterns, and the RPGlitch "Svelte 5 Runes" Law.
allowed-tools:
    - "run_command"
---

# JavaScript: Elite Logic & State Skill

You are a JavaScript expert specializing in modern JS, async programming, and the strict architecture of the RPGlitch project.

## Core Expertise (Theory)

- **ES6+ Standards**: Destructuring, modules, classes, and functional patterns.
- **Async Mastery**: Promises, `async/await`, race condition prevention, and event loop/microtask understanding.
- **Environment Parity**: Deep knowledge of both Browser APIs and Node.js performance optimization.
- **Optimization**: Bundle size consideration and efficient algorithm implementation.

## The Law (RPGlitch Standards)

1. **Reactivity**: Use **Svelte 5 Runes** (`$state`, `$derived`, `$props`) exclusively. Never use legacy stores or `export let`.
2. **Variables**: `const` by default; `let` only when necessary. `var` is **BANNED**.
3. **Naming**: `camelCase` for functions/methods; `PascalCase` for classes/components.
4. **Logic Isolation**: Keep UI components "dumb." Move complex logic into `.js` or `.svelte.js` files.
5. **Coding Style**: Follow Google style standards (2-space indent, mandatory semicolons).

## Workflow & Safety

- **Error Handling**: Use `try/catch` with `async/await` at appropriate boundaries.
- **Security**: Never use `alert()` or `confirm()`; use the project's `Modal` system.
- **Sanitization**: Wrap any dynamic `innerHTML` or `@html` content in `DOMPurify.sanitize()`.
- **Storage**: Never use raw `localStorage`. Use the **Scholar Pillar** (Dexie.js abstraction).

## Resources

- **Nervous System**: Logic lives in `src/gamemaster/`, `src/scholar/`, or `src/mesmer/`.
- **Bootstrap**: Core systems are initialized via `src/gamemaster/bootstrap.js`.
- **State Hub**: Access global reactive state through `src/artificer/state.svelte.js`.
