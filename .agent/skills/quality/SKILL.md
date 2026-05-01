---
name: quality
description: Conducts multi-axis code review and simplification. Use before merging any change to ensure correctness, readability, and architectural purity.
---

# Code Quality & Review

> "Accept no exceptions. Every change must improve the overall health of the engine. Simplify without changing behavior."

## Overview

The `quality` skill is the final filter before code enters the main branch. it evaluates modifications across five axes: correctness, readability, architecture, security, and performance. It also focuses on refining working code into its most elegant and maintainable form.

### The Five-Axis Review

1. **Correctness**: Logic matches spec and handles edge cases.
2. **Readability**: Descriptive naming and straightforward control flow.
3. **Architecture**: Fits established patterns (Rule 03, Rule 05).
4. **Security**: Sanitization (Rule 06) and secret protection.
5. **Performance**: Zero layout thrashing (CLS) or N+1 queries.

## How It Works

### 1. Code Review

- **Incremental Application**: Review ~100 line chunks.
- **Categorization**: Label feedback as Critical, Nit, or FYI.
- **The Rule of 500**: If refactoring touches > 500 lines, use automation (codemods) instead of manual edits.

### 2. Code Simplification (The Framework)

- **Chesterton's Fence**: Understand WHY code exists before touching it. Check git blame and edge cases.
- **Preserve Behavior**: Never change what the code _does_, only how it _expresses_ it. Verify via tests.
- **Clarity > Cleverness**: Prefer explicit logic over clever shorthand.
- **Simplification Signals**:
  - Deep nesting (3+ levels).
  - Long functions (50+ lines).
  - Boolean parameter flags (replace with options objects).
  - Generic names (`data`, `result`) vs descriptive ones.

### 3. Separation of Concerns
Submit refactoring changes separately from feature or bug fix changes. A PR that refactors and adds a feature should be split.

## Usage

```bash
# Run a comprehensive quality audit
npm run audit:quality
```

## Verification Checklist

- [ ] All "Critical" review issues are resolved.
- [ ] Every boundary has a typed contract and sanitization.
- [ ] Simplifications preserved exact behavior (verified via tests).
- [ ] No dead code left behind.
