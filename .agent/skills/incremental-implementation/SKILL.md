---
name: incremental-implementation
description: Delivers changes incrementally. Use when implementing any feature or change that touches more than one file. Use when you're about to write a large amount of code at once, or when a task feels too big to land in one step.
---

# Incremental Implementation

> "Build in thin vertical slices — implement one piece, test it, verify it, then expand. Each increment leaves the system in a working, testable state."

## Overview

The `incremental-implementation` skill enforces a discipline of small, manageable updates. In the RPGlitch Engine, feature complexity can quickly lead to compounding bugs if not broken down. This skill ensures that every multi-file change is delivered in verifiable "slices" that maintain engine integrity (Rule 03) and nomadic aesthetics (Rule 04) throughout the process.

### Strategic Context

- **Vertical Slicing**: Build a complete path (DB → API → UI) for a single sub-feature before moving to the next.
- **Contract-First**: Define interfaces and types before implementing logic to enable parallel coordination.
- **Risk-First**: Tackle the most uncertain or complex part of the task (e.g., state locking) in the first increment.

## When to Use

- **Positive Triggers**: Implementing multi-file features, architectural refactors, or any change involving more than 100 lines of code.
- **Complex Triggers**: When a task from `tasks/plan.md` involves high risk or deep technical dependencies.
- **EXCLUSIONS**: Do not use for trivial single-file tweaks (e.g., fixing a typo or updating a CSS token).

## How It Works

1. **Slice Definition**: Identify the smallest "unit of value" that can be built and tested.
2. **Slam & Verify Loop**: Implement the logic → Run tests → Verify build.
3. **Commit Save-Point**: Commit the successful increment using Conventional Commits (Rule 05).
4. **Scope Discipline**: Explicitly avoid touching code outside the current slice's requirements.

### Implementation Rules

- **Rule 0: Simplicity First**: Choose the path of least abstraction. Three lines of similar code are better than one premature abstraction.
- **Rule 1: One Thing at a Time**: Never mix formatting, refactors, and feature work in one increment.
- **Rule 3: Feature Flags**: Use environment flags to merge incomplete work without exposing it to the UI.
- **Rule 5: Rollback-Friendly**: Ensure every increment can be independently reverted without breaking the system.

## Usage

```bash
# Verify the current increment before committing
npm run verify

# If a slice fails, revert to the last save-point immediately
git reset --hard HEAD
```

## Present Results

Present the completed increment and its verification status.

- **Evidence**: A clean diff for the current slice and the successful test/build logs.
- **Validation**: Demonstrate that the new slice works end-to-end and has not introduced regressions.

## Common Rationalizations

| Agent Excuse                                | The Reality                                                                     |
| :------------------------------------------ | :------------------------------------------------------------------------------ |
| "I'll test it all at the end."              | Bugs compound rapidly. A flaw in Slice 1 invalidates Slices 2-5.                |
| "It's faster to do it in one pass."         | It feels faster until you spend 2 hours debugging 500 lines of unverified code. |
| "This refactor is small enough to include." | Mixed concerns make reviews harder and increase the risk of silent regressions. |

## Red Flags

- **Accumulated Debt**: Writing >100 lines without a test run or a commit.
- **Scope Creep**: Expanding the current slice to "fix things nearby" (Rule 0.5).
- **Broken Window**: Leaving the build or tests failing between increments.

## Troubleshooting

- **Contract Drift**: If the frontend and backend diverge, stop and re-define the API contract in a dedicated increment.
- **Integration Bloat**: If a slice feels too big, break it into even smaller sub-logical units (e.g., just the types/interfaces).

## Verification

- [ ] Each increment was independently verified (tests pass, build clean).
- [ ] No uncommitted changes remain after a slice is completed.
- [ ] Logic adheres to Rule 03 (Infrastructure) and Rule 05 (Nomenclature).
- [ ] **Hard Evidence Recorded**: A successful "Slice Complete" status in the Mission Board.
