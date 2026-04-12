---
name: code-simplification
description: Simplifies code for clarity. Use when refactoring code for clarity without changing behavior. Use when code works but is harder to read, maintain, or extend than it should be. Use when reviewing code that has accumulated unnecessary complexity.
---

# Code Simplification

> "Simplify code by reducing complexity while preserving exact behavior. Code should be easier to read, understand, and debug."

## Overview

The `code-simplification` skill focuses on refining working code into its most elegant and maintainable form. It avoids "clever" tricks in favor of explicit, readable logic. Every simplification must ensure that inputs, outputs, side effects, and error behaviors remain identical to the original implementation.

### Strategic Context

- **Preserve Behavior**: Never change what the code _does_, only how it _expresses_ it.
- **Clarity > Cleverness**: Explicit code is better than compact code that is hard to parse.
- **Chesterton's Fence**: Understand why a piece of code exists before changing or removing it.

## When to Use

- **Positive Triggers**: After completing a feature when the logic feels "heavy", during code reviews for complexity issues, or when refactoring logic written under pressure.
- **Refactoring Triggers**: Consolidating duplicated logic or flattening deeply nested structures.
- **EXCLUSIONS**: Do not use if you don't fully understand the code's responsibility or if the "simpler" version is measurably slower in performance-critical paths.

## How It Works

1. **Understand Responsibility**: Identify what the code is responsible for and what its edge cases are.
2. **Scan for Signals**: Look for deep nesting, long functions, generic names, or redundant abstractions.
3. **Incremental Application**: Make one simplification at a time and verify with tests.
4. **Audit the Result**: Compare before and after; ensure the new version is genuinely easier to comprehend.

### The Five Principles

- **Principle 1**: Preserve Behavior exactly.
- **Principle 2**: Follow Project Conventions (ES6+, Svelte 5 runes).
- **Principle 3**: Prefer Clarity over clever shorthand.
- **Principle 4**: Maintain Balance (don't over-simplify or over-inline).
- **Principle 5**: Scope to what changed; avoid drive-by refactors.

## Usage

```bash
# Verify behavior preservation with the full test suite
npm test

# Check for complexity metrics
npm run audit:complexity
```

## Present Results

Present the simplified code alongside the original for comparison.

- **Evidence**: A clean diff showing reduced cognitive load and removed redundancy.
- **Validation**: Confirmation that all existing tests pass without modification.

## Common Rationalizations

| Agent Excuse                         | The Reality                                                     |
| :----------------------------------- | :-------------------------------------------------------------- |
| "A one-liner is simpler."            | A nested ternary is not simpler than a readable if/else block.  |
| "I'll refactor this unrelated file." | Stay focused on the current task scope to keep diffs clean.     |
| "The types make it clear."           | Types document structure, not intent. Use well-named variables. |

## Red Flags

- **Test Modifications**: If you have to change tests for your simplification to pass, you've changed behavior.
- **Removing Error Paths**: Weakening error handling to make the happy path look "cleaner".
- **Batching Changes**: Mixing many simplifications into one large, unverified commit.

## Troubleshooting

- **Logic Regression**: If behavior changes, revert and analyze which specific transform caused the drift.
- **Style Conflict**: If the simplification violates Rule 05 (Nomenclature), prioritize the project standard.

## Verification

- [ ] All existing tests pass without modification.
- [ ] Logic follows Rule 03 (Infrastructure) and Rule 05 (Nomenclature).
- [ ] No dead code (unused variables, reachable branches) left behind.
- [ ] **Hard Evidence Recorded**: A before/after code comparison proving improved readability.
