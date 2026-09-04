# 🎯 Active Track Implementation Plan: Generation Flow, Speaker Avatar Thinking Indicators & Storyboard Active Session Guards

**Track ID**: `track-generation-flow-and-storyboard-guards-2026-09-04`  
**Dependencies**: `tasks/PRESENT.md`, `scribbles.md`, `DESIGN.md`  
**Status**: `[~]` In Progress

---

## 1. Goal & Architectural Overview

Implement the generation lifecycle sequence and storyboard session guards captured in `scribbles.md`:

1. **Generation Lifecycle & Speaker Thinking Indicators**:
   - **Director Thinking Phase**: When the user sends a turn (or generation initiates), display a subtle Director thinking indicator / shimmer.
   - **Speaker Portrait Reveal**: Once the Director selects the next speaker (`simulation_state.generating_entity`), display the selected speaker's portrait badge on the active pending generation block in the left column.
   - **Speaker Portrait Thinking Animation**: While waiting for generation and text streaming to begin, the speaker's avatar badge displays an active thinking/processing state (e.g. pulse / subtle radar shimmer or breathing border in entity signature color).
   - **Chat Bubble & Typewriter Stream**: When the text stream starts generating visible prose, the message chassis spawns and the `Typewriter` kinetic text engine renders the stream.
   - **Stream Completion & Audio Chime**: Once the typewriter streaming concludes, the portrait thinking indicator finishes cleanly and the turn completion audio cue/chime triggers.

2. **Storyboard Active Story Guard Modal**:
   - When attempting to begin a story from the storyboard while another active session exists, trigger an active story guard dialog offering explicit choices:
     - **Resume Active Story**: Navigate directly back to the ongoing storymode session.
     - **Conclude & Start New**: Archive/conclude the current session and initialize the new story.
     - **Cancel**: Dismiss the dialog and remain on the storyboard.

3. **Motion & Shimmer Harmonization**:
   - Audit and tune the image generation shimmer intensity (moderating aggressive contrast/speed per `scribbles.md`).
   - Sync or harmonize the shimmer pulse cadence with the typewriter engine rhythm where applicable.

---

## 2. Tactical Phases

### Phase 1: State Store & Lifecycle Telemetry (`simulation_state` & `chrono_engine`)

- [ ] `task-1.1`: Extend `simulation_state` in `src/state/status.svelte.js` with fine-grained stage flags (`director_thinking`, `speaker_thinking`, `speaker_selected`) and clean transition methods (`start_director_stage()`, `set_delegated_speaker()`, `start_stream_stage()`, `finish_turn()`).
- [ ] `task-1.2`: Wire stage transitions inside `src/state/chrono.svelte.js` and `src/intelligence/story-pipeline.js` so Director quick shot start/finish transitions cleanly to delegated speaker attribution before streaming.

### Phase 2: Feed & Message Speaker Thinking Indicator UI

- [ ] `task-2.1`: Build or adapt a dedicated pending generation slot in `src/ui/message/Feed.svelte` that renders when `simulation_state.busy` and streaming content is not yet committed.
- [ ] `task-2.2`: Render the speaker avatar in the left gutter with a signature-color kinetic thinking indicator (subtle pulse / radar shimmer) during `speaker_thinking`.
- [ ] `task-2.3`: Transition smoothly from the thinking indicator to the active message chassis when streaming begins, ensuring completion chime fires when typewriter finishes.

### Phase 3: Storyboard Active Story Guard Dialog

- [ ] `task-3.1`: In `src/ui/console/StoryboardBar.svelte` and `src/ui/storyboard.svelte.js`, implement the Active Story Guard dialog when `has_active_story` and the user triggers "BEGIN STORY" with a new entity selection.
- [ ] `task-3.2`: Provide clear actions: "Resume Story", "Conclude & Start New", and "Cancel".

### Phase 4: Shimmer & Motion Tuning

- [ ] `task-4.1`: Soften the image generation shimmer in `src/ui/motion/Shimmer.svelte` and attachment preview cards (taming aggressive contrast/opacity).
- [ ] `task-4.2`: Run static analysis, design audits, and test suites (`npm run verify`).

---

## 3. Resource & Risk Estimate

- **Estimated Files to Modify**: ~7 (`status.svelte.js`, `chrono.svelte.js`, `Feed.svelte`, `Message.svelte`, `StoryboardBar.svelte`, `storyboard.svelte.js`, `Shimmer.svelte`)
- **Estimated Tests**: Unit tests for status lifecycle transitions and storyboard guard conditions.
