---
name: javascript
description: Triggered by any task involving core logic, utility functions, or monolith engineering in .js or .ts files. MUST be invoked for all non-UI logic.
---

# 💻 Javascript Logic Architecture

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

## 📋 Quality Verification

- **Definition of Done**: DRY principles satisfied; zero linting debt; logic verified via unit tests.
- **Expected Output**: Sovereign, purely logical code blocks.
- **Reference**: High-leverage patterns integrated from [Scribbles](../../../scribbles.md).

## 🚫 Anti-Patterns

- **Legacy Syntax**: Use of `var`, `function` declarations, or `callback hell`.
- **Silent Failures**: Swallowing errors or failing without descriptive logs.
- **Deep Nesting**: Avoid complexity; use optional chaining and guard clauses.
- **Code Duplication**: Violating DRY principles.

## ⚖️ Common Rationalizations

| Excuse                                                     | Counter-Measure                                                             |
| :--------------------------------------------------------- | :-------------------------------------------------------------------------- |
| "I'll use a `var` here; it's a legacy script."             | "Legacy is debt. Refactor to ES6+ standards immediately."                   |
| "This doesn't need a private field; it's internal anyway." | "Encapsulation is safety. Use `#private` fields for class state."           |
| "I'll skip the error handling for this small utility."     | "Logic failures must be descriptive. Implement robust boundary validation." |

## ✅ Verification

- [ ] SOLID principles satisfied for new class and function designs.
- [ ] Logic verified via successful unit test execution.
- [ ] No use of legacy syntax (`var`, `function` declarations).
- [ ] All class state encapsulated via `#private` fields.

---

> "Logic is the heartbeat of reality."
