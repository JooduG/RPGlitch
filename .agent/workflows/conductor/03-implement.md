---
description: Executes the implementation plan for a defined track.
---

# Conductor Implement

## 1.0 SELECTION

### PROTOCOL: Pick the Track

1. If argument provided (`/conductor:implement <name>`), look for that folder in `.agent/tasks/`.
2. If no argument, read `.agent/tasks/tracks.md` and find the first `[ ]` (Incomplete) track.
3. Confirm selection with user.

## 2.0 EXECUTION LOOP

### PROTOCOL: The Builder's Cycle

1. **Load Context:**
    - Read `.agent/tasks/<track-name>/spec.md`
    - Read `.agent/tasks/<track-name>/plan.md`
    - Read `.agent/rules/standard-workflow.md` (Quality Gates)

2. **Iterate Plan:**
    - Find the first unchecked item `[ ]` in `plan.md`.
    - **Mark In-Progress:** Change to `[/]`.
    - **Execute:** Write code, run tests, fix bugs.
    - **Verify:** Run validations defined in `standard-workflow.md`.
    - **Mark Complete:** Change to `[x]`.

3. **Checkpoing:**
    - After every task completion, update `plan.md` file on disk.

## 3.0 COMPLETION

### PROTOCOL: Finalize Track

1. When all tasks are `[x]`:
2. Run full suite tests (as per workflow).
3. Update `.agent/tasks/tracks.md`: Mark track as `[x] Completed`.
4. Ask user: "Track complete. Archive or Delete?"
