---
name: 06-continue
description: Resume Interrupted Work. Bypasses boot logic to pick up the baton.
---

# 06-continue (The Relay)

> **Goal:** Pick up the active baton immediately after a pause or interruption.

## 1. Triggers

- **Resumption**: Start of a new turn in an existing track.
- **Interruption**: Re-syncing after a system timeout or crash.
- **Slash Command**: [/06-continue](./06-continue.md)

## 2. Brain (Context Injection)

- **Payload**: [.agent/state/next-prompt.md](../state/next-prompt.md).
- **Tracks**: [.agent/state/tracks.md](../state/tracks.md).
- **Reference**: [.agent/rules/01-foundation.md](../rules/01-foundation.md).

## 3. Procedures

### Phase 1: The Clarity Gate (Peel)

1. **Intake**: Read [.agent/state/next-prompt.md](../state/next-prompt.md) for the immediate target objective. [[Invoke: reflection]](../skills/reflection/SKILL.md)
2. **Identification**: Locate the specific sub-task in the active [.agent/state/tracks/](../state/tracks/) task shard. [[Invoke: project]](../skills/project/SKILL.md)

### Phase 2: Resonance

1. **Alignment**: Cross-reference the payload with the current file system state. [[Invoke: project]](../skills/project/SKILL.md)
2. **Transition**: Move directly to `/02-build` Phase 1 or `/01-plan` Phase 2 depending on the payload status.

### Phase 3: The Quality Gate (Reporting)

1. **Status**: Briefly report the current position and intended next action. "Relay active. Resuming from [Checkpoint]."

## 4. Anti-Patterns

- **Start Over**: Re-analyzing the whole project when the payload objective is provided.
- **The Loop**: Stalling for instructions when `next-prompt.md` contains the baton.
- **Phantom Baton**: Resuming work without verifying the state of the active shard.
