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

- **Vision**: [.agent/knowledge/atlas/01-vision.md](../knowledge/atlas/01-vision.md).
- **Validation**: [.agent/rules/05-validation.md](../rules/05-validation.md).

## 3. Procedures
1. **Audit**: Verify implementation against the original Blueprint and Success Criteria. [Invoke: `quality-assurance`]

2. **Archival**: If complete, move the track shards to [.agent/archive/](../archive/). [Invoke: `project`]

3. **Triage**: Sort incoming issues and seed the next `/01-plan` cycle.

4. **Checkpoint**: Update [.agent/state/tracks.md](../state/tracks.md) with the latest stable SHA.

## 4. Anti-Patterns

- **Silent Done**: Marking tasks complete without an audit report.
- **Fragmented Board**: Leaving stale/abandoned tracks on the board.
