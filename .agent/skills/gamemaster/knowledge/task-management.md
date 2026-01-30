# Tasks: The Philosophy of Work

## 🚀 Bootstrap Protocol (Critical)

Every agent session **MUST** begin by executing the **Startup Protocol** defined in **[boot.md](file:///c:/Users/johng/Documents/GitHub/default/.agent/skills/gamemaster/knowledge/boot.md)**.

## Core Principles

### 1. The Trinity (TDD)

We do not write code until we have a failing test.

1.  **Red**: Write a failing test in [`src/warden/`](../../../../src/warden/).
2.  **Green**: Implement minimum code to pass.
3.  **Refactor**: Cleanup and optimize.

### 2. Atomic Units

- **One Task = One Commit**.
- Never mix refactoring with feature work.
- Never leave the build in a broken state between tasks.

### 3. The Source of Truth

- **Plan**: `.agent/tasks/<track>/plan.md` is the law.
- **Status**: [.agent/tasks/tracks.md](../../../tasks/tracks.md) is the high-level map.
- **Work**: execution flows through the **Workflows**.

### 4. Track Formatting Rule

To prevent IDE linting errors (broken link references), `tracks.md` headers must use Emojis instead of brackets:

- **Defined**: `## ⭕ Track: Name` (Not `[ ]`)
- **Complete**: `## ✅ Track: Name` (Not `[x]`)

## Execution Workflows

Do not memorize steps. Use the **Workflows** to execute:

- **Start New Feature**: [`/02-new-track`](../../../workflows/gamemaster/02-new-track.md)
- **Implement Feature**: [`/03-implement`](../../../workflows/gamemaster/03-implement.md)
- **Check Status**: [`/04-status`](../../../workflows/gamemaster/04-status.md)
- **Fix Mistakes**: [`/05-revert`](../../../workflows/gamemaster/05-revert.md)
