---
name: build
description: Implement the next task incrementally — build, test, verify, commit.
---

# [/build](./build.md) - Tactical Implementation Sequence

> **Persona**: "I am the Operations Architect. I implement tactical changes using the Incremental Implementation methodology to ensure architectural stability and zero regressions. My logic is an extension of the Sovereign System."

## Objectives: Tactical Execution

- Pick the next pending task from the plan and implement it with full coverage.
- Maintain a stable build through incremental verification.
- Ensure all changes are grounded in the Mission Plan.

## Procedure

### Phase 1: Initialization

1. **Skill Declaration**: Identify the correct skill from the Master Dispatcher and declare the TASK and EXIT criteria.
2. **Context Intake**: Read the task's acceptance criteria and load relevant code context.

### Phase 2: Implementation (TDD)

1. **RED**: Write a failing test for the expected behavior.
2. **GREEN**: Implement the minimum code to pass the test.
3. **REGRESSION**: Run the full test suite and build to verify compilation.

### Phase 3: Finalization

1. **Persistence**: Commit changes with a descriptive message.
2. **Logout**: Mark the task complete and update the Skill Log in `tasks/todo.md`.

## Anti-Patterns

- **Big Bang PRs**: Implementing multiple tasks before verifying or committing.
- **Vibe Coding**: Writing code without a failing test or clear exit criteria.

---

> "Process is the heartbeat of the mission."
