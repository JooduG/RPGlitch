---
name: 02-execute
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

- **Plan**: `.agent/state/tracks/<slug>/<slug>.md` (Flat track file — Spec + Plan combined)
- **Stack**: `.agent/knowledge/atlas/07-physics.md` (Svelte 5 / Runes)
- **Standards**: `.agent/rules/03-technetium.md`

## 3. Procedures

### Phase 1: Task Selection

1.  **Pick**: Select next `[ ]` item from `plan.md`.
2.  **Mark**: Update to `[/]`.
3.  **Context**: Read relevant files for _this specific task_.
4.  **UI/UX Verification**: If the task involves UI components, verify against `design.md` and ensure Stitch iterations are reconciled before starting code fabrication.

### Phase 2: Fabrication (TDD Loop)

1.  **Red Phase**: Create/Update test file. Write failing test. **Verify failure** via `npm test`.
2.  **Green Phase**: Implement minimum code in `src/` to pass tests. Use `waldzell-clear-thought` / `metacognitiveMonitoring` for complex logic.
3.  **Refactor Phase**: Clean up implementation. Logic = Pure Functions. Styles = Tokens.
4.  **Verify**: Rerun tests to ensure success. **Evidence Gate:** You must explicitly read the fresh terminal output to confirm 0 failures. Do not assume the refactor is clean.

### Phase 3: Verification (Quality Gate)

> **EVIDENCE MANDATE:** Claiming work is complete without verification is an illusion. Evidence before assertions, always.

1.  **Audit**: Check for `console.log`, `TODO`s, or hardcoded hex.
2.  **Manual**: Follow the task's specific verification steps (Browser/CLI). You must execute the proving command and read the output before claiming success.
3.  **Sanity**: Ensure bundle size and performance constraints are met.

### Phase 4: Record

1.  **Commit**: `gamemaster(feat|refactor): <description>`.
2.  **Git Notes**: Optional (for individual tasks): Attach a summary of changes using `git notes add -m "<summary>" <hash>` for auditability.
3.  **Update**: Mark task `[x]` in `plan.md`.
4.  **Checkpoint**: If this completes a **Phase**, execute the Checkpointing Protocol.

## 4. Checkpointing Protocol

1.  **Scope**: `git diff --name-only <last_checkpoint> HEAD`.
2.  **Test Coverage**: Verify tests exist for ALL changed code files.
3.  **Automated Verify**: Ensure full suite PASS. **Mandatory:** Do not predict success; present the terminal output proving it.
4.  **Manual Verification Plan**: Draft a step-by-step human-readable testing script for the completed phase (e.g., "1. Run `npm run dev`, 2. Navigate to `/profile`, 3. Confirm X"). Present this to the user and **WAIT** for explicit approval. Do not proceed until the user verifies.
5.  **Checkpoint Commit**: Stage changes and create the checkpoint commit: `gamemaster(checkpoint): <Phase Summary>`.
6.  **High-Fidelity Git Notes**: Construct an **Auditable Verification Report** containing the automated test command used, the manual verification steps provided, and the user's explicit confirmation. Attach it to the checkpoint commit via `git notes add -m "<report_content>" HEAD`.
7.  **Finalize**: Update `.agent/state/tracks.md` with new `checkpoint: <sha>`. Use the "Track Block" format.

## 5. Anti-Patterns

- **Painting the Void**: Writing UI before the state is defined.
- **Blind Commits**: Committing without running tests.
- **Note-less Checkpoints**: Missing context on WHY a phase is finished.
- **Premature Celebration**: Claiming "this should work now" or marking a task complete `[x]` without explicitly executing the proving command and verifying the output.
- **Skipping the Human**: Creating a phase checkpoint without presenting a Manual Verification Plan and getting the user's sign-off.

## 6. Tools

- `view_file` (Context)
- `write_to_file` / `replace_file_content` (Edits)
- `run_command` (Test/Git)
- `sequentialthinking` (Deep Logic)
- `waldzell-metacognitive-monitoring` (Self-Audit)
