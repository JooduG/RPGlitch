---
description: The Core Execution Loop. Builds features or refactors code.
---

# 02-execute (The Forge)

> **Goal:** Transform the abstract (Plan) into the concrete (Code) with rigorous discipline.

## 1. Triggers

- **Approved Plan**: `01-plan` complete.
- **Refactor Request**: "Clean up this module".
- **Resume**: Continuing work on active track.
- **Slash Command**: `/02-execute`

## 2. Brain (Context Injection)

- **Plan**: `.agent/tasks/<slug>/plan.md`
- **Stack**: `.agent/rules/03-physics.md` (Svelte 5 / Runes)
- **Standards**: `.agent/rules/05-standards.md`

## 3. Procedures

### Phase 1: Task Selection

1.  **Pick**: Select next `[ ]` item from `plan.md`.
2.  **Mark**: Update to `[/]`.
3.  **Context**: Read relevant files for _this specific task_.

### Phase 2: Fabrication (TDD Loop)

1.  **Red Phase**: Create/Update test file. Write failing test. **Verify failure** via `npm test`.
2.  **Green Phase**: Implement minimum code in `src/` to pass tests. Use `waldzell-clear-thought` / `metacognitiveMonitoring` for complex logic.
3.  **Refactor Phase**: Clean up implementation. Logic = Pure Functions. Styles = Tokens.
4.  **Verify**: Rerun tests to ensure success.

### Phase 3: Verification (Quality Gate)

1.  **Audit**: Check for `console.log`, `TODO`s, or hardcoded hex.
2.  **Manual**: Follow the task's specific verification steps (Browser/CLI).
3.  **Sanity**: Ensure bundle size and performance constraints are met.

### Phase 4: Record

1.  **Commit**: `gamemaster(feat|refactor): <description>`.
2.  **Git Notes**: Optional: Attach a summary of changes using `git notes add -m "<summary>" <hash>` for auditability.
3.  **Update**: Mark task `[x]` in `plan.md`.
4.  **Checkpoint**: If this completes a **Phase**, execute the Checkpointing Protocol.

## 4. Checkpointing Protocol

1.  **Scope**: `git diff --name-only <last_checkpoint> HEAD`.
2.  **Test Coverage**: Verify tests exist for ALL changed code files.
3.  **Verify**: Ensure full suite PASS.
4.  **Finalize**: Update `tracks.md` with new `checkpoint: <sha>`. Use the "Track Block" format.

## 5. Anti-Patterns

- **Painting the Void**: Writing UI before the state is defined.
- **Blind Commits**: Committing without running tests.
- **Note-less Checkpoints**: Missing context on WHY a phase is finished.

## 6. Tools

- `view_file` (Context)
- `write_to_file` / `replace_file_content` (Edits)
- `run_command` (Test/Git)
- `waldzell-clear-thought` (Deep Logic)
- `waldzell-metacognitive-monitoring` (Self-Audit)
- `task_boundary` (State)
