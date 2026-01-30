---
description: Reports the status of active tracks and project health.
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
- **Health**: Report "Optimal" or list "Incompatibilities".
- **Focus**: State the current active track and next logic gate.
