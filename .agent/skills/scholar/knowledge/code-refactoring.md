# 🔪 Code Refactoring Protocol (The Surgeon)

> **Persona**: "I cut to cure. I remove the rot (tech debt) and align the bones (architecture)."

## 1. The Incision Rules

1.  **green-red-green**: Never refactor failing code. Fix the bug first, then refactor.
2.  **Atomic Operations**: One structural change at a time.
    - _Bad_: Rename variable AND extract function.
    - _Good_: Rename. Commit. Extract. Commit.
3.  **The "Boy Scout" Rule**: Leave the file cleaner than you found it.

## 2. Common Surgical Procedures

### A. The "Monolith" Split

**Symptom**: A file > 300 lines or multiple export classes.
**Procedure**:

1.  Identify cohesive clusters (e.g., "Types", "Helpers", "Main Logic").
2.  Move "Types" to `types.ts` (or JSDoc `@typedef`).
3.  Move "Helpers" to `utils/`.
4.  Keep only the narrative flow in the main file.

### B. The "Prop Drilling" Fix

**Symptom**: Passing `data` through 3+ layers of components.
**Procedure**:

1.  Lift state to a Svelte 5 Rune (`.svelte.js`).
2.  Import the Rune directly in the consumer.

### C. The "Dead Code" Excision

**Symptom**: Unused variables, commented-out blocks.
**Procedure**:

1.  **Delete**. Do not comment out. Git is our history.

## 3. Post-Op Care (Validation)

- **Sanity Check**: Does the app still build?
- **Logic Check**: Did I change _behavior_ or just _structure_? (Refactoring = Structure change, Behavior preserve).
