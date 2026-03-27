---
description: Fresh Session Initialization. Syncs context and mental model.
---

# [/00-boot](./00-boot.md) - The Entry

> **Goal:** Synchronize the mental model with reality before touching code.

## 1. Triggers

- **New Session**: Start of a conversation.
- **Wake Up**: "Hello", "Status check".
- **Slash Command**: [/00-boot](./00-boot.md)

## 2. Context Injection

- **Rules**: [Foundation](../rules/01-foundation.md).
- **Rules**: [Infrastructure](../rules/03-infrastructure.md).
- **State**: [Track Log](../project-management/track-log.md).
- **State**: [Mission Board](../project-management/mission-board.md).
- **State**: [Next](../project-management/next.md).

## 3. Procedures

### Phase 1: The Clarity Gate

1. **Intake**: Read [Mission Board](../project-management/mission-board.md), [Track Log](../project-management/track-log.md), and [Next](../project-management/next.md). [[Invoke: Intent Crucible]](../skills/intent-crucible/SKILL.md)
2. **Environment Verification**: Explicitly confirm the target environment (Perchance sandboxed runtime) and reactivity standard (Svelte 5 Runes).
3. **Validation**: Ensure the Mission Board is not corrupted and contains valid Markdown. Do not advance until the state matrix is fully parsed. [[Invoke: Project Manager]](../skills/project-manager/SKILL.md)

### Phase 2: Registry

1. **Registry**: Identify any active track `[/]` or pending tasks `[ ]` in [Track Log](../project-management/track-log.md). [[Invoke: Project Manager]](../skills/project-manager/SKILL.md)

### Phase 3: The Quality Gate

1. **Audit**: Verify project health and identify any immediate hygiene anomalies. [[Invoke: Warden]](../skills/warden/SKILL.md)
2. **Report**: State current mission, environment acknowledgment (Perchance/Svelte 5), and ready status. "Boot complete. Resonant with Global State."

## 4. Anti-Patterns

- **Blind Boot**: Starting work without reading the Mission Board.
- **Amnesia**: Forgetting where the last session ended or failing to parse the full state matrix.
- **Path Drift**: Using absolute drive letters instead of relative `.agent/` paths.
