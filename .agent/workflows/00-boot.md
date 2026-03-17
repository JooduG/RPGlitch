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

- **Mission Board**: [.agent/state/tracks.md](../state/tracks.md).
- **Global Context**: [.agent/state/global.md](../state/global.md).
- **Rules**: [.agent/rules/01-foundation.md](../rules/01-foundation.md).

## 3. Procedures

1. **Intake**: Read [.agent/state/global.md](../state/global.md) and [.agent/state/tracks.md](../state/tracks.md). [[Invoke: project]](../skills/project/SKILL.md)
2. **Registry**: Identify any active track `[/]` or pending tasks `[ ]` in [.agent/state/tracks.md](../state/tracks.md). [[Invoke: reflection]](../skills/reflection/SKILL.md)
3. **Report**: State current mission and ready status. "Boot complete. Resonant with Global State."

## 4. Anti-Patterns

- **Guessing**: Starting work without reading the state files.
- **Amnesia**: Forgetting where the last session ended.
