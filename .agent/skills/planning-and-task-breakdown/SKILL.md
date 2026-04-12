---
name: planning-and-task-breakdown
description: Breaks work into ordered tasks. Use when you have a spec or clear requirements and need to break work into implementable tasks. Use when a task feels too large to start, when you need to estimate scope, or when parallel work is possible.
---

# Planning and Task Breakdown

> "Decompose work into small, verifiable tasks with explicit acceptance criteria. Good task breakdown is the difference between an agent that completes work reliably and one that produces a tangled mess."

## Overview

The `planning-and-task-breakdown` skill is essential for managing the complexity of implementation within the RPGlitch Engine. It focuses on decomposing high-level specifications into discrete, manageable, and testable units of work. By defining implementation order bottom-up according to a dependency graph and slicing features vertically, we ensure that every task delivers verifiable value.

### Strategic Context

- **Dependency Mapping**: Build foundation layers (Schema, Store) before dependent layers (Logic, UI).
- **Vertical Slicing**: Favor complete functional paths over horizontal architectural blocks.
- **Granularity Control**: Aim for tasks that can be implemented and verified in under 2 hours (S/M sizing).

## When to Use

- **Positive Triggers**: When you have an approved `SPEC.md` and need to initialize `tasks/plan.md`, when a task feels too large or vague to start, or when work needs to be parallelized across a `swarm`.
- **Checkpoint Triggers**: After completing a major architectural milestone and planning the next phase.
- **EXCLUSIONS**: Do not use for trivial single-file fixes or when requirements are unambiguous and self-contained.

## How It Works

1. **Analytical Review**: Read the spec and the codebase to identifies patterns and dependencies.
2. **Dependency Graph Construction**: Map what must be built first (e.g., Dexie schema before Svelte handlers).
3. **Vertical Slicing**: Group tasks into functional features rather than technical layers.
4. **Task Authoring**: Write tasks in `tasks/plan.md` using the Task Template (Description, Acceptance Criteria, Verification, Likely Files).

### Task Sizing Guidelines

- **Small (S)**: 1-2 files. Single component or endpoint.
- **Medium (M)**: 3-5 files. One vertical feature slice (e.g., "User Profile update").
- **Large (L)**: 5+ files. **Too large.** If a task touches more than 5 files, it must be subdivided into smaller atomic tasks.

## Usage

```bash
# Initialize a task list in the plan document (Rule 05)
# (Followed by /plan workflow)
```

## Present Results

Present the implementation plan and task list for user approval.

- **Evidence**: A link to `tasks/plan.md` or the corresponding artifact.
- **Validation**: Demonstrate that all tasks follow the vertical slicing principle and have testable acceptance criteria.

## Common Rationalizations

| Agent Excuse                    | The Reality                                                                                  |
| :------------------------------ | :------------------------------------------------------------------------------------------- |
| "I'll figure it out as I go."   | Leads to tangled logic and the "heresy" of unverified state. Planning saves hours of rework. |
| "The tasks are obvious."        | Writing them down surfaces hidden dependencies and ensures zero-gap coverage.                |
| "I can hold it all in my head." | Context windows are finite. Written tasks survive session boundaries and Compaction.         |

## Red Flags

- **Unordered Tasks**: Implementing a UI before the core reactive logic it depends on.
- **Vague Acceptance Criteria**: Using phrases like "ensure it works" instead of "test X returns Y".
- **Horizontal Slicing**: Building all database tables first without connecting any functionality to the user.

## Troubleshooting

- **Scope Creep**: If a task grows during implementation, immediately pause, re-verify the plan, and subdivide the remaining work.
- **Blocked Path**: If a high-priority foundation task fails, use `debugging-and-error-recovery` before proceeding to dependent tasks.

## Verification

- [ ] Every task has specific, testable acceptance criteria.
- [ ] Every task has a defined verification step (Rule 06).
- [ ] Tasks are ordered bottom-up by technical dependency.
- [ ] No task touches more than ~5 files.
- [ ] **Hard Evidence Recorded**: A finalized `tasks/plan.md` in the repository.
