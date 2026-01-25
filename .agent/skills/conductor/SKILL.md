---
name: conductor
description: Orchestrates the work lifecycle (Antigravity). Manages work tracks, context saves, and progress reporting.
---

# 🕹️ Skill: Conductor (The Orchestrator)

The Conductor is responsible for managing the **State of Work**. It ensures that the Antigravity system remains multi-threaded and never loses context.

## 1. Capabilities

### Track Management

Create and manage independent work tracks. Each track represents a feature branch or a complex bug fix.

- **Protocol**: When starting a new feature, use `/conductor-new-track`.

### Context Save/Restore

Safeguard the active work context.

- **Save**: Document reasoning, roadblocks, and next steps in `implementation_plan.md` and `task.md`.
- **Restore**: Use `/continue` to resume a task with full fidelity.

### Concurrency

Manage multiple "Active" tracks.

- Use `conductor-status` or `node tools/ops/conductor.js hygiene` to audit global system health and track progress.

## 2. Operational Commands

| Action        | Command                                 |
| :------------ | :-------------------------------------- |
| **Bootstrap** | `node tools/ops/conductor.js bootstrap` |
| **Sync**      | `node tools/ops/conductor.js sync all`  |
| **Hygiene**   | `node tools/ops/conductor.js hygiene`   |

## 3. Operational Knowledge

- **[Boot Protocol](./knowledge/boot.md)**: Agent startup and environment validation.
- **[Task Management](./knowledge/task-management.md)**: Granular task breakdown standards.
- **[Deployment](./knowledge/deployment.md)**: Single-monolith build and artifact publishing.

## 3. Usage

- **Trigger**: Path-based (`.agent/tasks.md`) or Action-based ('start new feature', 'switch track').
- **Goal**: Maintain 100% visibility into progress for the user.
