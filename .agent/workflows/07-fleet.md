---
name: 07-fleet
description: Orchestration & Sync. Coordinates the multi-agent fleet and swarm sub-routines.
---

# 07-fleet (The Commander)

> **Goal:** Propagate core changes, dispatch specialized AI sub-routines, and coordinate the swarm.

## 1. Triggers

- **Core Update**: Significant changes to `DynamicsEngine` or `IntelligenceKernel`.
- **Swarm Dispatch**: A task exceeds standard context windows and requires sub-agent delegation.
- **Dispatch**: Explicit request to trigger a fleet scan or cross-repo update.
- **Slash Command**: [/07-fleet](./07-fleet.md)

## 2. Brain (Context Injection)

- **Fleet Ops**: [../../.github/workflows/ai-fleet-dispatch.yml](../../.github/workflows/ai-fleet-dispatch.yml).
- **Swarm Merge**: [.agent/state/task_merge_workflows.md](../state/task_merge_workflows.md).
- **Rules**: [.agent/rules/01-foundation.md](../rules/01-foundation.md).
- **Rules**: [.agent/rules/04-shield.md](../rules/04-shield.md).

## 3. Procedures

### Phase 1: The Clarity Gate (Mapping)

1. **Analysis (External)**: Identify which child repositories are affected by the current core logic change. [[Invoke: reflection]](../skills/reflection/SKILL.md)
2. **Analysis (Internal/Swarm)**: If a task exceeds context limits, define precise scope and boundaries for sub-routine dispatch (e.g., `codebase_investigator` or `generalist`).
3. **Conflict Check**: Assess potential breaking changes in child repos or parallel sub-routines. [[Invoke: quality-assurance]](../skills/quality-assurance/SKILL.md)

### Phase 2: Dispatch & Execution

1. **External Action**: Trigger the `fleet-dispatch` GitHub Action. [[Invoke: devops]](../skills/devops/SKILL.md)
2. **External Tracking**: Create tracking PRs in child repositories with the `fleet-dispatch` label. [[Invoke: scribe]](../skills/scribe/SKILL.md)
3. **Internal Action (Swarm)**: Dispatch the required sub-agents with strict, isolated objectives.

### Phase 3: The Quality Gate (Merge & Resolution)

1. **Swarm Merge Protocol**: Ensure internal sub-routines merge their results back to the main track via `.agent/state/task_merge_workflows.md`. Verify Svelte 5 and Perchance compliance before accepting the merge.
2. **Conflict Resolution**: Handle any downstream core-logic conflicts by prioritizing the Central Sovereign Source. [[Invoke: reflection]](../skills/reflection/SKILL.md)
3. **Report**: Verify that all child repos have acknowledged the update and all swarm tasks are reconciled.

## 4. Anti-Patterns

- **The Flood**: Triggering fleet-wide updates for minor UI or aesthetic tweaks.
- **Solo Divergence**: Letting child repositories diverge from the Core Engine logic.
- **Untracked Dispatch**: Sending updates or dispatching sub-agents without logging them in the trackers.
- **Messy Merge**: Accepting sub-agent output that violates Svelte 5 or Perchance isolation constraints.
