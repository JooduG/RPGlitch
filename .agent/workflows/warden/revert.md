---
description: Nuclear Revert Protocol. Interactively identifies and rolls back failed initiatives with git precision.
---

# 🔙 /05-revert

> **Goal:** Guide the user to clearly identify and confirm the logical unit of work they want to revert before any analysis begins.

## 1. Selection Phase (Interactive)

1.  **Check for Target**: Check if a target slug was provided.
2.  **Interactive Menu**: If no target, present a hierarchical menu:
    - **In-Progress**: All Tracks/Phases/Tasks marked `[/]`.
    - **Recent**: The 3-5 most recently completed `[x]` items.
3.  **Confirmation**: Ask: "You asked to revert [Track/Phase/Task]: '[Description]'. Is this correct?"

## 2. The Penance (Warden)

1.  **Failure Audit**: Analyze WHY the revert is necessary (Sloppy logic, broken claim, or context drift).
2.  **Sticker**: If the revert is due to a "false success claim", trigger `python .agent/skills/warden/scripts/sticker.py` to record the penance.

## 3. Execution Phase (Nuclear Precision)

1.  **Identify Boundary**: Find the Git commit SHA for the last stable checkpoint (from `plan.md` or git log).
2.  **Reconcile**:
    - **Soft**: Revert specific files while keeping the task folder for debrief.
    - **Hard**: Nuclear wipe of the task directory and registry entry.
3.  **Command**: `git reset --hard <checkpoint_sha>` or `git checkout <sha> -- <paths>`.

## 4. Verification & Debrief

1.  **Purge**: Run [Clean Protocol](../warden/clean.md) to ensure no artifacts remain.
2.  **Audit**: Run [Audit Protocol](../warden/audit.md) to ensure the baseline is stable.
3.  **Post-Mortem**: Add a single sentence to [tracks.md](../../tasks/tracks.md) explaining the reversal.
4.  **Signal**: "The timeline has been scrubbed. Resonance restored."
