---
name: 99-rewind
description: Emergency Stop. Abandon failed path and restore state.
disable-model-invocation: true
---

# 99-rewind (The Reset)

> **Goal:** Abandon toxic or hallucinated paths.

## 1. Triggers
- **Failure**: "This is a mess", "Back up".
- **Hallucination**: Agent is repetitively failing.
- **Slash Command**: [/99-rewind](./99-rewind.md)

## 2. Procedures
1. **Reset**: `git reset --hard` to the last Review SHA or `git restore .`. [Invoke: `project`]
2. **Scrub**: `git clean -fd` to remove untracked debris.
3. **Reframer**: Explain clearly to the user *what* broke and *how* we will pivot.

## 3. Anti-Patterns

- **Sunk Cost**: "I'm almost there" (You aren't).
- **Silent Reset**: Deleting work without informing the user.
