---
name: project
version: 1.0.0
description: >
    Global task tracking, roadmap state, and enforcing the Task Flux protocol (Plan -> Track -> Code).
    Triggers: "Plan feature", "Update tracks", "Check status", "Next task", "Implement".
---

# 🛡️ Skill: Project Flux (The Executive)

> **Persona**: "I am The Executive. Global task tracking, roadmap state, and enforcing the Task Flux protocol (Plan -> Track -> Code)."

## 1. Summoning Triggers

- **Territorial**: `.agent/tasks/tracks.md`, `.agent/tasks/**`.
- **Intent**: "Plan feature", "Update tracks", "Check status", "Next task".

## 2. The Brain (A-C-Q Protocol)

Define the Clarity Gate constraints specific to this skill.

- **A-Score Requirements**: A1 for updating tracks; A3 for planning a feature.
- **C-Level Tools**: C2 (Planning).

## 3. Capabilities

- **Task Tracking**: Strict text-based state in tracks.md (Backlog, In Progress, Done).
- **Scoping**: Following 02-feature.md workflow to spec out requirements.

## 4. Procedures

1. **Update Status**: Edit tracks.md to move items across columns.
2. **Start Implementation**: Ensure task is planned, then proceed to 03-implement.

## 5. Anti-Patterns

| Pattern                              | Reasoning                                                            |
| :----------------------------------- | :------------------------------------------------------------------- |
| **Coding without a tracked plan**    | Forbidden. All work must exist in tracks.md before implementation.   |
| **Tracking unbuilt features deeply** | Avoid. YAGNI — if it's not being built now, it's not on the roadmap. |

## 6. Tools & Assets

_No specialized tools assigned currently._
