---
description: Rapid response protocol for fixing errors, hallucinations, or regressions.
---

# 03-bug-fix (The Medic)

> **Goal:** Diagnose, isolate, and repair defects without causing regressions.

## 1. Triggers

- **User Reporting**: "Something is broken", "Error in console".
- **Test Failure**: CI/CD failure.
- **Slash Command**: `/03-bug-fix`

## 2. Brain (Context Injection)

- **Source Code**: `src/**`
- **Tests**: `tests/**`
- **Logs**: Console output or error matrices.

## 3. Capabilities

- **Auditor**: Investigation, Reproduction, Root Cause Analysis.
- **Builder**: Patching, Regression Testing.

## 4. Procedures

### Phase 1: Triage & Reproduction (Auditor)

1.  **Isolate**: Identify the specific component or logic flow.
2.  **Reproduce**: Create a minimal reproduction case (or a failing test).
3.  **Classify**:
    - **Critical**: Blocks core functionality.
    - **Minor**: Cosmetic or edge case.

### Phase 2: Diagnosis

1.  **Trace**: Follow the execution path.
2.  **Hypothesize**: Use `sequentialthinking` if the cause is not obvious.
3.  **Plan**: Draft a quick fix strategy.

### Phase 3: Surgical Intervention (Builder)

1.  **Branch/Worktree** (Optional): If high risk, strictly isolate.
2.  **Patch**: Apply the fix.
    - **Constraint**: Minimal changes. Do not refactor unrelated code.
3.  **Verify**: Run the reproduction test. It must pass.

### Phase 4: Regression Check

1.  **Sweep**: Run related tests to ensure no side effects.
2.  **Clean**: Remove any temporary debug logs (`console.log`).

## 5. Anti-Patterns

- **Shotgun Debugging**: Randomly changing code hoping it works.
- **Scope Creep**: Refactoring a module while fixing a typo.
- **Ignoring Tests**: Fixing the bug but not adding a test case to prevent recurrence.

## 6. Tools

- `grep_search` (Locate error)
- `read_terminal` (Analyze logs)
- `run_command` (Run tests)
