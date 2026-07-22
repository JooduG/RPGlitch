# 📜 FUTURE (The Muscle)

> **Role**: Active implementation blueprint for the _current_ track.
> **Status**: Completed (`fix-2026-07-22-storymode-bugs`).

This file mirrors the completed implementation plan from [`tasks/tracks/fix-2026-07-22-storymode-bugs.md`](./tracks/fix-2026-07-22-storymode-bugs.md).

## ✅ Completed Mission: Storymode & Import UX Bug Fixes

Track ID: `fix-2026-07-22-storymode-bugs`

### Phase 1: Import Modal & CardHand Overlay Z-Index Fix

- [x] Fix z-index stacking and backdrop blur in `CardHand.svelte` and `ImportEntity.svelte`.
- [x] Redesign `ImportEntity.svelte` modal with generous padding, clean card toggles, and proper responsive bounds.

### Phase 2: Prologue & Epilogue Metadata, Image Generation, & 3-Card Layout

- [x] Update `execute_prologue()` and `execute_epilogue()` in `src/intelligence/kernel.js` to set `{ is_prologue: true }` and `{ is_epilogue: true }` in message metadata.
- [x] Trigger `visual_engine.visualize()` in both prologue and epilogue so scene images are generated and attached.
- [x] Ensure `Message.svelte` cleanly renders the 3-entity header row and bottom image attachment for both prologue and epilogue.

### Phase 3: Audio Protection & Ghostwriter Binding

- [x] Protect active TTS playback in `src/media/audio.svelte.js` so starting a turn doesn't cut off ongoing Fractal reading unless explicitly interrupted by user.
- [x] Fix `gamemaster.execute_ghostwriter` binding in `src/intelligence/kernel.js` and export in `src/intelligence/index.js`.

### Phase 4: Session State Reset & Library Deduplication

- [x] Update "End Story" and "Return to Storyboard" handlers in `src/state/app.svelte.js` / `src/engine/session.svelte.js` to reset `runtime.story_id = null` and `runtime.round = 0`.
- [x] Deduplicate story list in `repository.js` / `UnifiedConsole.svelte` library accordion.
