---
name: 04-review
description: Quality Gate & Triage. Audits work and organizes the next cycle.
---

# 04-review (The Vault)

> **Goal:** Final quality audit and backlog maintenance.

## 1. Triggers

- **Command**: "Finish task", "Ready for review".
- **Refactor Complete**: Moving from Build to Review.
- **Slash Command**: [/04-review](./04-review.md)

## 2. Brain (Context Injection)

- **Rules**: [.agent/rules/01-foundation.md](../rules/01-foundation.md).
- **Rules**: [.agent/rules/04-shield.md](../rules/04-shield.md).
- **State**: [.agent/state/tracks.md](../state/tracks.md) (Mission Board).

## 3. Procedures

### Phase 1: The Clarity Gate (Audit)

1. **Analysis**: Verify implementation against the original Blueprint and Success Criteria. [[Invoke: quality-assurance]](../skills/quality-assurance/SKILL.md)
2. **Standard Check**: Ensure code adheres to **Svelte 5 Runes** and **Chalk Regime** tokens. [[Invoke: svelte]](../skills/svelte/SKILL.md)

### Phase 2: Maintenance

1. **Archival**: If complete, move the track shards to [.agent/archive/](../archive/). [[Invoke: project]](../skills/project/SKILL.md)
2. **Triage**: Sort incoming issues and seed the next `/01-plan` cycle. [[Invoke: scribe]](../skills/scribe/SKILL.md)

### Phase 3: The Quality Gate (Checkpoint)

1. **Finalize**: Update [.agent/state/tracks.md](../state/tracks.md) with the latest stable SHA and verified status. [[Invoke: project]](../skills/project/SKILL.md)
2. **Report**: Walkthrough of changes and proof of verification. [[Invoke: scribe]](../skills/scribe/SKILL.md)

## 4. Anti-Patterns

- **Silent Done**: Marking tasks complete without providing an audit report or terminal evidence.
- **Fragmented Board**: Leaving stale or abandoned tracks on the mission board.
- **Logic Leak**: Committing untested edge cases to the Vault.
