---
description: Structured approach to abandoning failed paths and restoring state.
---

# 06-revert (The Undo)

> **Goal:** Safely abandon a failed strategy and restore the repository to a known good state.

## 1. Triggers

- **Failed Review**: Code rejected at `05-review`.
- **Logic Dead End**: "This approach isn't working".
- **Hallucination**: "I messed up".
- **Slash Command**: `/06-revert`

## 2. Brain (Context Injection)

- **Git History**: `git log`
- **Status**: `git status`

## 3. Capabilities

- **Warden**: Safety checks, State restoration.

## 4. Procedures

### Phase 1: Assessment (Architect)

1.  **Scope**: Identification of the "Blast Radius".
    - Single file?
    - Entire component?
    - Full track?
2.  **Decision**: **Surgical** (Soft) or **Nuclear** (Harvest)?

### Phase 2: Execution

#### Option A: Surgical Revert (Soft)

_Use for minor regressions or single-file errors._

1.  **Identify**: `git diff <file>`.
2.  **Restore**: `git restore <file>` or `git checkout <commit> -- <file>`.
3.  **Verify**: Run tests to ensure stability.

#### Option B: Nuclear Revert (Hard)

_Use for deep logic failures, hallucinations, or dead ends._

1.  **Identify Anchor**: Find the last "Green State" SHA (usually a checkpoint).
2.  **Execute**: `git reset --hard <SHA>`.
3.  **Clean**: `git clean -fd` (Remove untracked artifacts).

### Phase 3: Post-Revert (Auditor)

1.  **Hygiene**: Run `07-hygiene.md` to ensure no debris remains.
2.  **Reflect**: Update `task.md` or `plan.md` with:
    - [x] Failed Attempt <Reason>
    - [ ] New Strategy

## 5. Anti-Patterns

- **Partial Revert**: Leaving half the broken code in place.
- **Forgetting New Files**: Not cleaning untracked files (`git clean`).
- **No Lesson**: Revering without documenting _why_ it failed.

## 6. Tools

- `run_command` (git)
- `write_to_file` (log failure)
