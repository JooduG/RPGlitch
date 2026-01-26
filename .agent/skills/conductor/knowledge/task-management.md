---
name: tasks
description: Triggers on .agent/tasks/tracks.md. Enforces TDD, Atomic Commits, and the "Trinity" workflow philosophy.
---

# Tasks: The Philosophy of Work

## Core Principles

### 1. The Trinity (TDD)

We do not write code until we have a failing test.

1.  **Red**: Write a failing test in `tools/tests/`.
2.  **Green**: Implement minimum code to pass.
3.  **Refactor**: Cleanup and optimize.

### 2. Atomic Units

- **One Task = One Commit**.
- Never mix refactoring with feature work.
- Never leave the build in a broken state between tasks.

### 3. The Source of Truth

- **Plan**: `.agent/tasks/<track>/plan.md` is the law.
- **Status**: `.agent/tasks/tracks.md` is the high-level map.
- **Work**: execution flows through the **Workflows**.

## Execution Workflows

Do not memorize steps. Use the **Workflows** to execute:

- **Start New Feature**: `/02-new-track`
- **Implement Feature**: `/03-implement`
- **Check Status**: `/04-status`
- **Fix Mistakes**: `/05-revert`
