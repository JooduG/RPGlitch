---
name: 07-fleet
description: Orchestration & Sync. Coordinates the multi-agent fleet.
---

# 07-fleet (The Commander)

> **Goal:** Propagate core changes and dispatch specialized AI agents.

## 1. Triggers

- **Core Update**: DynamicsEngine or IntelligenceKernel changes.
- **Dispatch**: "Trigger a fleet scan", "Update all repos".
- **Slash Command**: [/07-fleet](./07-fleet.md)

## 2. Brain (Context Injection)

- **Fleet Ops**: [../../.github/workflows/ai-fleet-dispatch.yml](../../.github/workflows/ai-fleet-dispatch.yml).
- **Target Context**: Child repo metadata.

## 3. Procedures
1. **Overlap**: Identify which child repos are affected by the current core change.

2. **Dispatch**: Trigger the fleet-dispatch action. [Invoke: `devops`]

3. **Draft**: Create PRs in child repos with the `fleet-dispatch` label. [Invoke: `scribe`]

4. **Resolve**: Handle core-logic conflicts by prioritizing the Central Source.

## 4. Anti-Patterns

- **The Flood**: Triggering fleet-wide updates for minor UI tweaks.
- **Solo Divergence**: Letting child repos diverge too far from the Core Engine.
