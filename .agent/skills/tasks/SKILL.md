---
name: tasks
description: Triggers on .agent/tasks.md or where otherwise relevant. Governs the TDD lifecycle, commit standards, and phase checkpointing.
---

# Tasks: TDD & Integrity Skill

## When to use this skill

- Starting a new feature, bug fix, or refactor.
- Moving through the Red-Green-Refactor cycle.
- Finalizing a task or phase in `.agent/tasks.md`.

## 📋 Task Management Workflow

1.  **Initialize**: Maintain a clear, multi-step plan for the current objective directly in `.agent/tasks.md`. Use `replace` or `write_file` to keep the state updated (e.g., `[ ]` to `[~]` to `[x]`). This ensures focus and allows for progress tracking across sessions.
2.  **TDD Lifecycle**:
    -   **Red**: Write a failing test in `tools/tests/unit/` or `tools/tests/e2e/`.
    -   **Green**: Implement minimum code to pass.
    -   **Refactor**: Cleanup and check against `anti-patterns.md`.
3.  **Checkpoint**: After each major todo item is completed, update the task state in `.agent/tasks.md` and commit.

## Instructions

- **No Shortcuts**: Never bypass the "Red" phase. Failing tests are mandatory.
- **Divergence**: If implementation differs from `tech-stack.md`, STOP and document the change first.
- **Done State**: A task is only "Done" when code, tests, documentation, and implementation notes are finalized.

## Resources

- **Primary Tracker**: `.agent/tasks.md`
- **Tech Rules**: `.agent/rules/tech-stack.md`
- **Unit Tests**: Place in `tools/tests/unit/` or alongside the component.
