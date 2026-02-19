---
description: Diagnosis and repair. Fixes bugs and ensures code hygiene.
---

# 03-clean (The Clinic)

> **Goal:** Review, Repair, and Sterilize. The separation of "Making" and "Fixing".

## 1. Triggers

- **Error**: "Something broke", "Test failed".
- **Hygiene**: "Lint error", "Messy code".
- **Pre-Flight**: Before `04-review` (Checkpoint).
- **Slash Command**: `/03-clean`

## 2. Brain (Context Injection)

- **Logs**: Terminal output / error stack.
- **Lint**: `eslint.config.js`.
- **Tests**: `tests/**`.

## 3. Procedures

### Phase 1: Triage

1.  **Classify**:
    - **Infection** (Bug): Logic error, crash. -> **Go to Phase 2**.
    - **Dust** (Hygiene): Lint, formatting, unused code. -> **Go to Phase 3**.

### Phase 2: Surgery (Bug Fix)

1.  **Reproduce**: Write a failing test (Red).
2.  **Diagnose**: Trace root cause. Use `waldzell-clear-thought` / `metacognitiveMonitoring` for complex tracing.
3.  **Patch**: Minimal intervention. Fix the bug, don't rewrite the system.
4.  **Verify**: Run test (Green).

### Phase 3: Sterilization (Hygiene)

1.  **Scan**: `grep_search` for `console.log`, `TODO`, `FIXME`.
2.  **Lint**: `npm run lint`. Fix all warnings.
3.  **Prune**: Remove dead files/imports.

### Phase 4: Discharge

1.  **Verify**: Run full suite to ensure no side effects.
2.  **Commit**: `gamemaster(fix|chore): <description>`.

## 4. Anti-Patterns

- **Shotgun Surgery**: Randomly changing code hoping it works.
- **Distracted Doctor**: Refactoring a module while fixing a typo.
- **Dirty Hands**: Leaving `console.log` in production.

## 5. Tools

- `grep_search` (Locate issues)
- `run_command` (Lint/Test)
