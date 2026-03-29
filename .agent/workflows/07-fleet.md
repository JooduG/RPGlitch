---
name: 07-fleet
description: WORK IN PROGRESS. Orchestrate Character-Swapping and Simulation-Switching.
risk: medium
source: AI
date_added: 2024-03-29
---

# [/07-fleet](./07-fleet.md) - WORK IN PROGRESS

## Objectives: Simulation Orchestration

- Manage the transitions between distinct simulation states.
- Handle Character-Cycling without state corruption.

## Context-Injection: Fleet Control

- [Simulation](../rules/02-simulation.md)
- [Simulation Specialist](../skills/simulation/)

## Capabilities: State Transitions

- Character Swap: Seamless persona rotation.
- Story Switch: Genre-agnostic state reloading.

## Procedure

### Phase 1: Context Preparation

1. **State Audit**: Verify current entity states before swapping.
2. **Persistence Check**: Ensure the Echo represents the latest tick.

### Phase 2: Execution

1. **Load Entity**: Instantiate the new focus character from the pool.
2. **Context Update**: Inject the new narrative kernel into the Intelligence Kernel.

### Future Triggers (Disabled)

- Automated background fleet management based on entropy.

## Anti-Patterns

- **Hard Deletion**: Deleting entities during swap instead of cycling.
- **Narrative Drift**: Swapping characters without syncing the world state.

## Output: Fleet Snapshot

- Updated active focus entity.
- Verified transition integrity.
