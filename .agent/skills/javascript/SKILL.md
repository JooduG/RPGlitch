---
name: javascript
version: 1.1.0
description: "Base JS engineering standards. Owns clean code, SOLID principles, and modern pattern enforcement across the monolith. MUST be invoked when working on ANY JavaScript code."
allowed-tools: ["Read", "Write", "multi_replace_file_content"]
effort: medium
risk: safe
---

# 🛠️ Javascript Logic Architecture

> "I am the Logic Architect. I define the flow of truth and state. I synthesize Specifications into Professional Logic via Clean Code, SOLID principles, and Modern JS Patterns."

## 🔬 Anatomy

```text
skills/javascript/
├── SKILL.md
└── references/
```

## 🎯 Strategic Context

- **High-Fidelity Implementation**: Precision-engineered, readable, and maintainable logic.
- **Architectural Integrity**: Enforces Rule 03 (Infrastructure) and Rule 05 (Intelligence).
- **Sensory Excellence**: Ensures logic is optimized for the Nordic Collection's kinetic physics.

## 📋 Procedure

### Clean Code & SOLID Standards

1. **The Logic Gate**:
   - Apply SOLID principles to all class and function designs.
   - Prioritize readability over cleverness (KISS).
   - Use descriptive, intention-revealing names.

2. **Modern Pattern Enforcement**:
   - Utilize ES6+ features (Destructuring, Optional Chaining, Nullish Coalescing).
   - Favor functional programming patterns (Immutable state, Pure functions).
   - Enforce explicit error handling and boundary validation (Rule 06).

### Modern Pattern Lexicon (The Core)

1. **Async Orchestration**:
   - **Parallelism**: Use `Promise.allSettled()` or `Promise.all()` for concurrent operations.
   - **Resilience**: Implement `fetchWithRetry` and `withTimeout` wrappers for external I/O.
   - **Streams**: Favor `Async Generators` for paginated or streaming data.

2. **Functional Pipelines**:
   - **Composition**: Use `pipe(...fns)` or `compose(...fns)` for data transformation sequences (e.g., `sanitize → transform → validate`).
   - **Pure Power**: Maintain strict immutability using `spread` (`...`) and `structuredClone()` for deep copies.
   - **Array Mastery**: Deep utilization of `flatMap`, `reduce`, and `Array.from` for complex state derivation.

3. **Sovereign Class Design**:
   - **Privacy**: Enforce true encapsulation using `#private` fields and methods.
   - **Statics**: Use `static` factory methods (e.g., `User.create()`) for complex initialization.

### Quality Verification

- **Definition of Done**: DRY principles satisfied; zero linting debt; logic verified via unit tests.
- **Expected Output**: Sovereign, purely logical code blocks.
- **Reference**: High-leverage patterns integrated from [Scribbles](../../../scribbles.md).

## 🚫 Anti-Patterns

- **Legacy Syntax**: Use of `var`, `function` declarations, or `callback hell`.
- **Silent Failures**: Swallowing errors or failing without descriptive logs.
- **Deep Nesting**: Avoid complexity; use optional chaining and guard clauses.
- **Code Duplication**: Violating DRY principles.

---

> "Logic is the heartbeat of reality."
