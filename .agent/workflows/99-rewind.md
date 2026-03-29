---
name: 99-rewind
description: Emergency Stop. Abandon failed path and restore state.
risk: low
source: AI
date_added: 2024-03-29
---

# [/99-rewind](./99-rewind.md) - Emergency Stop

## Objectives: Phase ERR - Recovery

- Revert the repository to the last known-good state.
- Cleanse the workspace of experimental artifacts or failed logic.

## Context-Injection: Recovery Strategy

- [Git History](../../package.json)
- [Foundation](../rules/01-foundation.md)
- [Warden](../skills/warden/)

## Capabilities: Restoration Sequence

- **State Reversion**: [git checkout -- .](../../package.json)
- **Log Reset**: Identify the last successful `[x]` entry in the log.
- **Warden Audit**: Perform a post-restoration hygiene check.

## Procedure

### Phase 1: Impact Analysis (Step 7: Circuit Breakers)

1. **Diagnosis**: Identify why the current path failed. Determine if it's an architectural conflict or a transient bug. [[Invoke: Warden]](../skills/warden/)
2. **Snapshot**: If the failure is complex, create a debug log before reverting.

### Phase 2: Restoration (Step 7: Rewind)

1. **Reversion**: Execute the appropriate git reset or checkout command to restore file state. [[Invoke: DevOps]](../skills/devops/)
2. **Artifact Purge**: Manually delete any scratch files or temporary directories.

### Phase 3: Post-Flight (Step 1: Re-Boot)

1. **Resync**: Execute [/00-boot](./00-boot.md) to re-synchronize the mental model with the restored reality.
2. **Plan Pivot**: If the path is abandoned, update the implementation plan to reflect the new direction.

## Anti-Patterns

- **Sunk Cost Fallacy**: Continuing to troubleshoot a fundamentally flawed path.
- **Partial Rewind**: Reverting files without resetting the corresponding log entries.
- **Panic Cleansing**: Deleting files before understanding the root cause of the failure.
