---
id: track-4-ui-ux-harmonization-2026-08-24
title: "Track 4: UI/UX Harmonization, Entity Databoxes, Message Header Pin & Interactive Guards"
type: feature
status: proposed
created_at: 2026-08-24
author: Strategy Architect
dependencies:
  - track-1-director-quick-shot-2026-08-24
  - track-2-back-shot-rolling-worker-2026-08-24
---

## Track 4 — UI/UX Harmonization, Single-Entity Telemetry Databox, Message Header Pin & Story Navigation

> **Goal**: Polish surface presentation and user controls: single-entity forged telemetry databoxes (cyan theme), click-to-pin message headers, 1-active-story session enforcement, and failed image Retry/Dismiss actions.

---

## 1. Context & Architectural Rationale

Elevating RPGlitch's visual fidelity and tactile responsiveness requires harmonizing telemetry and sensory states with our Nordic research terminal aesthetic (`DESIGN.md`):

1. **Single-Entity Forged Telemetry (Cyan Theme)**: Re-use the existing `DataBox.svelte` primitive inside `TelemetryBlocks.svelte` / `TelemetryVector.svelte` to show the single entity forged in this turn's Back Shot (plus the Director Quick Shot note in thoughts and text-based relational mutations). Avoid entity portraits and maintain pure cyan DevMode styling (`var(--color-dev-accent)`).
2. **Message Header Focus & Action Pin**: Fix the brittle focusout behavior where clicking an action button (copy/edit/speak) on an extended header prematurely collapses the header. Clicking anywhere on the message body or header cleanly pins/toggles the header open.
3. **1 Active Story Restriction & Direct Resume**:
   - The user is restricted to **1 active story at a time**.
   - If an active story exists and slot selection is incomplete on the Storyboard, the bottom bar dynamically shows **`"ENTER STORYMODE"`** / **`"RESUME STORY"`** (1-click navigation to the active feed).
   - When all 3 slots are selected and the user clicks **`"BEGIN STORY"`**, the engine auto-concludes the previous active story (`is_concluded: 1`), releasing all entities and cleanly starting the new session without entity-claim lock errors.
4. **User Agency on Failed Images**: Replace silent ghost sweeper deletions with an interactive failure card offering `[Retry]` and `[Dismiss]` actions.

---

## 2. Current Verified State

- **Telemetry Display**: [`src/ui/message/TelemetryCard.svelte`](../../src/ui/message/TelemetryCard.svelte) & [`src/ui/message/TelemetryBlocks.svelte`](../../src/ui/message/TelemetryBlocks.svelte)
  - Displays multi-entity structure rather than emphasizing the active single forged entity from Track 2 (`meta.forged_entity` / `meta.forged_entities`).
- **Header Expansion Interaction**: [`src/ui/message/Message.svelte`](../../src/ui/message/Message.svelte) & [`src/ui/message/MessageHeader.svelte`](../../src/ui/message/MessageHeader.svelte)
  - `is_extended` is derived purely from transient `onfocusin` / `onfocusout` (`tabindex="0"`). Clicking a header action button blurs the parent div and immediately collapses the header.
- **Active Story Claim Lock**: [`src/ui/Storyboard.svelte.js:212-217`](../../src/ui/Storyboard.svelte.js)
  - Silently blocks `begin()` if any selected entity was claimed by an active session instead of concluding the prior session or offering direct resume.
- **Failed Image Handling**: [`src/ui/message/Attachments.svelte`](../../src/ui/message/Attachments.svelte)
  - Failed images have partial error styling but need robust integration with `visual.svelte.js` retry pipelines.

---

## 3. Deep-Dive Technical Design

### 3.1 Single-Entity Forged Telemetry Databox (Cyan Theme)

- Redesign the telemetry block to render the single entity forged in this turn's Back Shot using the `DataBox.svelte` primitive:
  - **Entity Identifier**: Monospace role badge (e.g. `[AI_CHARACTER: Viper]`, `[USER: Ghost]`, `[FRACTAL: Void]`, `[NPC: Dr. Elias]`) in terminal cyan (`var(--color-dev-accent)`). No portraits.
  - **Director Quick Shot Scaffolding**: Director note is presented in the collapsible thoughts block.
  - **Mathematical Dynamics Deltas**: Clean visual bars and numeric indicators ($\Delta \text{intensity}$, $\Delta \text{affinity}$) in cyan.
  - **Forged Memory**: Render the memory vector content and emotional weight integer (1–10).
  - **Outward Relational Mutations**: Render plain-text directed vector strings (e.g. `Viper → Ghost: cautious trust`).

### 3.2 Robust Click-to-Pin Message Header & Action Toolbar

- Replace transient `onfocusin` / `onfocusout` with explicit click-to-pin state:
  - Clicking a message body or header toggles `pinned_header_id` in app state or local component state.
  - Clicking header action buttons (Copy text, Edit prompt, Speak TTS, Regenerate) executes immediately without collapsing the header.
  - Clicking outside or clicking another message cleanly transfers pin state or closes the toolbar.

### 3.3 1 Active Story Restriction & Storyboard Direct Navigation Button

- **1 Active Story Invariant**:
  - Only 1 unconcluded story may exist at any time.
  - To start a new story, the active story must be concluded or deleted (via control panel or epilogue).
- **Storyboard Direct Resume Button**:
  - **Whenever there is an active story in progress**, the bottom bar button is **always replaced with `"ENTER STORYMODE"`** (or **`"RESUME STORY"`**), even if 3 free entities are preselected in the slots.
  - Clicking it directly switches to `app.view = "story"` to resume the active narrative.
  - `"BEGIN STORY"` (or `"SELECT ENTITIES"`) is only shown when there is **no** active story in progress.

### 3.4 Interactive Image Failure Card (Retry & Dismiss)

- On image timeout or network failure:
  - Render an interactive card inside `Attachments.svelte`.
  - **`[Retry]`**: Re-dispatches `visual_engine.visualize` using the cached `attachment.metadata.prompt`.
  - **`[Dismiss]`**: Removes the placeholder attachment cleanly via `session_driver.delete_log_attachment()`.

---

## 4. Tactical Blueprint & Phasing

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

## 5. File Changes

- [`src/ui/message/TelemetryCard.svelte`](../../src/ui/message/TelemetryCard.svelte) & [`src/ui/message/TelemetryBlocks.svelte`](../../src/ui/message/TelemetryBlocks.svelte) — Single-entity forged databox.
- [`src/ui/message/Message.svelte`](../../src/ui/message/Message.svelte) & [`src/ui/message/MessageHeader.svelte`](../../src/ui/message/MessageHeader.svelte) — Click-to-pin message header.
- [`src/ui/console/StoryboardBar.svelte`](../../src/ui/console/StoryboardBar.svelte) — Direct "ENTER STORYMODE" resume navigation button.
- [`src/ui/message/Attachments.svelte`](../../src/ui/message/Attachments.svelte) — Interactive image Retry and Dismiss actions.

---

## 6. Verification Gate & Acceptance Criteria

- [x] Single forged entity databox renders in terminal cyan with dynamics deltas, forged memory, and relational text vectors.
- [x] Clicking header buttons executes actions without prematurely collapsing the message header.
- [x] Storyboard bottom bar always shows `"ENTER STORYMODE"` when an active story exists, navigating to the feed in 1 click.
- [x] Failed image attachments allow 1-click retry or dismissal.
- [x] All automated tests pass: `npm run deploy:prepare` (0 lints, 100% tests passing, clean build).
