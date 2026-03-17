---
name: 12-fleet-commander
description: Multi-Repo Synchronization and autonomous fleet command.
---

# 12-fleet-commander (Multi-Repo)

> **Goal:** Coordinate across the fleet. Manages propagating core changes across multiple repositories safely.

## 1. Triggers

- **Core Engine Change**: Changes to `DynamicsEngine` or `IntelligenceKernel`.
- **Global Design Change**: Changes to `03-technetium.md` or `src/theme/tokens.css`.
- **Slash Command**: `/12-fleet`

## 2. Brain (Context Injection)

- **Global State**: `.agent/state/global.md`
- **Target Context**: `package.json` and `.agent/rules/` of the target repo.

## 3. Procedures

### Phase 1: Overlap Analysis

Before dispatching a structural change to another repository, you must calculate the overlap:

1. **Fetch Target State**: Read the target repo's core metadata.
2. **Determine Collision**: Does the target repo use the same Chalk Regime tokens? If it has overrides, map the changes accordingly.

### Phase 2: Dispatch

1. **Branching**: Create a dedicated `fleet-update/[feature-name]` branch on the target.
2. **Patch Application**: Apply changes respecting the target's `.agent/state/global.md`.
3. **Draft PR**: Create a Pull Request with the label `fleet-dispatch`.

### Phase 3: Autonomous Conflict Resolution

If a `fleet-dispatch` PR encounters a merge conflict:

1. **Analyze**: Do not abort. Read the Git conflict markers.
2. **Prioritize Core**: If the conflict is in a core Engine file, the Fleet Commander overrides.
3. **Preserve UI**: If the conflict is in a UI layer, attempt a safe merge.
