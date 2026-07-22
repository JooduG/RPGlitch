# Track: Storymode & Import UX Bug Fixes

## ETERNAL (The Spec)

### Objective
Fix all reported Storymode, Import modal, Prologue/Epilogue layout, Audio playback interruption, End Story session state reset, and Ghostwriter execution issues.

### Success Criteria
- [x] Import modal UI redesigned with proper padding, min-width, glassmorphic styling, and clean z-index separation so cardhand slots stay behind backdrop blur.
- [x] `execute_prologue()` and `execute_epilogue()` in `kernel.js` explicitly attach `is_prologue: true` / `is_epilogue: true` to message metadata AND generate inline scene image attachments.
- [x] `Message.svelte` 3-entity header row (`[User Persona] [AI Character] [Fractal]`) renders for all prologue and epilogue messages.
- [x] Audio engine speech synthesis/playing does NOT get cancelled prematurely when an AI turn begins while a Fractal message is speaking.
- [x] Ending a story or clicking "Return to Storyboard" resets `runtime.story_id` so clicking "Begin Story" starts a fresh new story session instead of appending to the old session.
- [x] Library accordion in `UnifiedConsole.svelte` deduplicates stories by `story_id`.
- [x] `gamemaster.execute_ghostwriter()` is cleanly bound and exported on the `gamemaster` singleton object in `kernel.js` and `index.js`.

## FUTURE (Implementation Plan)

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
