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

### 2. Code Simplification

- **Preserve Behavior**: Never change what the code _does_, only how it _expresses_ it.
- **Clarity > Cleverness**: Prefer explicit logic over "clever" shorthand.

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
