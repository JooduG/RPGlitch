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

- `Console.svelte` (formerly `UnifiedConsole.svelte`) line count reduced from 942 to < 200 lines.
- `Message.svelte` line count reduced from 750 to < 120 lines.
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

---

## 3.0 ## PRESENT (Pulse & Active State)

- **Active Task**: Task 3.1: Extract `MessageHeader.svelte`.
- **Status**: Executing Phase 3.
