# 🎯 Active Track Implementation Plan: Track 4 — UI/UX Harmonization, Single-Entity Telemetry Databox, Message Header Pin & Story Navigation

**Track ID**: `track-4-ui-ux-harmonization-2026-08-24`  
**Dependencies**: `track-1-director-quick-shot-2026-08-24`, `track-2-back-shot-rolling-worker-2026-08-24`, `track-3-decoupled-image-cooldowns-2026-08-24`  
**Status**: `[~]` In Progress

---

## 1. Goal & Architectural Overview

Polish surface presentation and tactile user controls across the RPGlitch storymode interface:

1. **Single-Entity Forged Telemetry Databox (Cyan Theme)**: Re-use `DataBox.svelte` inside `TelemetryBlocks.svelte` / `TelemetryVector.svelte` to render the single entity forged in this turn's Back Shot (plus the Director note in thoughts and plain-text relational vectors). Avoid entity portraits and maintain terminal cyan styling (`var(--color-dev-accent)`).
2. **Robust Click-to-Pin Message Header**: Replace transient focusout collapse with a click-to-pin interaction model on message headers and action toolbars (Copy, Speak, Edit, Regenerate).
3. **1 Active Story Restriction & Direct Resume**: Restrict session to 1 active story at a time. If an active story exists and slots are incomplete, show `"ENTER STORYMODE"` / `"RESUME STORY"` on the Storyboard. When starting a fresh story, auto-conclude the prior session.
4. **Interactive Image Failure Card**: Provide manual agency on failed/timed-out images via `[Retry]` and `[Dismiss]` actions.

---

## 2. Technical Alignments & Design Rules

1. **Single-Entity Forged Telemetry Databox (Cyan Theme)**:
   - Matches the single-entity rolling worker from Track 2 (`meta.forged_entity` / `meta.forged_entities`).
   - Styled with terminal cyan (`var(--color-dev-accent)`). No portraits.
   - Shows role badge, dynamics deltas, forged memory vector, and plain text relational mutations.
2. **Message Header Pinning**:
   - Clicking anywhere on a message body or header toggles the pinned header toolbar.
   - Clicking action buttons inside the toolbar executes the handler without collapsing the header.
   - Clicking outside or clicking another message cleanly transfers pin state or closes the toolbar.
3. **1 Active Story Restriction & Storyboard Direct Resume Button**:
   - Only 1 unconcluded story may exist at any time.
   - **Whenever an active story exists**, the bottom bar button is always **`"ENTER STORYMODE"`** (or **`"RESUME STORY"`**), even if 3 free entities are selected in the slots.
   - Clicking it directly switches to `app.view = "story"` to resume the active narrative without going through the control panel.
   - `"BEGIN STORY"` is only shown when there is **no** active story in progress.
4. **Interactive Image Failure**:
   - Errored / timed-out image attachments render interactive `[Retry]` (re-dispatches with cached prompt) and `[Dismiss]` (removes attachment) actions.

---

## 3. Tactical Phases

### Phase 1: Single-Entity Forged Telemetry Databox

- [x] `task-1.1`: **`RED`** Create unit/component tests in `src/ui/message/TelemetryCard.test.js` asserting single-entity forged databox rendering in terminal cyan with dynamics deltas and relational text vectors.
- [x] `task-1.2`: **`GREEN`** Refactor `TelemetryCard.svelte` / `TelemetryBlocks.svelte` to render the focused single-entity forged databox.

### Phase 2: Click-to-Pin Message Header & Action Toolbar

- [x] `task-2.1`: **`RED`** Component tests asserting header and action buttons remain open on button clicks and toggle on message body click.
- [x] `task-2.2`: **`GREEN`** Refactor `Message.svelte` and `MessageHeader.svelte` to implement click-to-pin interaction model.

### Phase 3: 1 Active Story Restriction & Storyboard Direct Resume Button

- [x] `task-3.1`: **`RED`** Unit test asserting Storyboard bottom bar always displays `"ENTER STORYMODE"` whenever an active story exists regardless of slot count.
- [x] `task-3.2`: **`GREEN`** Update `StoryboardBar.svelte` to show `"ENTER STORYMODE"` whenever an active story is present.

### Phase 4: Interactive Image Failure Card (Retry & Dismiss)

- [x] `task-4.1`: **`RED`** Test Retry and Dismiss button behaviors on failed image attachments.
- [x] `task-4.2`: **`GREEN`** Wire interactive `[Retry]` and `[Dismiss]` handlers in `Attachments.svelte` with `visual.svelte.js`.

---

## 4. Verification Gate & Acceptance Criteria

- [ ] Single forged entity databox renders with signature styling, Quick Shot note, and forged memory.
- [ ] Clicking header buttons executes actions without prematurely collapsing the message header.
- [ ] Active-story guard modal protects in-progress stories from accidental overwrites.
- [ ] Failed image attachments allow 1-click retry or dismissal.
- [ ] All automated tests pass: `npm run deploy:prepare` (0 lints, 100% tests passing, clean build).
