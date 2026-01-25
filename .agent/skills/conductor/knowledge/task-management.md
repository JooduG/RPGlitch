---
name: tasks
description: Triggers on .agent/tasks/tracks.md or where otherwise relevant. Governs the Conductor lifecycle, commits, and phase checkpointing.
---

# Tasks: Conductor & Integrity Skill

## When to use this skill

- Starting a new feature, bug fix, or refactor (Run `/conductor-new-track`).
- Implementing a spec-driven task (Run `/conductor-implement`).
- Checking project status (Run `/conductor-status`).

## 📋 Task Management Workflow (Conductor)

1. **Initialize**:
    - Do not manually edit task lists unless trivial. Use `/conductor-new-track` to scaffold work.
    - Active tracks live in `.agent/tasks/tracks.md`.
    - Detailed plans live in `.agent/tasks/<track-name>/plan.md`.

2. **TDD Lifecycle (The Trinity)**:
    - **Red**: Write a failing test in `tools/tests/unit/` or `tools/tests/e2e/`.
    - **Green**: Implement minimum code to pass.
    - **Refactor**: Cleanup and check against `.agent/rules/anti-patterns.md`.

3. **Checkpoint**:
    - Update `plan.md` using `[ ]` -> `[/]` -> `[x]`.
    - Commit after verifying "Green" state.

## Resources

- **Registry**: `.agent/tasks/tracks.md`
- **Workflows**: `.agent/workflows/conductor-*.md`
- **Tech Rules**: `.agent/rules/tech-stack.md`
- **Unit Tests**: `tools/tests/`
