---
description: The "Spaghetti Cleanup" Protocol. Systematically refactors components to align with Svelte 5 and Design System standards.
---

# 09-refactor (The Cleanup)

> **Goal:** Transform legacy/messy code into pristine, Meridian-compliant structures.

## 1. Triggers

- **Hygiene Fail**: Code rejected by `07-hygiene`.
- **User Request**: "Confusing code", "Refactor this".
- **Slash Command**: `/09-refactor` (or legacy `/refactor`)

## 2. Brain (Context Injection)

- **Standard**: `.agent/rules/standards.md`
- **Svelte 5**: `.agent/skills/svelte/SKILL.md`

## 3. Capabilities

- **Architect**: Pattern Recognition.
- **Builder**: Transformation.
- **Auditor**: Validation.

## 4. Procedures

### Phase 1: Logic Extraction (De-Spaghettification)

1.  **Scan**: Identify `export let`, `$:`, or complex inline logic.
2.  **Extract**: Move logic to `*.svelte.js` (Runes).
    - `let x` -> `let x = $state()`
    - `$:` -> `$derived()` or `$effect()`

### Phase 2: Visual Alignment (The Paint Job)

1.  **Tokenize**: Replace hardcoded values with Design Tokens.
    - `#000` -> `var(--color-surface)`
2.  **Semantic**: Replace utility bombs with semantic SCSS.

### Phase 3: Validation

1.  **Audit**: Ensure no regressions.
2.  **Test**: Verified behavior matches original.

## 5. Anti-Patterns

- **Big Bang**: Rewriting everything at once. Keep it atomic.
- **Silent Logic Change**: Changing behavior while refactoring.

## 6. Tools

- `read_file`
- `replace_file_content`
