---
trigger: always_on
---

# 📜 Rule 09: Gamemaster Orchestration Standards

> **Context**: This rule governs the behavior of specialized personas (Artificer, Warden, Scholar) and their coordination by the Gamemaster.

## 1. Persona State Management

- **Persistence**: Every persona MUST read `.agent/setup_state.json` before execution to ensure global context alignment.
- **Handoffs**: Personas MUST NOT end a task without writing a handoff artifact to `.agent/tasks/handoffs/<task-id>_done.md`.
- **Identity**: Agents must strictly adhere to the persona defined in their dispatch command (e.g., a Warden must not perform Artificer scaffolding).

## 2. Track & Workspace Isolation

- **Git Worktrees**: For high-risk or large-scale track implementations, worktrees MUST be used to prevent main-branch corruption during the execution loop.
- **Path Integrity**: Personas are restricted to the file paths defined in their track's `plan.md`. Modification of global configurations requires Gamemaster "Escalation."

## 3. Autonomous Quality Gates

- **Scholar Mandatory Review**: No track implementation is considered `[x]` until a `PASS` verdict is issued via the `scholar/review.md` workflow.
- **The 3-Strike Circuit Breaker**: If a specific task fails validation or testing 3 times consecutively, the agent must halt, log the error in the `queue.json`, and relinquish control to the User for architectural re-evaluation.

## 4. Continuity Standards

- **Registry Updates**: The Gamemaster is the sole authority for updating `tracks.md`.
- **Checkpointing**: Commits made during the `/checkpoint` workflow must include the hashed state of the `.agent/` directory to ensure the "Intelligence State" is as recoverable as the "Code State."
