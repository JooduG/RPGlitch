---
description: The "Spaghetti Cleanup" Protocol. Systematically refactors components to align with Svelte 5 and Design System standards.
---

# 09-refactor (The Cleanup)

> **Goal:** Transform legacy or messy code into pristine, Meridian-compliant structures.

## 1. Triggers

- **Hygiene Fail**: Code rejected by `08-hygiene`.
- **User Request**: "Confusing code", "Refactor this".
- **Slash Command**: `/09-refactor`

## 2. Brain (Context Injection)

- **Standards**: `.agent/rules/standards.md`
- **Svelte 5**: `.agent/skills/svelte/SKILL.md`
- **SCSS**: `.agent/skills/scss/SKILL.md`

## 3. Procedures

### Phase 1: Test Baseline

1. **Snapshot**: Run existing tests. Record pass/fail state.
    - If no tests exist for the target code: write them first.
2. **Coverage**: Note current coverage for the module.
3. **Gate**: Tests must pass before any refactoring begins.

### Phase 2: Logic Extraction (De-Spaghettification)

1. **Scan**: Identify `export let`, `$:`, complex inline logic, or `any` types.
2. **Extract**: Move logic to `*.svelte.js` (Runes).
    - `let x` → `let x = $state()`
    - `$:` → `$derived()` or `$effect()`
3. **Gate**: No behavioral changes. Only structural.

### Phase 3: Visual Alignment (The Paint Job)

1. **Tokenize**: Replace hardcoded values with Design Tokens.
    - `#000` → `var(--color-surface)`
2. **Semantic**: Replace utility bombs with semantic SCSS.
3. **Gate**: No visual regressions.

### Phase 4: Validation

1. **Test**: Run the same test suite from Phase 1. All must pass.
2. **Coverage**: Coverage must not decrease.
3. **Update Plan**: Record the refactoring in `plan.md` or `tracks.md`.
4. **Commit**: `gamemaster(refactor): <description>`.

## 4. Anti-Patterns

- **Big Bang**: Rewriting everything at once. Keep it atomic.
- **Silent Logic Change**: Changing behavior while refactoring.
- **No Tests**: Refactoring without a safety net.

## 5. Tools

- `view_file` (Analyze code)
- `replace_file_content` (Surgical edits)
- `run_command` (Run tests)
