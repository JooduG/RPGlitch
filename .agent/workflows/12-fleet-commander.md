# Workflow: 12-fleet-commander (Multi-Repo Synchronization)

> **Context:** Extracted from the Jules SDK 'Fleet' logic. Manages propagating core changes across multiple repositories safely.

## Phase 1: Overlap Analysis (The Jules Method)

Before dispatching a structural change to another repository, you must calculate the overlap:

1. **Fetch Target State:** Read the `package.json` and `.agent/rules/` of the target repo.
2. **Determine Collision:** Does the target repo use the exact same Chalk Regime tokens? If it has overrides, map the changes accordingly.

## Phase 2: Dispatch

1. **Branching:** Create a dedicated `fleet-update/[feature-name]` branch on the target.
2. **Patch Application:** Apply the changes, ensuring you respect the target's `.agent/state/global.md`.
3. **Draft PR:** Create a Pull Request with the label `fleet-dispatch`.

## Phase 3: Autonomous Conflict Resolution

If a `fleet-dispatch` PR encounters a merge conflict:

1. **Analyze:** Do not abort. Read the Git conflict markers (`<<<<<<< HEAD`).
2. **Prioritize Core:** If the conflict is in a core Engine file, the Fleet Commander's incoming change overwrites the local change.
3. **Preserve UI:** If the conflict is in a UI layer, attempt to safely merge the logic while preserving the target's specific layout.
