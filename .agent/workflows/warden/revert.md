---
description: Defensive Protocol. Reverts changes with nuclear precision and records failure.
---

# 🔙 Revert Protocol

> **Goal:** Safe rollback of failed initiatives while recording the tactical retreat.

## 1. The Penance

1. **Failure Audit**: If a revert is required due to sloppy logic or a "broken fix" previously claimed as working.
2. **Execute**: `python .agent/skills/warden/scripts/sticker.py`.

## 2. Rolling Back

1. **Track Reversal**:
    - **Action**: Delete the task directory in `.agent/tasks/`.
    - **Reset**: Return the registry entry in [tracks.md](../../tasks/tracks.md) to `⭕ Scoped` or remove it.
2. **Source Restoration**:
    - Revert all modified files to their previous stable state via `HEAD`.

## 3. Verification of Purity

1. **Purge**: Run [Clean Protocol](./clean.md) to ensure no artifacts remain.
2. **Audit**: Run [Audit Protocol](./audit.md) to ensure the baseline is secure.

## 4. Debrief

- **Analyze**: State WHY the revert was necessary.
- **Prompt**: "The timeline has been scrubbed. Resonance restored."
