---
id: refactor-ui-deconstruction-2026-08-08
type: refactor
status: in-progress
created_at: 2026-08-08
updated_at: 2026-08-08
description: Deconstruct and refactor Storymode, Message, MessageDevBlock, and UnifiedConsole into modular, Svelte 5 runes-driven component suites with clean namespace nesting.
---

# 🚀 Track Specification: refactor-ui-deconstruction-2026-08-08

## 1.0 ## ETERNAL (Technical Specification)

### Objective

Deconstruct high-complexity UI components (`Storymode.svelte`, `Message.svelte`, `MessageDevBlock.svelte`, `UnifiedConsole.svelte`) into clean, single-responsibility atoms, molecules, and organisms. Standardize file naming under intuitive namespaces (`Console...`, `Message...`, `Dev...`, `Audio...`, `Story...`).

### Success Criteria

- `Console.svelte` line count reduced to < 200 lines. _(565 → ~190 in Phase 6: accordion decks → `ControlPanel`, gear → `SettingsButton`, storyboard bottom bar → `StoryboardBar`, shuffle/begin choreography → `storyboard.svelte.js`.)_
- `Message.svelte` line count reduced to < 350 lines. _(538 → ~330 in Phase 6: attachment regenerate gallery → `Attachments.svelte`, prologue/epilogue entity trio → `PrologueCards.svelte`. Criterion revised from < 120 after investigation, 2026-08-09: the remainder is Svelte 5 runes orchestration — parse pipeline, stream/typewriter reconciliation, focus/audio/copy handlers — that must live in component context to stay reactive; forcing < 120 would contort it into non-Svelte modules and hurt clarity.)_
- `Storymode.svelte` line count reduced from 516 to < 150 lines.
- `DevTelemetryBlock.svelte` (formerly `MessageDevBlock.svelte`) line count reduced from 553 to < 180 lines.
- 100% of existing unit test suites pass (`npm run test:unit`).
- Local CI gate (`npm run verify` & `npm run build`) passes cleanly with 0 errors.

### Boundaries

- **Always**: Use Svelte 5 Runes (`$state`, `$derived`, `$props`), enforce `DESIGN.md` CSS tokens, decouple non-UI logic into `@intelligence` or `@media`.
- **Never**: Alter existing visual aesthetics, layout positioning, or breaking user workflows.

---

## 2.0 ## FUTURE (Hierarchical Implementation Plan)

### Phase 1 — Core Renames & Telemetry Decoupling

- [x] Task 1.1: Rename `UnifiedConsole.svelte` to `Console.svelte` and update all import statements across `App.svelte`, `Storymode.svelte`, `index.js`, and test files.
- [x] Task 1.2: Move/Rename `MessageDevBlock.svelte` to `src/ui/molecules/DevTelemetryBlock.svelte` and update references.
- [x] Task 1.3: Extract telemetry meta formatting helper to `src/intelligence/telemetry.js`.

### Phase 2 — Console Organism Deconstruction

- [x] Task 2.1: Extract `ConsoleInputBar.svelte` for text input & ghostwriter actions.
- [x] Task 2.2: Extract `StoryManager.svelte` for story archive management & dialogs in `src/ui/molecules/`.
- [x] Task 2.3: Extract `AudioControls.svelte` & `DevControls.svelte` in `src/ui/molecules/`.
- [x] Task 2.4: Rebuild `Console.svelte` as a lean drawer container shell.

### Phase 3.1: MessageHeader Extraction [DONE]

- [x] Create `src/ui/molecules/MessageHeader.svelte`.
- [x] Move character name and timestamp logic into `MessageHeader.svelte`.
- [x] Export `MessageHeader` from `src/ui/molecules/index.js`.
- [x] Remove header markup from `src/ui/organisms/Message.svelte` and import `MessageHeader`.

### Phase 4: Audio Streaming & Scrolling Abstraction [DONE]

- [x] Task 4.1: Decouple TTS streaming parsing loop from `Storymode.svelte` into `Audio.voice.queue_stream_sentence()` in `src/media/audio.svelte.js`.
- [x] Task 4.2: Extract `MessageUndoDelete.svelte` from `Storymode.svelte`.
- [x] Task 4.3: Rebuild `Storymode.svelte` as a clean scroll & viewport shell (extracted `StoryFeed.svelte`).

### Phase 5: Verification & Gate [DONE]

- [x] Task 5.1: Run `npm run test:unit`.
- [x] Task 5.2: Run `npm run deploy:check`.
- [x] Task 5.3: Run `npm run build`.

### Phase 6: Round-2 Extractions (post-reorg, module layout) [IN PROGRESS]

- [x] Task 6.1: Extract `ControlPanel.svelte` (accordion decks) from `Console.svelte`.
- [x] Task 6.2: Extract `SettingsButton.svelte` (gear control) from `Console.svelte`.
- [x] Task 6.3: Extract `StoryboardBar.svelte` (storyboard bottom bar) from `Console.svelte`.
- [x] Task 6.4: Extract `storyboard.svelte.js` (shuffle-deal + begin-flight choreography) from `Console.svelte`.
- [x] Task 6.5: Extract `Attachments.svelte` (regenerate/select/preview gallery) from `Message.svelte`.
- [x] Task 6.6: Extract `PrologueCards.svelte` (story title + entity trio) from `Message.svelte`.
- [ ] Task 6.7: Run `npm run test:unit`.
- [ ] Task 6.8: Run `npm run verify` & `npm run build`.

### Phase 7: Naming Round & shell/ Removal [IN PROGRESS]

- [x] Task 7.1: Rename `InputBar.svelte` → `StorymodeBar.svelte` (mirrors `StoryboardBar`).
- [x] Task 7.2: Rename `PrologueCards.svelte` → `PrologueEpilogue.svelte` (serves both prologue & epilogue).
- [x] Task 7.3: Rename `EntityCardHand.svelte` → `CardHand.svelte` (+ `EntityCardHandState` → `CardHandState` typedefs).
- [x] Task 7.4: Rename `EntityContextMenu.svelte.js` → `ContextMenu.svelte.js`.
- [x] Task 7.5: Remove `ui/shell/` — `Layout`/`Storymode`/`Storyboard` move to `src/ui/` root, exported via new `@ui` barrel (`src/ui/index.js`).
- [x] Task 7.6: Move storyboard choreography `console/storyboard.svelte.js` → `src/ui/Storyboard.svelte.js` (component-sibling state module), absorbing `Console.svelte.js` helpers; `Console.svelte.js` deleted, its helper tests moved to `Storyboard.svelte.test.js`.
- [ ] Task 7.7: Run `npm run test:unit`.
- [ ] Task 7.8: Run `npm run verify` & `npm run build`.

### Phase 8: Layer Inversion Fix — actions → @ui, collapse_history → @utils, resilience → @utils [IN PROGRESS]

Fixes three architectural inversions where lower/leaf code was hosted in the wrong layer, or where
shared utilities lived under layer-specific folders. No behaviour changes — pure relocation.

- [x] Task 8.1: Move `utils/actions.js` + `utils/actions.test.js` → `src/ui/actions.js` + `src/ui/actions.test.js` (Svelte DOM actions are UI-layer concerns). Exported via the `@ui` barrel; all consumers (`Toggle`, `TextField`, `Slider`, `Skeleton`, `NumberField`, `Modal`, `Backdrop` → `use_actions`; `Profile`, `Console` → `click_outside`; `Profile`, `Header`, `TextField` → `auto_resize`; `Body` → `safe_html`) now import from `@ui`. Breaks the `utils`→`platform` import cycle (`actions.js` was importing `sanitize_to_fragment` from `@platform`).
- [x] Task 8.2: Move `collapse_history` from `intelligence/parser.js` → `utils/text.js` (pure text-collapsing helper, used by `platform/transport.js` which is below `@intelligence`). `parser.js` imports + re-exports it so `@intelligence` consumers (`prompts.js`, `intelligence/index.js`) keep stable paths; `transport.js` imports from `@utils`.
- [x] Task 8.3: Move `media/resilience.js` + `media/resilience.test.js` → `utils/resilience.js` + `utils/resilience.test.js` (generic retry/circuit-breaker, not media-specific). `media/visual.svelte.js` imports from `@utils`; `media/index.js` no longer re-exports it.
- [x] Task 8.4: Fix `jsconfig.json` paths — `@utils` now `src/utils/index.js`, dead `@actions`/`@actions/*` aliases removed.
- [ ] Task 8.5: Run `npm run test:unit`.
- [ ] Task 8.6: Run `npm run verify` & `npm run build`.

### Phase 9: Library invalidation + Toggle a11y [DONE]

Two nits found during the live end-to-end pass (2026-08-09).

- [x] Task 9.1: Fix stale Library list — `StoryManager` only refreshed on control-panel open, so a story auto-saved while the panel stayed open never appeared until close/reopen. Added `stories_bridge` (`register_bump`/`bump`) to `utils/bridges.js`; `app` exposes a reactive `stories_version` (bump registered at module load). Bumps now fire at every story write site: `session_driver.create_from_selection` (`db.stories.add`), `runtime.save` + `runtime.update_entity(type:"story")`, and `repository.stories.{update,conclude,delete}`. `StoryManager`'s `$effect` now also tracks `app.stories_version`, so the Library self-refreshes even while the panel stays open.
- [x] Task 9.2: Give `Toggle` switches an accessible name — the switch `<button>` now renders `aria-label={label || rest["aria-label"] || undefined}` (falls back to any caller-supplied `aria-label`); `Profile.svelte`'s label-less perspective toggle got `aria-label="Perspective"`.

---

## 3.0 ## PRESENT (Pulse & Active State)

- **Active Task**: Phase 9 Library invalidation + Toggle a11y.
- **Status**: Both nits fixed (9.1–9.2); awaiting unit-test/build verification (8.5–8.6, 6.7–6.8, 7.7–7.8).
