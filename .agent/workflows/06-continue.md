---
name: 06-continue
description: Resume Interrupted Work. Bypasses boot logic to pick up the baton.
risk: low
source: AI
date_added: 2024-03-29
---

# [/06-continue](./06-continue.md)

## Objectives: Resumption

- Identify the exact point of interruption from the log.
- Restore the active reasoning chain and task track.

## Context-Injection: Resumption Logic

- [Log Book](../project-management/log.md)
- [Mission Board](../project-management/mission-board.md)
- [Foundation](../rules/01-foundation.md)

## Capabilities: Continuation Logic

- **Baton Recovery**: Identify the `[/]` (In Progress) item in the log.
- **State Restoration**: Synchronize the current context with the last recorded step.

## Procedure

### Phase 1: Baton Discovery (Step 1.2: Order of Ops)

1. **Log Parsing**: Scan the [Log Book](../project-management/log.md) for the active track `[/]`. Identify the last successful action and the next pending step. [[Invoke: orchestration-tactics]](../skills/orchestration-tactics/)
2. **Track Integrity**: If multiple tracks are in progress, prioritize the one marked as the "active" baton.

### Phase 2: Reasoning Sync (Step 1.3: Prerequisites)

1. **Chain Restore**: Re-read the relevant implementation_plan.md and task.md artifacts. Ensure the mental model matches the recorded progress.
2. **Context Update**: If files were modified since the last turn, perform a quick re-audit to ensure zero drift. [[Invoke: Warden]](../skills/warden/)

### Phase 3: Resumption (Step 5: Execution)

1. **Signal**: State "Continuing from [Step X] of [Task Y]. Ready for execution."
2. **Action**: Resume work on the identified track as per the approved plan.

## Anti-Patterns

- **Duplicate Work**: Re-executing steps that are already marked as `[x]` in the log.
- **Context Loss**: Starting work without parsing the previous turn's concluding state.
- **Track Hijack**: Switching to a new task before concluding or stashing the current one.
