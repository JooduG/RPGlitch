---
description: Task execution loop. Picks the next task from the plan and builds it.
---

# 03-implement (The Engine)

> **Goal:** Execute tasks from an approved plan, one at a time, with test-driven discipline.

## 1. Triggers

- **After Planning**: `02-feature` completed, plan approved.
- **Resuming Work**: "Continue", "Next task", "Implement".
- **Slash Command**: `/03-implement`

## 2. Brain (Context Injection)

- **Plan**: `.agent/tasks/<slug>/plan.md` (The active task list).
- **Spec**: `.agent/tasks/<slug>/spec.md` (Acceptance criteria).
- **Stack**: `.agent/rules/stack.md` (Svelte 5 / SCSS constraints).

## 3. Procedures

### Phase 1: Task Selection

1. **Read Plan**: Open the active `plan.md`.
2. **Select**: Choose the next `[ ]` (uncompleted) task in sequential order.
3. **Mark In-Progress**: Change `[ ]` to `[/]` in `plan.md`.
4. **Announce**: State the task being worked on.

### Phase 2: Build (Skeleton-First)

_Execute in strict order. Each layer is a gate._

#### A. State & Logic

1. **State**: Define Runes (`$state`, `$derived`) in `src/core/` or `src/state/`.
2. **Logic**: Implement core events and data handlers.
3. **Gate**: No `export let`, no `$:`, no `any` types.

#### B. Markup

1. **Markup**: Generate `.svelte` files with semantic HTML.
2. **Gate**: No `<style>` blocks yet. No inline styles. No classes.

#### C. Skin

1. **Classes**: Add semantic class names.
2. **Styles**: Add `<style lang="scss">` using design tokens.
3. **Gate**: No hardcoded hex. Use `var(--token)` exclusively.

### Phase 3: Verify

1. **Test**: Write or run tests that validate the task's acceptance criteria.
    - If tests fail: debug and fix. Max 2 retry attempts before triggering `10-revert`.
2. **Hygiene**: No `console.log`, `FIXME`, or dead comments.
3. **Lint**: Run `npm run lint` if available.

### Phase 4: Commit & Record

1. **Stage**: `git add <files>`.
2. **Commit**: `gamemaster(<scope>): <description>`.
3. **Git Note** (optional): For complex tasks, attach a summary via `git notes add -m "<summary>" <sha>`.
4. **Update Plan**: Change `[/]` to `[x]` in `plan.md`. Append `[<short-sha>]`.
5. **Commit Plan**: `gamemaster(plan): Mark task '<name>' as complete`.

### Phase 5: Continue or Checkpoint

1. **Check**: Are there more `[ ]` tasks in `plan.md`?
    - **Yes**: Loop back to Phase 1.
    - **No (Phase Complete)**: Trigger `05-checkpoint`.
2. **Phase Boundary**: If the completed task ends a logical phase:
    - Run full test suite.
    - Present manual verification steps to user.
    - Await user confirmation before proceeding.

## 4. Anti-Patterns

- **Skipping the Plan**: Coding without a `plan.md` entry.
- **Style-First**: Building CSS before the data model.
- **God-Components**: Putting all logic inside `.svelte` files.
- **Mega-Commits**: Batching multiple tasks into one commit.
- **Silent Failures**: Moving past failing tests without investigation.

## 5. Tools

- `view_file` (Read plan/spec)
- `write_to_file` / `replace_file_content` (Build)
- `run_command` (Test/Lint/Git)
- `task_boundary` (Track progress)
