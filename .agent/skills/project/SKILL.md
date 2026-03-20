---
name: project
version: 2.0.0
description: >
    Manages the task lifecycle (Plan -> Track -> Code) via the .agent/state hub. 
    Enforces the Flat Track protocol and maintains the Global State baton.
---

# Skill: Project System

> **Context**: "Orchestrates global task tracking and roadmap state. Ensures every byte of work is registered in the .agent/state/ tracks and synchronized with the Global State."

## 1. Summoning Triggers

- **Territorial**: `.agent/state/tracks.md`, `.agent/state/tracks/**`, `.agent/state/global.md`, `.agent/state/next-prompt.md`.
- **Intent**: "Plan feature", "Update tracks", "Check status", "Next task", "Initialize track".

## 2. The Brain (A-C-Q Protocol)

- **A-Score**: A1 for status updates; A3 for architecture/planning.
- **C-Level**: C2 (Planning) for task decomposition.

## 3. Capabilities

- **Flat Track Management**: Creating and maintaining single-file tracks in `.agent/state/tracks/<slug>.md` containing Specs and Plans.
- **Kanban Registry**: Managing the Mission Board in `.agent/state/tracks.md`.
- **Global Handoff**: Ensuring `global.md` and `next-prompt.md` are updated via the `06-continue` workflow.

## 4. Procedures

1. **Scaffold Track**:
    - Check `backlog.md` or user intent.
    - Run "Architecture Consultation" if intent is A3 (Ambiguous).
    - Create `.agent/state/tracks/<slug>.md` using the [Track Template](templates/track.md).
    - Register the track in `.agent/state/tracks.md`.
2. **Sync Execution**:
    - Before implementation, read the target track file.
    - Use `scripts/sync.js` to ensure environmental parity.

## 5. Anti-Patterns

| Pattern                 | Mitigation                                                            |
| :---------------------- | :-------------------------------------------------------------------- |
| **The Ghost Work**      | Coding without an active entry in `tracks.md` or a track file.        |
| **State Fragmentation** | Creating `STATE.md` or `.tasks/` folders. (Use `.agent/state/` ONLY). |
| **Nested Task Folders** | v4.0 uses Flat Tracks (one file per task) to prevent context hopping. |

## 6. Tools & Assets

- **The Hub**: `.agent/state/global.md` (Vision/WIP), `.agent/state/tracks.md` (Kanban).
- **Automation**: `scripts/sync.js` for config synchronization.
