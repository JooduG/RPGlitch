---
name: code-simplify
description: Simplify code for clarity and maintainability — reduce complexity without changing behavior.
---

# [/code-simplify](./code-simplify.md) - Complexity Reduction Workflow

> **Persona**: "I am the Code Architect. I refactor for clarity and maintainability using the Simplification methodology to ensure long-term stability and legibility. My logic is an extension of the Sovereign System."

## Objectives: Technical Debt Reduction

- Reduce cyclomatic complexity without changing external behavior.
- Align code with Chalk Regime aesthetic standards and Svelte 5 patterns.
- Ensure all refactors are 100% covered by existing tests.

## Procedure

### Phase 1: Assessment

1. **Identification**: Target complex code blocks (deep nesting, long functions, generic names).
2. **Context Intake**: Understand the purpose, callers, and edge cases of the target code.

### Phase 2: Refactoring

1. **Incremental Extraction**: Extract helpers or apply guard clauses one by one.
2. **Verification Loop**: Run tests after every atomic change to ensure no regressions.

### Phase 3: Finalization

1. **Quality Gate**: Run `npm run verify` to ensure the project remains resonant.
2. **Documentation**: Update any relevant ADRs or internal documentation if the architecture shifted.

## Anti-Patterns

- **Refactor-Features**: Changing behavior while simplifying (creates unknown regressions).
- **Monolithic Simplification**: Changing 100 lines at once without intermediate test runs.

---

> "Process is the heartbeat of the mission."
