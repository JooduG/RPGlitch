---
name: tasks
description: Triggers on .agent/tasks.md or where otherwise relevant. Governs the TDD lifecycle, commit standards, and phase checkpointing.
---

# Tasks: TDD & Integrity Skill

## When to use this skill

- Starting a new feature, bug fix, or refactor.
- Moving through the Red-Green-Refactor cycle.
- Finalizing a task or phase in `.agent/tasks.md`.

## Workflow

1.  **Select Task**: Choose the next sequential task from `.agent/tasks.md`.
2.  **Mark In Progress**: Update `.agent/tasks.md` status to `[~]`.
3.  **Red Phase**: Create failing unit tests that define the "Success" state.
4.  **Green Phase**: Implement the minimum code to pass the tests.
5.  **Refactor**: Clean code and tests without changing behavior.
6.  **Verify**: Run coverage and project-specific checks (e.g., `npm run check`).
7.  **Commit**: Use `<type>(<scope>): <description>` format.
8.  **Notes**: Attach task summaries using `git notes`.
9.  **Record**: Update `.agent/tasks.md` with status `[x]` and the commit hash.

## Instructions

- **No Shortcuts**: Never bypass the "Red" phase. Failing tests are mandatory.
- **Divergence**: If implementation differs from `tech-stack.md`, STOP and document the change first.
- **Done State**: A task is only "Done" when code, tests, documentation, and implementation notes are finalized.

## Resources

- **Primary Tracker**: `.agent/tasks.md`
- **Tech Rules**: `.agent/rules/tech-stack.md`
- **Unit Tests**: Place in `tools/tests/unit/` or alongside the component.
