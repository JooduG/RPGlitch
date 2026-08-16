# COLLAPSED Ending — Design Notes (Out of Scope, Implement Later)

**Status:** Backlog · **Origin:** 2026-08-16 unified stress-test report + review

## Context

The Director schema supports three `story_status` values: `IN_PROGRESS`, `CONCLUDED` (quest won), and `COLLAPSED` (quest lost irrevocably).

As of this change set, **auto-dispatch fires for both `CONCLUDED` and `COLLAPSED`** through the same `execute_epilogue()` path — i.e. a collapsed story currently gets the *same* closing epilogue as a victorious one. That is explicitly temporary.

## Desired Special Functionality for COLLAPSED

When the Director marks `story_status: "COLLAPSED"`, the story should close differently from a victory:

- **Different epilogue tone/template** — a tragedy/collapse variant of `SCENE.EPILOGUE` (loss, ruin, unresolved threads, consequences landing). Something like a "the world remembers" close rather than a resolution.
- **Different UI treatment** — e.g. a distinct outcome badge (`💀 STORY COLLAPSED` / `✕ QUEST FAILED` instead of `✨ STORY CONCLUDED`), possibly a darker color scheme/backdrop in `Epilogue.svelte`.
- **A "Retry / Rewind" option?** — collapsed endings are natural places to offer starting the same story over, reverting to a checkpoint, or resuming from the last IN_PROGRESS turn. Needs a decision on what "retry" means for entity state (the Director may have mutated entities toward the collapse; a rewind needs a snapshot/restore mechanism).
- **Modal confirmation before a collapse lands?** — arguably the most destructive outcome; the player may deserve a warning that their next turn will end the story in collapse. Requires a UI hook between the Director decision and the epilogue dispatch.

## Suggested Implementation Sketch

1. Thread the `story_status` through `execute_turn` (already done) and pass it into `execute_epilogue(story_id, { status })` or a new `execute_collapse(story_id)`.
2. Add `SCENE.COLLAPSE` to `PROTOCOL_LIBRARY` in `src/data/definitions/protocols.js` with the tragedy narrative.
3. In `Epilogue.svelte` / `Message.svelte`, branch on the epilogue entry's meta (`is_collapse: true`) for badge + styling.
4. Decide retry semantics and, if desired, snapshot entity state before the collapse turn so a "rewind" is possible.

## Open Questions

- Should COLLAPSED require player confirmation before auto-dispatch, or auto-land like CONCLUDED?
- Should a collapsed story be claimable again (entities freed back to the storyboard) immediately, like concluded ones? (`repository.resolve_active_entity_claims` currently treats both `is_concluded` and epilogue-logged stories as free — verify this matches the desired UX.)
- Do we want a distinct export header in `story-export.js` for collapsed stories ("Collapsed" instead of "Concluded")?
