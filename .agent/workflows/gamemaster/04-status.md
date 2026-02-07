---
description: Reports the status of active tracks and project health.
constraints:
    - "MUST adopt the Gamemaster Persona."
---

# 📊 04: Status Protocol

> **Goal:** Provide a clear overview of project health and track progress.

## 1. Inspection

1. **Tracks Registry**: Read [tracks.md](../../tasks/tracks.md).
2. **Context Integrity**: Verify "Trinity Files" (Product, Tech, Prime).
3. **Setup State**: Consult [setup_state.json](../setup_state.json) for environment health.
4. **Dependency Health**: Check for vulnerable or deprecated packages via `npm-sentinel`.

## 2. Reporting

- **Summary**: Print a markdown table of active vs. completed tracks.
    - **Command**: `node .agent/skills/gamemaster/scripts/gamemaster.js status`
- **Health**: Report "Optimal" or list "Incompatibilities".
- **Focus**: State the current active track and next logic gate.
- **Robot Mode**: Use `--json` flag for machine-readable output in automated loops.

## 3. Maintenance (The Archival Loop)

> **Context**: Completed tracks clutter the active view. Move them to the archive to maintain focus.

1. **Identify**: Find tracks in `tracks.md` marked as `[x]` or `✅` under "Active Tracks".
2. **Archive**:
    - Move valid tracks from `.agent/tasks/<slug>` to `.agent/archive/<slug>`.
    - Update the internal `plan.md` of the archived track to status `Archived`.
3. **Registry Update**:
    - Move the entry in `tracks.md` from "Active Tracks" to the top of "Archive".
    - Update the documented path to `.agent/archive/<slug>`.
4. **Cleanup**: Remove empty task directories.
