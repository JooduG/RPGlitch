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
3. **Quality Gate (Self-Audit)**:
    - **Reactivity**: Are runes (`$state`, `$derived`) used correctly?
    - **Aesthetics**: Does it match the [Chalk Regime](../../rules/06-aesthetic.md)?
    - **Security**: Is `innerHTML` sanitized?
    - **Hygiene**: No console logs or dead code.
4. **Verify**: Run unit tests or use the browser tool for UI validation.
5. **Mark Done**: Change status to `[x]`.

## 3. Checkpoint & Handoff

1. **Update Registry**: Reflect progress in [tracks.md](../../tasks/tracks.md).
2. **Archive/Merge**: When all items are `[x]`, trigger the [Cleanup Protocol](../../warden/clean.md).
3. **Notify**: Inform user of completion and offer proof of work.
