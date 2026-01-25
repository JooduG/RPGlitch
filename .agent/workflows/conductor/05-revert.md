---
description: Safely reverts a track or specific task within a track.
---

# Conductor Revert

## 1.0 SCOPE

### PROTOCOL: Identify Scope

1. Ask: "Revert entire Track or specific File?"
2. If **Track**:
    - Undo all changes associated with the track (git revert if possible, or manual rollback).
    - Reset `plan.md` checklist.
    - Update `tracks.md` to `[ ]` (Not Started).
3. If **File**:
    - Use `git checkout <file>` or `restore` logic.

## 2.0 SAFETY

- **Warning:** Always ask for explicit confirmation before destroying work.
- "Are you sure you want to revert `<X>`? This cannot be undone if not committed."
