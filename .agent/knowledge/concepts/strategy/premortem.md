---
trigger: manual
description: Strategy concepts for avoiding project failure modes.
Context: [Project]
---

# 📜 Legacy Premortem (Speculative)

> [!WARNING]
> **EXPERIMENTAL CONTEXT**
> The following content is strictly **theoretical**. It represents speculative ideas and concepts that are NOT yet part of the project's implemented reality (Canon).
> Do NOT implement these concepts or treat them as project truth unless specifically directed by the user or an implementation task.

**Domain:** project / strategy
**Red Thread:** Identifying failure points before they manifest.

## 1. The Core Fear

"The engine becomes a complex spreadsheet rather than a storytelling tool."

## 2. Potential Failure Nodes

### A. The "Pillar Leak"

- **Risk:** Logic bleeds into the UI (Artificer).
- **Consequence:** The system becomes un-testable and fragile.
- **Mitigation:** Strict enforcement of the [Standards](../../../rules/standards.md) and separation of concerns.

### B. The "Ghost World"

- **Risk:** The AI generates beautiful prose that doesn't update the state.
- **Consequence:** Narrative dissonance; the user feels their choices don't matter.
- **Mitigation:** Ensure all "Impact" text is tied to a [GameMaster] tick.

### C. Resource Exhaustion

- **Risk:** The PWA bundle exceeds the 350KB limit of the Perchance platform.
- **Consequence:** The app fails to load or experiences severe lag.
- **Mitigation:** Mandatory [Optimization](../../../skills/devops/knowledge/optimization.md) audits.

## 3. The "Silent Death"

If the engine feels "generic," it has failed. We must prioritize atmospheric depth over mechanical complexity if a choice must be made.
