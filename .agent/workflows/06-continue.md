---
description: Resume Interrupted Work. Bypasses boot logic to pick up the baton.
---

# [/06-continue](./06-continue.md) - The Resonator

> **Goal:** Resonate with the existing state and resume the narrative loop (Rule 01).

## 1. Triggers

- **Command**: "Continue", "Carry on", "Next step".
- **Slash Command**: [/06-continue](./06-continue.md)

## 2. Context Injection

- **Rules**: [Foundation](../rules/01-foundation.md).
- **Rules**: [Intelligence](../rules/05-intelligence.md).
- **State**: [.agent/project-management/next.md](../project-management/next.md).
- **State**: [.agent/project-management/log.md](../project-management/log.md).

## 3. Procedures

### Phase 1: Synchronization (Step 1)

1. **Read**: Load `next.md` to identify the current baton. [[Invoke: intake]](../skills/intake/SKILL.md)
2. **Audit**: Sanity check the last completed track in `log.md`. [[Invoke: orchestrator]](../skills/orchestrator/SKILL.md)
3. **Resonate**: Align with the current **Risk Routing** (Step 2.2).

### Phase 2: Execution (Step 5)

1. **Pick up**: Initialize the next pending sub-task in the active track shard.
2. **Forge**: Transition directly to [/02-build](./02-build.md) for logic fabrication.

### Phase 3: Persistence

1. **Log**: Document any immediate pivots or findings in the active shard.

## 4. Anti-Patterns

- **Cold Start**: Starting new features before completing the `next.md` baton.
- **Ghost Tasks**: Working on logic not documented in the mission board.
