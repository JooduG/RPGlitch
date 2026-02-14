---
description: Rapid response protocol for fixing errors, hallucinations, or regressions.
---

# 04-bug-fix (The Medic)

> **Goal:** Diagnose, isolate, and repair defects without causing regressions.

## 1. Triggers

- **User Reporting**: "Something is broken", "Error in console".
- **Test Failure**: CI/CD failure, `npm test` red.
- **Slash Command**: `/04-bug-fix`

## 2. Brain (Context Injection)

- **Source Code**: `src/**`
- **Tests**: `tests/**`
- **Logs**: Console output or error traces.

## 3. Procedures

### Phase 1: Triage & Reproduction

1. **Isolate**: Identify the specific component or logic flow.
2. **Reproduce**: Write a failing test that captures the defect.
    - **CRITICAL**: The test must fail before the fix is applied (Red Phase).
3. **Classify**:
    - **Critical**: Blocks core functionality. Fix immediately.
    - **Minor**: Cosmetic or edge case. Schedule.

### Phase 2: Diagnosis

1. **Trace**: Follow the execution path from symptom to root cause.
2. **Hypothesize**: Use `sequentialthinking` if the cause is not obvious.
3. **Plan**: Draft a minimal fix strategy. No refactoring.

### Phase 3: Surgical Intervention

1. **Patch**: Apply the fix.
    - **Constraint**: Minimal changes. Do not refactor unrelated code.
2. **Verify**: Run the reproduction test. It must pass (Green Phase).
3. **Max Retries**: If the fix fails twice, trigger `10-revert` and reassess.

### Phase 4: Regression Check

1. **Sweep**: Run the full test suite to ensure no side effects.
2. **Hygiene**: Remove any temporary debug code.
3. **Commit**: `gamemaster(fix): <description>`.

## 4. Anti-Patterns

- **Shotgun Debugging**: Randomly changing code hoping it works.
- **Scope Creep**: Refactoring a module while fixing a typo.
- **No Test**: Fixing the bug without adding a regression test.
- **Trying Harder**: Repeating the same failed approach.

## 5. Tools

- `grep_search` (Locate error)
- `read_terminal` (Analyze logs)
- `run_command` (Run tests)
- `sequentialthinking` (Complex diagnosis)
