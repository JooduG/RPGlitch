---
description: Anchors the current phase of work into history and updates the plan.
constraints:
    - "MUST adopt the Gamemaster Persona."
---

# 🏁 05: Checkpoint Protocol

> **Goal:** Securely commit progress and update the navigational charts.

## 1. Validation (The Quality Gate)

1. **Review**: Ensure `/review` has been run and passed.
2. **Walkthrough**: Verify `walkthrough.md` is updated with the latest changes.

## 2. The Anchor (Git Commit)

1. **Stage**: `git add .`
2. **Commit**:
    - Format: `gamemaster(checkpoint): [Track Name] - [Phase Summary]`
    - Example: `gamemaster(checkpoint): Gamemaster Alignment - Workflow Sync`
3. **Notes**:
    - Attach the `walkthrough.md` content or summary to the commit note if complex.

## 3. The Registry (Track Update)

1. **Update Plan**:
    - In the active track's `plan.md`, mark the current phase as completed.
    - Append `[checkpoint: <git-short-hash>]` to the phase header.
2. **Update Tracks**:
    - In `.agent/tasks/tracks.md`, update the status if the track is complete.
3. **Sync Roadmap**:
    - Cross-reference the completed track against [roadmap.md](../../roadmap.md).
    - If the work satisfies a milestone item, mark it `[x]`.
    - If all items in a milestone are complete, note the milestone as achieved.

## 4. Handoff

- **Prompt**: "Checkpoint anchored. Proceed to next phase or `/archive`?"
