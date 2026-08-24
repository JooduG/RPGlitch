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

## Track 4 — UI/UX Harmonization, Entity Databoxes, Message Header Pin & Interactive Guards

> **Goal**: Polish surface presentation and user controls: entity-specific telemetry databoxes, robust message header pin/focus handling, interactive active-story guards, and failed image Retry/Dismiss actions.

---

## 1. Context & Architectural Rationale

Elevating RPGlitch's visual fidelity and tactile responsiveness requires harmonizing telemetry and sensory states with our Nordic research terminal aesthetic (`DESIGN.md`):

1. **Raw Telemetry $\rightarrow$ Entity Databoxes**: Replace developer JSON dumps with entity-specific `DataCard` panels modeled after the Memory Forge presentation.
2. **Message Header Focus & Action Pin**: Fix the brittle focusout behavior where clicking an action button (copy/edit/speak) on an extended header prematurely collapses the header.
3. **Interactive Safety**: Guard active sessions from accidental destruction and give users manual agency over failed image generations.

---

## 2. Current Verified State

- **Telemetry Display**: Collapsible raw block in `Message.svelte` (`TelemetryCard.svelte` / `TelemetryBlocks.svelte`).
- **Header Expansion Bug**: In `Message.svelte`, `is_extended` is derived purely from transient `onfocusin` / `onfocusout` (`tabindex="0"`). Clicking a header action button blurs the parent div and immediately collapses the header.
- **Active Story Check**: Storyboard checks entity claim status (`Storyboard.svelte.js:215`), but lacks an interactive modal for active sessions.
- **Failed Image Handling**: Timed-out or errored image generations are swept automatically without offering a user retry.

---

## 3. Deep-Dive Technical Design

### 3.1 Entity-Specific Telemetry Databoxes

- Redesign the telemetry block into individual `DataCard` components per entity (AI Character, User Persona, Fractal, NPC).
- Visual tokens:
  - Signature entity accent badges.
  - Active dynamics deltas with directional indicators ($\Delta \text{intensity}$, $\Delta \text{affinity}$).
  - Clean RAG vector provenance pills with cosine relevance scores.

### 3.2 Robust Message Header Pin & Click-to-Inspect

- Replace brittle focusout collapse with explicit card click/pin management:
  - Clicking a message expands its header and action toolbar.
  - Clicking header buttons (Copy, Edit, Speak, Regenerate) executes the action without collapsing the header.
  - Clicking outside or clicking another message cleanly transfers focus.

### 3.3 Interactive Active-Story Guard Modal

- When a user attempts to start a new story while an active story is loaded:
  - **`[Resume Active Story]`**: Navigates straight to the active narrative view.
  - **`[Conclude & Archive]`**: Cleanly executes `stories.conclude()` and starts the new story.
  - **`[Cancel]`**: Closes modal and remains on the Storyboard.

### 3.4 Ghost Image "Retry / Dismiss" Actions

- Instead of silently purging errored or timed-out images:
  - Render an interactive card with **`[Retry Generation]`** and **`[Dismiss]`** buttons.
  - Retain the synthesized image prompt in `attachment.metadata` for instant re-dispatch.

---

## 4. Tactical Blueprint & Phasing

### Phase 1: Entity-Specific Telemetry Databoxes

- [ ] `task-1.1`: **`RED`** Create unit/component tests in `src/ui/message/TelemetryCard.test.js` asserting individual entity databox rendering matching the Memory Forge aesthetic.
- [ ] `task-1.2`: **`GREEN`** Refactor `TelemetryCard.svelte` / `TelemetryBlocks.svelte` to render discrete cards per entity with signature color badges, dynamics deltas, and retrieved RAG vectors.

### Phase 2: Message Header Pin & Focus State Refactor

- [ ] `task-2.1`: **`RED`** Component test asserting header remains expanded when clicking header action buttons (copy, speak, edit).
- [ ] `task-2.2`: **`GREEN`** Refactor `Message.svelte` and `MessageHeader.svelte` to manage focus/pinned state explicitly without premature focusout collapse.

### Phase 3: Interactive Active-Story Guard & Ghost Image Actions

- [ ] `task-3.1`: **`RED`** Test active-story modal dialog trigger on attempt to start a new story over an in-progress session.
- [ ] `task-3.2`: **`GREEN`** Build interactive modal in `src/ui/console/` with `[Resume Active Story]`, `[Conclude & Archive]`, and `[Cancel]` options.
- [ ] `task-3.3`: **`GREEN`** Replace silent ghost sweeper deletions with interactive **`[Retry Generation]`** and **`[Dismiss]`** action buttons on failed image cards.

---

## 5. File Changes

- [`src/ui/message/TelemetryCard.svelte`](../../src/ui/message/TelemetryCard.svelte) & [`src/ui/message/TelemetryBlocks.svelte`](../../src/ui/message/TelemetryBlocks.svelte) — Entity-specific databox rendering.
- [`src/ui/message/Message.svelte`](../../src/ui/message/Message.svelte) & [`src/ui/message/MessageHeader.svelte`](../../src/ui/message/MessageHeader.svelte) — Pinned header state and click handling.
- [`src/ui/console/Console.svelte`](../../src/ui/console/Console.svelte) & [`src/ui/Storyboard.svelte.js`](../../src/ui/Storyboard.svelte.js) — Active story modal wrapper.
- [`src/media/visual.svelte.js`](../../src/media/visual.svelte.js) — Interactive Retry dispatch and Dismiss APIs.

---

## 6. Verification Gate & Acceptance Criteria

- [ ] Clicking header action buttons executes actions without prematurely collapsing the message header.
- [ ] Per-entity databoxes render cleanly in the message feed with signature colors and RAG pills.
- [ ] Failed image attachments render interactive Retry / Dismiss actions.
- [ ] Storyboard modal prevents accidental overwrites of active stories.
- [ ] Mobile and desktop responsive layouts verified.
- [ ] Automated tests: `npm run test:unit` passes with 0 errors.
- [ ] Production build: `npm run build`
