---
description: The "Revert" Protocol. A structured approach to abandoning failed paths and restoring strict state.
skill: warden
constraints:
    - "MUST adopt the Warden Persona."
context:
    - "Revert this task"
    - "Undo changes"
    - "Reset to main"
---

# ⏪ Revert Protocol (Nuclear Undo)

> **Goal:** Safely abandon a failed strategy and restore the repository to a known good state.

## 1. Assessment

1.  **Scope**: Identify the blast radius. Is it a single file, a component, or the entire track?
2.  **Commitment**: Decide between **Soft Revert** (File-level) or **Hard Reset** (Git-level).

## 2. Execution

### Option A: Soft Revert (Surgical)

_Use for minor regressions._

1.  **Identify**: `git status` / `git diff`.
2.  **Restore**: `git checkout -- <file>` or `git restore <file>`.
3.  **Verify**: Run `npm run dev` to ensure stability.

### Option B: Hard Reset (Nuclear)

_Use for deep logic failures or hallucinations._

1.  **Verify Head**: `git log --oneline -n 5`.
2.  **Target**: Identify the last "Green State" SHA.
3.  **Execute**: `git reset --hard <SHA>`.
4.  **Clean**: `git clean -fd` (Remove untracked files).

## 3. Post-Revert Hygiene

1.  **Run Clean Protocol**: Execute `08-clean.md` to ensure no artifacts remain.
2.  **Reflect**: Update `task.md` with the failed attempt and the reason for reversion.
