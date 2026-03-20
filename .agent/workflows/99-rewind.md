---
name: 99-rewind
description: Emergency Stop. Abandon failed path and restore state.
disable-model-invocation: true
---

# 99-rewind (The Reset)

> **Goal:** Abandon toxic or hallucinated paths and restore environmental stability.

## 1. Triggers

- **Failure**: "This is a mess", "Back up".
- **Hallucination**: Agent is repetitively failing or stuck in a logic loop.
- **Slash Command**: [/99-rewind](./99-rewind.md)

## 2. Brain (Context Injection)

- **Rules**: [.agent/rules/01-foundation.md](../rules/01-foundation.md).
- **History**: Git commit logs and track checkpoints.

## 3. Procedures

### Phase 1: The Clarity Gate (Diagnosis)

1. **Halt**: Cease all current execution. Clearly state: "I am looping. Initiating Nope Protocol." [[Invoke: reflection]](../skills/reflection/SKILL.md)
2. **Trace**: Identify the exact origin of the invalid data or failed assumption. [[Invoke: reflection]](../skills/reflection/SKILL.md)

### Phase 2: Restoration

1. **Reset**: `git reset --hard` to the last Review SHA or `git restore .`. [[Invoke: project]](../skills/project/SKILL.md)
2. **Scrub**: `git clean -fd` to remove untracked debris. [[Invoke: devops]](../skills/devops/SKILL.md)

### Phase 3: The Quality Gate (Pivoting)

1. **Report**: Explain to the user _what_ broke and formulate a pivot strategy. [[Invoke: scribe]](../skills/scribe/SKILL.md)
2. **Approval**: Wait for user sign-off before re-entering `/01-plan`.

## 4. Anti-Patterns

- **Sunk Cost**: Continuing a failed path because "I'm almost there." (You aren't).
- **Silent Reset**: Deleting significant work-in-progress without informing the user.
- **Blind Restoration**: Restoring to a point that still contains the root cause of the failure.
