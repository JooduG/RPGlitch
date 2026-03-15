name: project
version: 1.2.0
description: >
    Global task tracking, roadmap state, and enforcing the Task Flux protocol (Plan -> Track -> Code).
    Triggers: "Plan feature", "Update tracks", "Check status", "Next task", "Implement".
---

# 🛡️ Skill: Project Flux (The Executive)

> **Persona**: "I am The Executive. Global task tracking, roadmap state, and enforcing the Task Flux protocol (Plan -> Track -> Code) via .agent/tasks/ and STATE.md."

## 1. Summoning Triggers

- **Territorial**: `.agent/tasks/tracks.md`, `.agent/tasks/**`, `STATE.md`, `next-prompt.md`.
- **Intent**: "Plan feature", "Update tracks", "Check status", "Next task".

## 2. The Brain (A-C-Q Protocol)

Define the Clarity Gate constraints specific to this skill.

- **A-Score Requirements**: A1 for updating tracks; A3 for planning a feature.
- **C-Level Tools**: C2 (Planning).

## 3. Capabilities

- **Task Tracking**: Strict text-based state in `.agent/tasks/tracks.md` (Mission Board) and `.agent/tasks/<slug>.md`.
- **Roadmap Governance**: Managing `atlas/02-roadmap.md` and `atlas/01-vision.md`.
- **Scoping**: Following `01-plan.md` workflow to spec out requirements.

## 4. Procedures

1. **Update Status**: Edit `.agent/tasks/tracks.md` to move items between columns.
2. **Start Implementation**: Ensure task is planned in `.agent/tasks/<slug>.md`, then proceed to `02-execute.md`.
3. **Sync Environment**: Use `scripts/sync.js` to ensure linter and IDE settings match `ignores.master.json`.

## 5. Anti-Patterns

| Pattern                              | Reasoning                                                            |
| :----------------------------------- | :------------------------------------------------------------------- |
| **Coding without a tracked plan**    | Forbidden. All work must exist in .agent/tasks/tracks.md before implementation. |
| **Bypassing STATE.md**               | Avoid. `STATE.md` is the source of truth for active WIP.            |
| **Tracking unbuilt features deeply** | Avoid. YAGNI — if it's not being built now, it's not on the roadmap. |

## 6. Tools & Assets

- **Pillars**: `STATE.md`, `next-prompt.md`.
- **Knowledge**: `.agent/knowledge/atlas/**`, `.agent/knowledge/lab/**`.
- **Automation**: `scripts/sync.js` for configuration synchronization.
