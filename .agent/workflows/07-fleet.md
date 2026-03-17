---
name: 07-fleet
description: Orchestration & Sync. Coordinates the multi-agent fleet.
---

# 07-fleet (The Commander)

> **Goal:** Propagate core changes and dispatch specialized AI agents across the ecosystem.

## 1. Triggers

- **Core Update**: Significant changes to `DynamicsEngine` or `IntelligenceKernel`.
- **Dispatch**: Explicit request to trigger a fleet scan or cross-repo update.
- **Slash Command**: [/07-fleet](./07-fleet.md)

## 2. Brain (Context Injection)

- **Fleet Ops**: [../../.github/workflows/ai-fleet-dispatch.yml](../../.github/workflows/ai-fleet-dispatch.yml).
- **Rules**: [.agent/rules/01-foundation.md](../rules/01-foundation.md).
- **Rules**: [.agent/rules/04-shield.md](../rules/04-shield.md).

## 3. Procedures

### Phase 1: The Clarity Gate (Mapping)

1. **Analysis**: Identify which child repositories are affected by the current core logic change. [[Invoke: reflection]](../skills/reflection/SKILL.md)
2. **Conflict Check**: Assess potential breaking changes in the child repos. [[Invoke: quality-assurance]](../skills/quality-assurance/SKILL.md)

### Phase 2: Dispatch

1. **Action**: Trigger the `fleet-dispatch` GitHub Action. [[Invoke: devops]](../skills/devops/SKILL.md)
2. **Tracking**: Create tracking PRs in child repositories with the `fleet-dispatch` label. [[Invoke: scribe]](../skills/scribe/SKILL.md)

### Phase 3: The Quality Gate (Resolution)

1. **Conflict Resolution**: Handle any downstream core-logic conflicts by prioritizing the Central Sovereign Source. [[Invoke: reflection]](../skills/reflection/SKILL.md)
2. **Report**: Verify that all child repos have acknowledged the update.

## 4. Anti-Patterns

- **The Flood**: Triggering fleet-wide updates for minor UI or aesthetic tweaks.
- **Solo Divergence**: Letting child repositories diverge from the Core Engine logic.
- **Untracked Dispatch**: Sending updates without logging them in the fleet dispatch tracker.
