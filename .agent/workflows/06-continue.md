---
name: 06-continue
description: Resume Interrupted Work. Bypasses boot logic to pick up the baton.
---

# 06-continue (The Relay)

> **Goal:** Pick up the active baton immediately after a pause or interruption.

## 1. Triggers

- **Resumption**: Start of a new turn in an existing track.
- **Command**: "Continue", "Next step".
- **Slash Command**: [/06-continue](./06-continue.md)

## 2. Brain (Context Injection)

- **Payload**: [.agent/state/next-prompt.md](../state/next-prompt.md).
- **Tracks**: [.agent/state/tracks.md](../state/tracks.md).

## 3. Procedures
1. **Peel**: Read [.agent/state/next-prompt.md](../state/next-prompt.md) for the immediate objective. [Invoke: `reflection`]

2. **Locate**: Identify the specific sub-task in the active [.agent/state/tracks/](../state/tracks/) shard. [Invoke: `project`]

3. **Transition**: Move directly to `/02-build` or `/01-plan` Phase 2.

## 4. Anti-Patterns

- **Start Over**: Re-analyzing the whole project when the objective is clear.
- **The Loop**: Stalling for instructions when `next-prompt.md` has the answer.
