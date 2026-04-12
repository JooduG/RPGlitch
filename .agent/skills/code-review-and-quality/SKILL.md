---
name: code-review-and-quality
description: Conducts multi-axis code review. Use before merging any change. Use when reviewing code written by yourself, another agent, or a human. Use when you need to assess code quality across multiple dimensions before it enters the main branch.
---

# Code Review and Quality

> "Multi-dimensional code review is the quality gate for every change. Accept no exceptions."

## Overview

The `code-review-and-quality` skill ensures that every modification to the RPGlitch Engine improves overall code health. It evaluates changes across five primary axes: correctness, readability, architecture, security, and performance. The goal is continuous improvement and adherence to established project patterns.

### The Five-Axis Review

1. **Correctness**: Does the logic match the spec and handle all edge cases?
2. **Readability**: Is the name descriptive? Is the control flow straightforward?
3. **Architecture**: Does the change fit established design patterns (Rule 03, Rule 05)?
4. **Security**: Is input sanitized (Rule 06)? Are secrets protected?
5. **Performance**: Are there N+1 queries or layout thrashing (CLS)?

## When to Use

- **Positive Triggers**: Before merging any task, after feature implementation, or when reviewing code from other agents.
- **Refactoring Triggers**: When simplifying modules or migrating patterns.
- **EXCLUSIONS**: Do not use for initial brainstorming or exploratory research; use `idea-refine` instead.

## How It Works

1. **Understand Context**: Review the original intent and the accepted implementation plan.
2. **Test Review**: Verify that the tests cover behavior, not just happy-path implementation.
3. **Implementation Walkthrough**: Audit each file against the five axes.
4. **Finding Categorization**: Label feedback by severity (Critical, Nit, Optional, FYI).
5. **Verification Audit**: Confirm that the build passes and manual verification (screenshots/logs) is documented.

### Change Sizing

Maintain reviewable chunks:

- **Good**: ~100 lines.
- **Warning**: >300 lines (requires strong justification).
- **Split Required**: >1000 lines.

### Dead Code Hygiene

Always check for orphaned methods, constants, or components after refactoring. Explicitly confirm before deletion.

## Usage

```bash
# Run a comprehensive code quality audit
npm run audit:quality

# Check for dead code and unused dependencies
npm run audit:hygiene
```

## Present Results

Present the review findings and the final verdict.

- **Evidence**: Categorized feedback list and a link to the reviewed PR or file.
- **Validation**: Confirmation that all "Critical" and "Important" issues have been addressed.

## Common Rationalizations

| Agent Excuse               | The Reality                                                      |
| :------------------------- | :--------------------------------------------------------------- |
| "It works; that's enough." | Working code can be insecure or unmaintainable. Review the axes. |
| "The tests pass."          | Tests don't catch architectural flaws or poor naming.            |
| "I'll clean it up later."  | Later never comes. Require cleanup before submission.            |

## Red Flags

- **Rubber-Stamping**: Approving code without providing specific feedback or evidence of review.
- **Ignoring Warnings**: Merging code that has lint errors or type warnings.
- **Massive Refactors**: Mixing feature work with large architectural shifts in a single change.

## Troubleshooting

- **Review Deadlock**: If there's a disagreement, defer to технически data, style guides, and engineering principles.
- **Inconsistent Feedback**: Use a standardized checklist to ensure every review covers all axes.

## Verification

- [ ] All "Critical" issues are resolved.
- [ ] Every boundary has a typed contract and sanitization (Rule 06).
- [ ] Final implementation matches the approved plan.
- [ ] **Hard Evidence Recorded**: A completed review checklist and pass logs from `npm run lint`.
