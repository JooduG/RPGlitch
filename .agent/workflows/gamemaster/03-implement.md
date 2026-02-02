---
description: Executes the implementation plan for a defined track.
---

# ⚔️ 03: Implement Protocol

> **Goal:** Systematic execution of the implementation plan with strict Quality Gates.

## 1. Context Loading

1. **Select Track**:
    - Input: Track Name or first incomplete item in [tracks.md](../../tasks/tracks.md).
2. **Synchronize View**:
    - Read `spec.md` and `plan.md` from the track directory.

## 2. Execution Loop

For each unchecked item `[ ]` in `plan.md`:

1. **Mark Active**: Change status to `[/]`.
2. **Execute**: Implement logic following [.agent/rules/](../rules/) and relevant [skills/](../../skills/).
    - **State**: If creating new global state, use `node .agent/skills/gamemaster/scripts/scaffold_state.py`.
3. **Quality Gate (Self-Audit)**:
    - **Reactivity**: Are runes (`$state`, `$derived`) used correctly?
    - **Aesthetics**: Does it match the [Chalk Regime](../../rules/06-aesthetic.md)?
    - **Security**: Is `innerHTML` sanitized?
    - **Hygiene**: No console logs or dead code.
4. **Verify**: Run unit tests or use the browser tool for UI validation.
5. **Mark Done**: Change status to `[x]`.

## 3. Checkpoint & Handoff (The Conductor Loop)

1.  **Verification Report**:
    - **Automated**: Run tests and record the command/result.
    - **Manual**: Draft a step-by-step verification plan for the user (Start server -> URL -> Expected Result).
2.  **User Confirmation**: Await explicit user feedback before checkpointing.
3.  **Checkpoint Commit**:
    - Stage changes.
    - Commit: `gamemaster(checkpoint): End of Phase <X>`.
    - **Git Note**: Attach the verification report to the commit via `git notes add -m "<report>" <sha>`.
4.  **Update Registry**: Reflect the `[checkpoint: <sha>]` in the track's `plan.md` and [tracks.md](../../tasks/tracks.md).
5.  **Notify**: Inform user that the phase is anchored.
