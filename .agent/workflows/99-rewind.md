---
description: Emergency Stop. Abandon failed path and restore state.
disable-model-invocation: true
---

# [/99-rewind](./99-rewind.md) - The Reset

> **Goal:** Abandon toxic/hallucinated paths and restore environmental stability (Rule 01).

## 1. Triggers

- **Failure**: "This is a mess", "Back up", "Looping".
- **Hallucination**: Agent is repetitively failing or stuck.
- **Slash Command**: [/99-rewind](./99-rewind.md)

## 2. Context Injection

- **Rules**: [Foundation](../rules/01-foundation.md).
- **Rules**: [Intelligence](../rules/05-intelligence.md).
- **History**: Git commit logs and track checkpoints.

## 3. Procedures

### Phase 1: The Clarity Gate (Diagnosis)

1. **Halt**: Cease all execution. State: "I am looping. Initiating Rewind Protocol." [[Invoke: directives]](../skills/directives/SKILL.md)
2. **Trace**: Identify the origin of the invalid data or failed assumption. [[Invoke: orchestrator]](../skills/orchestrator/SKILL.md)

### Phase 2: Restoration

1. **Reset**: `git reset --hard` to the last stable checkpoint. [[Invoke: devops]](../skills/devops/SKILL.md)
2. **Scrub**: `git clean -fd` to remove untracked debris.

### Phase 3: The Quality Gate (Pivoting)

1. **Report**: Explain _what_ broke and formulate a pivot strategy. [[Invoke: orchestrator]](../skills/orchestrator/SKILL.md)
2. **Approval**: Wait for user sign-off before re-entering [/01-plan](./01-plan.md).

## 4. Anti-Patterns

- **Sunk Cost**: Continuing a failed path instead of rewinding.
- **Silent Reset**: Deleting work without informing the user.
