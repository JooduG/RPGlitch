---
description: Structured approach to abandoning failed paths, recovering from errors, and restoring state.
---

# 10-revert (The Undo)

> **Goal:** Safely halt incorrect momentum, abandon a failed strategy, and restore the repository to a known good state.

## 1. Triggers

- **Failed Review**: Code rejected at `06-review`.
- **Logic Dead End**: "This approach isn't working".
- **Looping**: "I am repeating myself".
- **Hallucination**: "That file doesn't exist".
- **Rule Violation**: "I violated the Prime Directive".
- **Slash Command**: `/10-revert`

## 2. Brain (Context Injection)

- **Git History**: `git log`
- **Status**: `git status`
- **Flags**: `.agent/skills/warden/flags.json` (Shame Debt).
- **Rules**: `.agent/rules/directives.md`.

## 3. Procedures

### Phase 0: The Halt (Recovery)

_Triggered by looping, hallucination, or rule violation._

1. **Stop**: Cease all generation. Do not "try harder" on the same path.
2. **Acknowledge**: State clearly: "I am looping/hallucinating. Initiating Recovery Protocol."
3. **Shame Management**:
    - Open `.agent/skills/warden/flags.json`.
    - Increment `"shame_debt_turns"` by **+1**.
    - Update `"last_violation_timestamp"`.

### Phase 1: Assessment

1. **Scope**: Identify the "Blast Radius".
    - Single file?
    - Entire component?
    - Full track?
2. **Decision**: **Surgical** (Soft) or **Nuclear** (Hard)?

### Phase 2: Execution

#### Option A: Surgical Revert (Soft)

_Use for minor regressions or single-file errors._

1. **Identify**: `git diff <file>`.
2. **Restore**: `git restore <file>` or `git checkout <commit> -- <file>`.
3. **Verify**: Run tests to ensure stability.

#### Option B: Nuclear Revert (Hard)

_Use for deep logic failures, hallucinations, or dead ends._

1. **Identify Anchor**: Find the last "Green State" SHA (usually a checkpoint).
2. **Execute**: `git reset --hard <SHA>`.
3. **Clean**: `git clean -fd` (Remove untracked artifacts).

### Phase 3: Post-Revert

1. **Hygiene**: Run `08-hygiene` to ensure no debris remains.
2. **Reframe**: What assumption was wrong? Propose a new strategy.
3. **Update Plan**: Record the failed attempt and new direction:
    - `[x] ~~Failed Attempt~~ <Reason>`
    - `[ ] New Strategy`
4. **Shame Redemption**: If recovery is successful, decrement `"shame_debt_turns"` by **-1** (Min 0). If 0, announce "Penance Lifted."

### Phase 4: Resume

- **Action**: Return to `03-implement` or `04-bug-fix` with the new plan.

## 4. Anti-Patterns

- **Trying Harder**: Doing the same thing again.
- **Partial Revert**: Leaving half the broken code in place.
- **Forgetting New Files**: Not cleaning untracked files (`git clean`).
- **No Lesson**: Reverting without documenting _why_ it failed.
- **Silent Fail**: Pretending it didn't happen.

## 5. Tools

- `run_command` (git)
- `write_to_file` (update markdown, flags.json)
