---
name: 00-boot
description: Fresh Session Initialization. Syncs context and mental model.
---

# 00-boot (The Entry)

> **Goal:** Synchronize the mental model with reality before touching code.

## 1. Triggers

- **New Session**: Start of a conversation.
- **Wake Up**: "Hello", "Status check".
- **Slash Command**: [/00-boot](./00-boot.md)

## 2. Brain (Context Injection)

- **Rules**: [.agent/rules/01-foundation.md](../rules/01-foundation.md).
- **Rules**: [.agent/rules/03-technetium.md](../rules/03-technetium.md).
- **State**: [.agent/state/tracks.md](../state/tracks.md) (Mission Board).
- **State**: [.agent/state/global.md](../state/global.md).

## 3. Procedures

### Phase 1: The Clarity Gate (Intake)

1. **Intake**: Read [.agent/state/global.md](../state/global.md) and [.agent/state/tracks.md](../state/tracks.md). [[Invoke: project]](../skills/project/SKILL.md)
2. **Validation**: Ensure the Mission Board is not corrupted and contains valid Markdown. [[Invoke: reflection]](../skills/reflection/SKILL.md)

### Phase 2: Registry

1. **Registry**: Identify any active track `[/]` or pending tasks `[ ]` in [.agent/state/tracks.md](../state/tracks.md). [[Invoke: reflection]](../skills/reflection/SKILL.md)

### Phase 3: The Quality Gate (Reporting)

1. **Audit**: Verify project health and identify any immediate hygiene anomalies. [[Invoke: quality-assurance]](../skills/quality-assurance/SKILL.md)
2. **Report**: State current mission and ready status. "Boot complete. Resonant with Global State."

## 4. Anti-Patterns

- **Blind Boot**: Starting work without reading the Mission Board.
- **Amnesia**: Forgetting where the last session ended.
- **Path Drift**: Using absolute drive letters instead of relative `.agent/` paths.
