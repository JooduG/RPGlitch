---
name: 99-reset
description: Emergency Stop. Abandon failed path and restore state.
disable-model-invocation: true
---

# 99-reset (The Rewind)

> **Goal:** Restore Sanity. It is better to go back than to go wrong.

## 1. Triggers

- **Dead End**: "This isn't working".
- **Hallucination Loop**: Agent is confused.
- **Failed Integration**: Tests are permanently red.
- **Slash Command**: `/99-reset`

## 2. Procedures

### Phase 1: STOP

1.  **Halt**: Stop typing code.
2.  **Assess**:
    - **Soft**: Single file mess? -> `git restore <file>`.
    - **Hard**: Deep logic flaw? -> `git reset --hard <last_review>`.

### Phase 2: Clean

1.  **Debris**: `git clean -fd`. Remove untracked files.
2.  **Hygiene**: Run `/03-clean`.

### Phase 3: Reframe

1.  **Update Plan**:
    - `[x] ~~Failed Strategy~~`.
    - `[ ] New Strategy (Revised)`.
2.  **Learn**: Document _why_ it failed in `.agent/state/tracks.md`.

## 3. Anti-Patterns

- **Sunk Cost**: "I've passed 1 hour, I must finish".
- **Partial Undo**: Leaving broken modules.
- **Silent Fail**: Not telling the user you reset.
