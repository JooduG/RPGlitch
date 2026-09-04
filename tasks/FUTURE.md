<!--
  tasks/FUTURE.md
  🎯 ACTIVE IMPLEMENTATION BLUEPRINT (Mirror of Active Track)

  Track ID: track-generation-flow-and-storyboard-guards-2026-09-05
  Dependencies: tasks/PRESENT.md, tasks/tracks/track-generation-flow-and-storyboard-guards-2026-09-05.md, scribbles.md, DESIGN.md
  Status: [~] Active
-->

# 🎯 Active Track Implementation Plan: Generation Flow, Speaker Avatar Thinking Indicators & Storyboard Active Session Guards

**Track ID**: `track-generation-flow-and-storyboard-guards-2026-09-05`  
**Dependencies**: `tasks/PRESENT.md`, `scribbles.md`, `DESIGN.md`  
**Status**: `[~]` Active

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

### Phase 1: Test-Driven Red Suite (State & Lifecycle Contracts)

- [ ] `task-1.1`: Extend `src/state/status.test.js` with failing unit tests covering fine-grained generation stages: `director_thinking`, `speaker_thinking`, `start_director_stage()`, `set_delegated_speaker()`, `start_stream_stage()`, and state resets on `complete()`.
- [ ] `task-1.2`: Extend `src/state/chrono.test.js` with tests verifying state transitions from Director Quick Shot initiation to speaker delegation and stream completion.

### Phase 2: Simulation State Machine Hardening (GREEN)

- [ ] `task-2.1`: Update `src/state/status.svelte.js` to add private runes `#director_thinking` and `#speaker_thinking` with getters/setters, lifecycle methods (`start_director_stage`, `set_delegated_speaker`, `start_stream_stage`, `complete`), and derived helper properties.
- [ ] `task-2.2`: Wire stage transitions in `src/state/chrono.svelte.js` and `src/intelligence/story-pipeline.js` ensuring `set_delegated_speaker` is called as soon as Director Quick Shot finishes and before streaming begins.

### Phase 3: Feed & Speaker Thinking Indicator UI (GREEN)

- [ ] `task-3.1`: Create or integrate a pending turn indicator slot in `src/ui/message/Feed.svelte` that activates during `simulation_state.busy` when streaming content is not yet committed to `visible_feed`.
- [ ] `task-3.2`: Render the Director thinking shimmer when `simulation_state.director_thinking`.
- [ ] `task-3.3`: Render the speaker portrait in the left gutter when `simulation_state.generating_entity` is populated, with kinetic signature-color thinking indicator animation.
- [ ] `task-3.4`: Transition into `Message.svelte` chassis when typewriter streaming starts, ensuring completion chime triggers on typewriter finish.

### Phase 4: Storyboard Active Story Guard Dialog (GREEN)

- [ ] `task-4.1`: Add unit tests for active story guard logic in `src/ui/storyboard.test.js` or `src/ui/Storyboard.svelte.test.js`.
- [ ] `task-4.2`: Update `src/ui/console/StoryboardBar.svelte` and `src/ui/storyboard.svelte.js` to trigger a confirmation Dialog when attempting to begin a story while `has_active_story` is true.
- [ ] `task-4.3`: Implement the 3 actions: Resume Story, Conclude & Start New, and Cancel.

### Phase 5: Shimmer Harmonization & Verification

- [ ] `task-5.1`: Tune `src/ui/motion/Shimmer.svelte` gradient opacity and animation timing to soften harsh visual sweep.
- [ ] `task-5.2`: Run full test suite (`npm run verify`), ensure 0 linter errors, 0 Svelte diagnostics, and clean single-file production build (`npm run build`).

---

## 3. Resource & Risk Estimate

- **Estimated Files to Modify**: ~7 (`status.svelte.js`, `status.test.js`, `chrono.svelte.js`, `Feed.svelte`, `Message.svelte`, `StoryboardBar.svelte`, `storyboard.svelte.js`, `Shimmer.svelte`)
- **Estimated Tests**: Unit tests for status lifecycle transitions and storyboard guard conditions.
