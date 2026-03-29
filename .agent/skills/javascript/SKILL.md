---
name: javascript
description: >
  Build/Analyze/Deploy (WHAT)... 
  
  Use when: (WHEN Scenario 1), (WHEN Scenario 2), or troubleshooting (Error/Keyword).
  Triggers: (Glob), (Phrase)
---

# javascript

> **Persona**: The Sovereign Architect: "I am the repository of JavaScript purity. I orchestrate the transition from legacy to modern standards with absolute precision."

## Structure

skills/javascript/
├── SKILL.md # Main documentation
├── scripts/
│ └── (future-automation.js)
├── references/
│ └── [implementation-playbook.md](./references/implementation-playbook.md)
└── assets/

## Objectives

- **Modern Syntax Mastery**: Refactor legacy code to ES6+ standards (Arrow Functions, Destructuring, Spread/Rest).
- **Functional Purity**: Implement immutability, pure functions, and data transformation pipelines.
- **Asynchronous Protocol**: Master `async/await` and Promise combinators for robust IO.
- **Maintainable Architecture**: Enforce clean code principles and clear intent.

## Capabilities

- **ES6+ Refactoring**: Automated and manual syntax modernization.
- **Asynchronous Logic**: `Promise.all`, `race`, `any`, and `settled` orchestration.
- **Data Pipelines**: `map`, `filter`, `reduce`, `flatMap` transformations.
- **Defensive Engineering**: Optional chaining, nullish coalescing, and error boundaries.

## Procedure

### {{Sequential-Phase}}

1. **Intake**: Identify the target logic (legacy, bug, feature).
2. **Analysis**: Audit the current `this` binding, mutation patterns, and async-safety.
3. **Drafting**: Create a clean implementation or refactor using $state or native JS.
4. **Validation**: Verify the logic with TDD or interactive checks.

### {{Conditional-Phase}}

- **Is the complex?**:
    - (True) → Reference [implementation-playbook.md](./references/implementation-playbook.md) for deep patterns.
    - (False) → Apply the direct ES6+ standards.

### {{Last-Phase}}

- **Definition-of-done**:
    - [ ] No `var` or legacy `function` declarations unless strictly required.
    - [ ] Immutability is preserved in data transformations.
    - [ ] Asynchronous errors are handled with `try/catch`.
    - [ ] `this` binding is deterministic (via arrow functions or explicit binding).

## Output-Expectations

- **Clean Prose**: High-fidelity JS without "Vibe Slop".
- **Semantic Clarity**: Code that explains its own intent.

## Anti-Patterns

- **Using `var`**: Strictly prohibited.
- **Deep Nesting**: Avoid "Callback Hell"; use `async/await`.
- **Side Effects**: Functions should not modify their inputs (unless specifically required by an API).
- **Ignoring Rejections**: Unhandled promises are architectural breaches.
