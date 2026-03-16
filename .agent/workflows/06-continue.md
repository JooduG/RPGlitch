---
name: 06-continue
description: Recovery Protocol. Resumes work after an unexpected interruption.
---

# 06-continue (The Recovery Protocol)

> **Goal:** Restore state and resume momentum after an unplanned disconnect or crash.

## 1. Triggers

- **Interruption**: Resuming after a network error, crash, or session expiration.
- **Lost Context**: "I was disconnected", "Where were we?".

## 2. Brain (Recovery Shard)

- **Global Context**: `.agent/state/global.md`
- **Track Status**: `.agent/state/tracks.md`
- **Last Payload**: `.agent/state/next-prompt.md`

## 3. Procedures

### Phase 1: Integrity Check

1.  **Read Shards**: Load all files in `.agent/state/`.
2.  **Audit Filesystem**: Run `ls -R src/` and `git status` to see what actually changed.
3.  **Conflict Resolution**: If the code looks more advanced than the track in `tracks.md`, trust the code. Update the track to match reality.

### Phase 2: State Restoration

1.  **Re-Hydrate**: Re-read the `implementation_plan.md` (or equivalent track file).
2.  **Locate Cursor**: Identify the exact sub-item that was in progress.
3.  **Verify Integrity**: Run `npm run verify` to ensure the build isn't broken.

### Phase 3: Resumption

1.  **Announce**: State: "Disconnected detected. State recovered from .agent/state. Resuming [Track] at [Task]."
2.  **Execute**: Continue from the recovery point.

## 4. Anti-Patterns

- **Starting Blind**: Ignoring `.agent/state/` and asking the user what to do next.
- **Ghost Resumption**: Resuming a task that was already finished or partially corrupted.
- **Bypassing Verification**: Not running `npm run verify` before coding.
